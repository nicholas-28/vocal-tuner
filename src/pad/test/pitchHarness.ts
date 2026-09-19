import { createPitchSource } from '../../pitch/pitchSource';
import { createPitchDetection } from '../../test/pitchFixture';
import { createFastPitchInterpreter } from '../fastPitchInterpreter';
import { createHarmonyModel } from '../harmonyModel';
import type {
  FastPitchFrame,
  FastPitchInterpreterOptions,
  HarmonyState,
} from '../types';

/** Deterministic driver around the real producer, local to pad tests. */
export function createPitchHarness(
  options: Omit<FastPitchInterpreterOptions, 'source'> = {},
) {
  let now = 0;
  let generation = 1;
  const producer = createPitchSource(() => now);
  producer.beginSession(generation);
  const interpreter = createFastPitchInterpreter({
    source: producer.source,
    ...options,
  });
  const harmony = createHarmonyModel();
  return {
    producer,
    interpreter,
    harmony,
    publish(atMs: number, cents: number | null, uncertain = false) {
      now = atMs;
      const ok = producer.publish(
        createPitchDetection({
          timestampMs: atMs,
          frequencyHz:
            cents === null ? null : 440 * 2 ** ((cents - 6900) / 1200),
          rejectionReason:
            cents === null
              ? uncertain
                ? 'low-confidence'
                : 'silence'
              : 'detected',
        }),
        generation,
      );
      if (!ok) throw new Error('Test publication was rejected.');
    },
    update(atMs: number) {
      now = atMs;
      const frame = interpreter.update(atMs);
      return { frame, harmony: harmony.next(frame) };
    },
    newSession() {
      producer.beginSession(++generation);
    },
  };
}

export function runSignal(
  centsAt: (atMs: number) => number | null,
  durationMs: number,
  evidenceHz = 30,
  consumerHz = 60,
) {
  const harness = createPitchHarness();
  const rows: { frame: FastPitchFrame; harmony: HarmonyState }[] = [];
  let evidenceIndex = 0;
  for (let index = 0; index <= (durationMs * consumerHz) / 1000; index++) {
    const nowMs = (index * 1000) / consumerHz;
    while ((evidenceIndex * 1000) / evidenceHz <= nowMs) {
      const atMs = (evidenceIndex++ * 1000) / evidenceHz;
      harness.publish(atMs, centsAt(atMs));
    }
    rows.push(harness.update(nowMs));
  }
  return rows;
}

export function voicedFrame(pitchClass: number, atMs = 0): FastPitchFrame {
  return {
    phase: 'voiced',
    atMs,
    targetCents: 6000 + pitchClass * 100,
    shimmerCents: 6000 + pitchClass * 100,
    harmonyCents: 6000 + pitchClass * 100,
    pitchClass,
    octaveFolded: false,
    lastVoicedAtMs: atMs,
    evidence: 'sample',
  };
}
