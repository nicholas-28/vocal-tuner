import { createPitchSource } from '../pitch/pitchSource';
import type { RawPitchDetection } from '../types/pitch';

/** Explicitly stepped test/development fixture. Never imported by production. */
export function createStubPitchSource(sequence: readonly RawPitchDetection[]) {
  const frames = sequence.map((frame) => ({
    ...frame,
    settings: { ...frame.settings },
  }));
  let previous = -1;
  for (const frame of frames) {
    if (
      !Number.isFinite(frame.timestampMs) ||
      frame.timestampMs < 0 ||
      frame.timestampMs <= previous
    )
      throw new Error(
        'Stub timestamps must be nonnegative and strictly increasing.',
      );
    previous = frame.timestampMs;
  }
  let now = 0;
  let index = 0;
  let generation = 1;
  const producer = createPitchSource(() => now);
  producer.beginSession(generation);
  return {
    source: producer.source,
    step() {
      const frame = frames[index++];
      if (!frame) {
        producer.invalidate('inactive');
        return null;
      }
      now = frame.timestampMs;
      producer.publish(frame, generation);
      return producer.source.getLatest();
    },
    reset() {
      index = 0;
      now = 0;
      producer.beginSession(++generation);
    },
  };
}
