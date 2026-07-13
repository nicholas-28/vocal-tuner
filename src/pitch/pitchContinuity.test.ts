import { describe, expect, it } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import {
  createPitchContinuityState,
  transitionPitchContinuity,
} from './pitchContinuity';

const accepted = (timestampMs: number, frequencyHz = 220) =>
  createPitchDetection({
    timestampMs,
    frequencyHz,
    rawCandidateFrequencyHz: frequencyHz,
  });
const rejected = (
  timestampMs: number,
  rejectionReason: 'low-confidence' | 'silence' = 'low-confidence',
) =>
  createPitchDetection({
    timestampMs,
    frequencyHz: null,
    confidence: 0,
    rejectionReason,
  });

function run(...detections: ReturnType<typeof accepted>[]) {
  let state = createPitchContinuityState();
  return detections.map((detection) => {
    const transition = transitionPitchContinuity(state, detection);
    state = transition.state;
    return transition;
  });
}

describe('pitch continuity', () => {
  it('starts unvoiced and does not let noise enter through grace logic', () => {
    const state = createPitchContinuityState();
    const transition = transitionPitchContinuity(
      state,
      rejected(100, 'silence'),
    );
    expect(state.status).toBe('unvoiced');
    expect(transition.state.status).toBe('unvoiced');
    expect(transition.decision.kind).toBe('no-change');
  });

  it.each([159, 160])(
    'recovers a %d ms interruption without a gap or synthetic pitch',
    (durationMs) => {
      const transitions = run(
        accepted(100),
        rejected(120),
        accepted(120 + durationMs, 221),
      );
      expect(transitions.map(({ decision }) => decision.kind)).toEqual([
        'pitch',
        'hold',
        'pitch',
      ]);
      expect(transitions[2].decision).toMatchObject({
        source: 'raw',
        gapBeforeTimestampMs: null,
      });
      expect(transitions[2].state.statistics.uncertaintiesRecovered).toBe(1);
    },
  );

  it('confirms one gap at 161 ms and resumes only with the next raw pitch', () => {
    const transitions = run(
      accepted(100),
      rejected(120, 'silence'),
      rejected(281, 'silence'),
      rejected(350, 'silence'),
      accepted(400, 222),
    );
    expect(transitions.map(({ decision }) => decision.kind)).toEqual([
      'pitch',
      'hold',
      'gap',
      'no-change',
      'pitch',
    ]);
    expect(transitions[2].decision).toEqual({
      kind: 'gap',
      reason: 'continuity-timeout',
      timestampMs: 120,
    });
    expect(transitions[4].state.statistics.confirmedGaps).toBe(1);
  });

  it('does not filter valid vibrato or glide values', () => {
    const frequencies = [220, 222, 219, 224, 228];
    const transitions = run(
      ...frequencies.map((frequency, index) =>
        accepted(100 + index * 67, frequency),
      ),
    );
    expect(
      transitions.map(({ state }) => state.lastAcceptedPitch?.frequencyHz),
    ).toEqual(frequencies);
  });

  it('ignores duplicate, regressed, and non-finite timestamps', () => {
    const transitions = run(
      accepted(100),
      accepted(100, 221),
      accepted(99, 222),
      accepted(Number.NaN, 223),
    );
    expect(transitions.slice(1).map(({ decision }) => decision)).toEqual([
      { kind: 'no-change', reason: 'timestamp-regression' },
      { kind: 'no-change', reason: 'timestamp-regression' },
      { kind: 'no-change', reason: 'timestamp-regression' },
    ]);
    expect(transitions[3].state.lastAcceptedPitch?.frequencyHz).toBe(220);
  });

  it('keeps separate uncertainty episodes deterministic and bounded', () => {
    const transitions = run(
      accepted(100),
      rejected(167),
      accepted(234),
      rejected(301),
      accepted(368),
    );
    const statistics = transitions.at(-1)!.state.statistics;
    expect(statistics.briefUncertainties).toBe(2);
    expect(statistics.uncertaintiesRecovered).toBe(2);
    expect(statistics.confirmedGaps).toBe(0);
    expect(statistics.totalUncertaintyDurationMs).toBe(134);
  });
});
