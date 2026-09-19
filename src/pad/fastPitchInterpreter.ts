import { isFreshPitchSample } from '../pitch/pitchSource';
import { DEFAULT_PITCH_CONTINUITY_CONFIG } from '../pitch/pitchContinuityConfig';
import { smoothVisualCents } from '../tuner/visualResponse';
import { PAD_TUNING } from './padConfig';
import type {
  FastPitchFrame,
  FastPitchInterpreter,
  FastPitchInterpreterOptions,
} from './types';

const pitchClassOf = (semitone: number) => ((semitone % 12) + 12) % 12;

/** Polls the existing source; owns no subscriptions, clocks, or audio resources. */
export function createFastPitchInterpreter({
  source,
  gracePeriodMs = DEFAULT_PITCH_CONTINUITY_CONFIG.gracePeriodMs,
  tuning = PAD_TUNING,
}: FastPitchInterpreterOptions): FastPitchInterpreter {
  let generation: number | null = null;
  let consumedAtMs: number | null = null;
  let clockMs: number | null = null;
  let resetPending = false;
  let lastVoicedAtMs: number | null = null;
  let target: number | null = null;
  let shimmer: number | null = null;
  let harmony: number | null = null;
  let acceptedSemitone: number | null = null;
  let candidateSemitone: number | null = null;
  let candidateSinceMs = 0;
  let octaveShift = 0;
  let octaveSinceMs = 0;
  let octaveFolded = false;
  let latestVoiced = false;

  function clearPitch() {
    target = shimmer = harmony = acceptedSemitone = candidateSemitone = null;
    candidateSinceMs = octaveSinceMs = octaveShift = 0;
    octaveFolded = latestVoiced = false;
  }

  function clearSession() {
    clearPitch();
    lastVoicedAtMs = consumedAtMs = null;
  }

  function frame(
    nowMs: number,
    evidence: FastPitchFrame['evidence'],
  ): FastPitchFrame {
    return {
      phase:
        target !== null
          ? latestVoiced
            ? 'voiced'
            : 'grace'
          : lastVoicedAtMs === null
            ? 'idle'
            : 'releasing',
      atMs: nowMs,
      targetCents: target,
      shimmerCents: shimmer,
      harmonyCents: harmony,
      pitchClass:
        acceptedSemitone === null ? null : pitchClassOf(acceptedSemitone),
      octaveFolded,
      lastVoicedAtMs,
      evidence,
    };
  }

  function advance(toMs: number) {
    if (lastVoicedAtMs !== null && toMs - lastVoicedAtMs > gracePeriodMs) {
      clearPitch();
    } else if (
      target !== null &&
      shimmer !== null &&
      harmony !== null &&
      clockMs !== null
    ) {
      const elapsedMs = toMs - clockMs;
      shimmer = smoothVisualCents(
        shimmer,
        target,
        elapsedMs,
        tuning.shimmerQuietTimeConstantMs,
      );
      harmony +=
        (target - harmony) *
        -Math.expm1(-elapsedMs / tuning.harmonyTimeConstantMs);
    }
    clockMs = toMs;
  }

  function acceptPitch(cents: number, atMs: number) {
    octaveFolded = false;
    const shift =
      target === null ? 0 : Math.round((cents - target) / 1200) * 1200;
    if (
      target !== null &&
      Math.abs(shift) === 1200 &&
      Math.abs(cents - target - shift) <= tuning.octaveFoldToleranceCents
    ) {
      if (octaveShift !== shift) {
        octaveShift = shift;
        octaveSinceMs = atMs;
      }
      if (atMs - octaveSinceMs < tuning.octaveConfirmMs) {
        cents -= shift;
        octaveFolded = true;
      } else {
        // Translate the harmony coordinate with the confirmed octave. Smoothing
        // through intervening pitch classes would invent a harmonic scale run.
        if (harmony !== null) harmony += shift;
        if (acceptedSemitone !== null) acceptedSemitone += shift / 100;
        if (candidateSemitone !== null) candidateSemitone += shift / 100;
        octaveShift = 0;
      }
    } else {
      octaveShift = 0;
    }
    target = cents;
    shimmer ??= cents;
    harmony ??= cents;
    lastVoicedAtMs = atMs;
    latestVoiced = true;
  }

  function quantize(nowMs: number) {
    if (!latestVoiced || harmony === null) {
      candidateSemitone = null;
      return;
    }
    if (acceptedSemitone !== null) {
      // Compare to the nearest octave of the accepted class.
      const center =
        acceptedSemitone * 100 +
        Math.round((harmony - acceptedSemitone * 100) / 1200) * 1200;
      if (Math.abs(harmony - center) <= 50 + tuning.pitchClassHysteresisCents) {
        candidateSemitone = null;
        return;
      }
    }
    const next = Math.round(harmony / 100);
    if (candidateSemitone !== next) {
      candidateSemitone = next;
      candidateSinceMs = nowMs;
    }
    if (nowMs - candidateSinceMs >= tuning.pitchClassDwellMs) {
      acceptedSemitone = next;
      candidateSemitone = null;
    }
  }

  return {
    update(nowMs) {
      if (
        !Number.isFinite(nowMs) ||
        nowMs < 0 ||
        (clockMs !== null && nowMs < clockMs)
      )
        throw new RangeError(
          'Update time must be finite, nonnegative, and monotonic.',
        );
      const sample = source.getLatest();
      if (
        resetPending ||
        sample === null ||
        (generation !== null && sample.sessionGeneration !== generation)
      ) {
        clearSession();
        generation = sample?.sessionGeneration ?? null;
        clockMs = nowMs;
        resetPending = false;
        // The frozen frame has no generation field. This explicit idle frame
        // resets HarmonyModel even if it missed the source's session marker.
        return frame(nowMs, 'none');
      }
      generation = sample.sessionGeneration;
      const timestampMs = sample.timestampMs;
      const fresh = isFreshPitchSample(sample, nowMs);
      let newVoiced = false;
      if (
        fresh &&
        timestampMs !== null &&
        (consumedAtMs === null || timestampMs > consumedAtMs)
      ) {
        // Integrate the previous target up to evidence arrival. Late delivery
        // changes targets now; it never rewrites time already integrated.
        if (clockMs === null || timestampMs > clockMs) advance(timestampMs);
        consumedAtMs = timestampMs;
        if (
          sample.voicing === 'voiced' &&
          sample.fractionalMidi !== null &&
          Number.isFinite(sample.fractionalMidi) &&
          nowMs - timestampMs <= gracePeriodMs
        ) {
          acceptPitch(sample.fractionalMidi * 100, timestampMs);
          newVoiced = true;
        } else {
          latestVoiced = false;
          octaveShift = 0;
        }
      } else if (timestampMs === null || timestampMs <= nowMs) {
        if (!fresh || sample.voicing !== 'voiced') {
          latestVoiced = false;
          octaveShift = 0;
        }
      }
      // A future sample is deliberately not marked consumed, nor called stale.
      advance(nowMs);
      quantize(nowMs);
      return frame(
        nowMs,
        newVoiced
          ? 'sample'
          : latestVoiced && target !== null
            ? 'interpolated'
            : 'none',
      );
    },
    reset() {
      clearSession();
      generation = clockMs = null;
      resetPending = true;
    },
  };
}
