import { frequencyToMusicalPitch } from '../music/pitchConversion';
import type { RawPitchDetection } from '../types/pitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';

export const PITCH_SOURCE_CAPACITY = 256;
export const PITCH_SOURCE_MAX_AGE_MS = 250;

type RawObservation = Readonly<Omit<RawPitchDetection, 'settings'>> & {
  readonly settings: Readonly<RawPitchDetection['settings']>;
};

/** Current-frame evidence, never continuity-held or visually smoothed pitch. */
export type PitchSample = Readonly<{
  // Null before the session's first observation; invalidation preserves its time.
  timestampMs: number | null;
  frequencyHz: number | null;
  fractionalMidi: number | null;
  nearestMidi: number | null;
  cents: number | null;
  confidence: number;
  voicing: PitchContinuityStatus;
  /** Publication/lifecycle state; use isFreshPitchSample for current-live evidence. */
  freshness: 'fresh' | 'stale' | 'inactive';
  sessionGeneration: number;
  raw: RawObservation | null;
}>;

type Listener = (sample: PitchSample | null) => void;
export interface PitchSource {
  subscribe(listener: Listener): () => void;
  getLatest(): PitchSample | null;
  getRecent(windowMs: number): readonly PitchSample[];
}

/** Check age on the consumer clock too: JavaScript lifecycle events can be delayed. */
export function isFreshPitchSample(
  sample: PitchSample | null,
  nowMs: number,
): boolean {
  return (
    sample !== null &&
    sample.freshness === 'fresh' &&
    sample.timestampMs !== null &&
    Number.isFinite(nowMs) &&
    nowMs >= sample.timestampMs &&
    nowMs - sample.timestampMs <= PITCH_SOURCE_MAX_AGE_MS
  );
}

/** Producer authority is separate from the consumer view. No global instance. */
export function createPitchSource(now: () => number = () => performance.now()) {
  let latest: PitchSample | null = null;
  let generation = -1;
  let active = false;
  let revision = 0;
  let lastTimestamp: number | null = null;
  const listeners = new Set<Listener>();
  const recent = new Array<PitchSample | undefined>(PITCH_SOURCE_CAPACITY);
  let cursor = 0;
  let count = 0;

  const resetRecent = () => {
    recent.fill(undefined);
    cursor = 0;
    count = 0;
  };
  const notify = () => {
    const publication = ++revision;
    const sample = latest;
    // Added listeners wait for the next publication. Removal takes effect now.
    for (const listener of [...listeners]) {
      if (publication !== revision) break; // A reentrant publication supersedes this one.
      if (!listeners.has(listener)) continue;
      try {
        listener(sample);
      } catch {
        /* A consumer cannot break capture or other consumers. */
      }
    }
  };
  const marker = (freshness: 'stale' | 'inactive'): PitchSample =>
    Object.freeze({
      timestampMs: lastTimestamp,
      frequencyHz: null,
      fractionalMidi: null,
      nearestMidi: null,
      cents: null,
      confidence: 0,
      voicing: 'unvoiced',
      freshness,
      sessionGeneration: generation,
      raw: null,
    });
  const source: PitchSource = Object.freeze({
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getLatest: () => latest,
    getRecent(windowMs: number) {
      if (!Number.isFinite(windowMs) || windowMs < 0) return [];
      const end = now();
      const result: PitchSample[] = [];
      for (let index = 0; index < count; index += 1) {
        const sample =
          recent[
            (cursor - count + index + PITCH_SOURCE_CAPACITY) %
              PITCH_SOURCE_CAPACITY
          ]!;
        if (
          sample.timestampMs !== null &&
          sample.timestampMs >= end - windowMs &&
          sample.timestampMs <= end
        )
          result.push(sample);
      }
      return result;
    },
  });
  return {
    source,
    /** Clears evidence and revokes the current producer session. Owner only. */
    clear() {
      active = false;
      latest = null;
      lastTimestamp = null;
      resetRecent();
      notify();
    },
    beginSession(sessionGeneration: number): boolean {
      if (
        !Number.isSafeInteger(sessionGeneration) ||
        sessionGeneration <= generation
      )
        return false;
      generation = sessionGeneration;
      active = true;
      lastTimestamp = null;
      resetRecent();
      latest = marker('inactive');
      notify();
      return true;
    },
    publish(detection: RawPitchDetection, sessionGeneration: number): boolean {
      if (
        !active ||
        sessionGeneration !== generation ||
        !Number.isFinite(detection.timestampMs) ||
        detection.timestampMs < 0 ||
        (lastTimestamp !== null && detection.timestampMs <= lastTimestamp)
      )
        return false;
      const pitch =
        detection.rejectionReason === 'detected'
          ? frequencyToMusicalPitch(detection.frequencyHz)
          : null;
      const raw = Object.freeze({
        ...detection,
        settings: Object.freeze({ ...detection.settings }),
      });
      lastTimestamp = detection.timestampMs;
      latest = Object.freeze({
        timestampMs: lastTimestamp,
        frequencyHz: pitch?.frequencyHz ?? null,
        fractionalMidi: pitch?.fractionalMidi ?? null,
        nearestMidi: pitch?.midiNote ?? null,
        cents: pitch?.cents ?? null,
        confidence: Number.isFinite(detection.confidence)
          ? Math.min(1, Math.max(0, detection.confidence))
          : 0,
        voicing: pitch
          ? 'voiced'
          : detection.rejectionReason === 'silence'
            ? 'unvoiced'
            : 'uncertain',
        freshness: 'fresh',
        sessionGeneration: generation,
        raw,
      });
      recent[cursor] = latest;
      cursor = (cursor + 1) % PITCH_SOURCE_CAPACITY;
      count = Math.min(count + 1, PITCH_SOURCE_CAPACITY);
      notify();
      return true;
    },
    invalidate(freshness: 'stale' | 'inactive' = 'inactive') {
      active = false;
      resetRecent();
      if (generation < 0) return;
      latest = marker(freshness);
      notify();
    },
  };
}
