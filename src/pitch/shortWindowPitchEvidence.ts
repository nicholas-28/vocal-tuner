import {
  isFreshPitchSample,
  type PitchSample,
  type PitchSource,
} from './pitchSource';

export const SHORT_WINDOW_DURATION_MS = 500;
export const SHORT_WINDOW_CAPACITY = 64;
/** Duration credit, independent of the source's latest-sample freshness horizon. */
export const SHORT_WINDOW_MAX_EVIDENCE_CREDIT_MS = 100;
const MIN_VOICED_DURATION_MS = 300;
const MIN_VOICED_SAMPLES = 6;

type WeightedPitch = { cents: number; durationMs: number };

export type ShortWindowPitchEvidence = Readonly<{
  windowStartMs: number;
  windowEndMs: number;
  windowDurationMs: number;
  sessionGeneration: number | null;
  freshSampleCount: number;
  voicedSampleCount: number;
  voicedDurationMs: number;
  voicedCoverage: number;
  unvoicedDurationMs: number;
  uncertainDurationMs: number;
  unobservedDurationMs: number;
  centerFractionalMidi: number | null;
  spreadCents: number | null;
  /** Voiced/unvoiced/uncertain mean the latest observation is also fresh now. */
  latestState: 'voiced' | 'unvoiced' | 'uncertain' | 'stale' | 'inactive';
  latestFractionalMidi: number | null;
  windowSufficiency:
    'sufficient' | 'insufficient-samples' | 'insufficient-duration';
}>;

export type TargetPitchEvidence = Readonly<{
  targetMidi: number;
  centerOffsetCents: number | null;
  latestOffsetCents: number | null;
}>;

/** Target interpretation does not alter the underlying voice measurements. */
export function projectEvidenceToTarget(
  evidence: ShortWindowPitchEvidence,
  targetMidi: number,
): TargetPitchEvidence | null {
  if (!Number.isInteger(targetMidi)) return null;
  return {
    targetMidi,
    centerOffsetCents:
      evidence.centerFractionalMidi === null
        ? null
        : (evidence.centerFractionalMidi - targetMidi) * 100,
    latestOffsetCents:
      evidence.latestFractionalMidi === null
        ? null
        : (evidence.latestFractionalMidi - targetMidi) * 100,
  };
}

/** Subscribes to detector observations; snapshot reads do not record evidence. */
export function createShortWindowPitchEvidence(source: PitchSource) {
  const ring = new Array<PitchSample | undefined>(SHORT_WINDOW_CAPACITY);
  let cursor = 0;
  let count = 0;
  let latest: PitchSample | null = null;
  let disposed = false;

  const reset = () => {
    ring.fill(undefined);
    cursor = 0;
    count = 0;
  };
  const ingest = (sample: PitchSample | null) => {
    if (disposed) return;
    if (
      sample === null ||
      sample.freshness !== 'fresh' ||
      sample.timestampMs === null
    ) {
      latest = sample;
      reset();
      return;
    }
    if (
      latest?.sessionGeneration !== sample.sessionGeneration ||
      latest.freshness !== 'fresh'
    )
      reset();
    if (
      latest?.freshness === 'fresh' &&
      latest.timestampMs !== null &&
      sample.sessionGeneration === latest.sessionGeneration &&
      sample.timestampMs <= latest.timestampMs
    )
      return;
    ring[cursor] = sample;
    cursor = (cursor + 1) % SHORT_WINDOW_CAPACITY;
    count = Math.min(count + 1, SHORT_WINDOW_CAPACITY);
    latest = sample;
  };

  // The source retains a short backfill for consumers mounted after capture starts.
  const existing = source.getLatest();
  if (existing?.freshness === 'fresh') {
    for (const sample of source.getRecent(
      SHORT_WINDOW_DURATION_MS + SHORT_WINDOW_MAX_EVIDENCE_CREDIT_MS,
    ))
      ingest(sample);
  }
  if (latest === null) latest = existing;
  const unsubscribe = source.subscribe(ingest);

  return {
    getSnapshot(nowMs: number): ShortWindowPitchEvidence {
      if (!Number.isFinite(nowMs) || nowMs < 0)
        throw new RangeError('Snapshot time must be finite and nonnegative.');
      const windowStartMs = Math.max(0, nowMs - SHORT_WINDOW_DURATION_MS);
      const windowDurationMs = nowMs - windowStartMs;
      const samples: PitchSample[] = [];
      for (let index = 0; index < count; index += 1)
        samples.push(
          ring[
            (cursor - count + index + SHORT_WINDOW_CAPACITY) %
              SHORT_WINDOW_CAPACITY
          ]!,
        );
      let freshSampleCount = 0;
      let voicedSampleCount = 0;
      let voicedDurationMs = 0;
      let unvoicedDurationMs = 0;
      let uncertainDurationMs = 0;
      const pitches: WeightedPitch[] = [];
      for (let index = 0; index < samples.length; index += 1) {
        const sample = samples[index];
        const timestampMs = sample.timestampMs!;
        if (timestampMs > nowMs) break;
        if (timestampMs >= windowStartMs) {
          freshSampleCount += 1;
          if (sample.voicing === 'voiced') voicedSampleCount += 1;
        }
        const nextTimestampMs = samples[index + 1]?.timestampMs;
        if (nextTimestampMs === null || nextTimestampMs === undefined) continue;
        const startMs = Math.max(windowStartMs, timestampMs);
        const endMs = Math.min(
          nowMs,
          nextTimestampMs,
          timestampMs + SHORT_WINDOW_MAX_EVIDENCE_CREDIT_MS,
        );
        const durationMs = Math.max(0, endMs - startMs);
        if (sample.voicing === 'voiced' && sample.fractionalMidi !== null) {
          voicedDurationMs += durationMs;
          if (durationMs > 0)
            pitches.push({
              cents: sample.fractionalMidi * 100,
              durationMs,
            });
        } else if (sample.voicing === 'unvoiced') {
          unvoicedDurationMs += durationMs;
        } else {
          uncertainDurationMs += durationMs;
        }
      }
      pitches.sort((a, b) => a.cents - b.cents);
      const centerCents = weightedPercentile(pitches, voicedDurationMs, 0.5);
      const lowCents = weightedPercentile(pitches, voicedDurationMs, 0.1);
      const highCents = weightedPercentile(pitches, voicedDurationMs, 0.9);
      const latestState =
        latest === null || latest.freshness === 'inactive'
          ? 'inactive'
          : !isFreshPitchSample(latest, nowMs)
            ? 'stale'
            : latest.voicing;
      const latestFractionalMidi =
        latestState === 'voiced' ? latest!.fractionalMidi : null;
      const windowSufficiency =
        voicedSampleCount < MIN_VOICED_SAMPLES
          ? 'insufficient-samples'
          : voicedDurationMs < MIN_VOICED_DURATION_MS
            ? 'insufficient-duration'
            : 'sufficient';
      return {
        windowStartMs,
        windowEndMs: nowMs,
        windowDurationMs,
        sessionGeneration: latest?.sessionGeneration ?? null,
        freshSampleCount,
        voicedSampleCount,
        voicedDurationMs,
        voicedCoverage:
          windowDurationMs > 0 ? voicedDurationMs / windowDurationMs : 0,
        unvoicedDurationMs,
        uncertainDurationMs,
        unobservedDurationMs: Math.max(
          0,
          windowDurationMs -
            voicedDurationMs -
            unvoicedDurationMs -
            uncertainDurationMs,
        ),
        centerFractionalMidi: centerCents === null ? null : centerCents / 100,
        spreadCents:
          lowCents === null || highCents === null
            ? null
            : (highCents - lowCents) / 2,
        latestFractionalMidi,
        latestState,
        windowSufficiency,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      latest = null;
      reset();
    },
  };
}

function weightedPercentile(
  pitches: readonly WeightedPitch[],
  totalDurationMs: number,
  percentile: number,
): number | null {
  if (totalDurationMs <= 0) return null;
  const threshold = totalDurationMs * percentile;
  let cumulativeMs = 0;
  for (const pitch of pitches) {
    cumulativeMs += pitch.durationMs;
    if (cumulativeMs >= threshold) return pitch.cents;
  }
  return pitches[pitches.length - 1]?.cents ?? null;
}
