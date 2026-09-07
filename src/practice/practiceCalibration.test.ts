import { describe, expect, it } from 'vitest';
import { createPitchTrajectory } from '../test/pitchTrajectories';
import {
  createIdlePracticeSession,
  createPracticeObservation,
  finishPracticeSession,
  processPracticeObservation,
  startPracticeSession,
} from './practiceSession';

export function summarizeTrajectory(
  name: Parameters<typeof createPitchTrajectory>[0],
  cadenceHz = 15,
  phase = 0,
) {
  let state = startPracticeSession(
    createIdlePracticeSession(),
    { midiNote: 69, label: 'A4', frequencyHz: 440 },
    0,
    1,
  );
  for (const frame of createPitchTrajectory(name, cadenceHz, phase)) {
    state = processPracticeObservation(
      state,
      frame.cents === null
        ? { kind: 'no-pitch' }
        : createPracticeObservation(frame.cents)!,
      frame.timestampMs,
    );
  }
  const finished = finishPracticeSession(state, 4001);
  if (finished.status !== 'completed')
    throw new Error('Expected completed fixture');
  return finished.summary;
}

describe('current practice band occupancy (not a success grade)', () => {
  it('reproduces low band occupancy for a centered vibrato and sampling-phase sensitivity', () => {
    expect(summarizeTrajectory('center').onTargetShare).toBe(1);
    expect(summarizeTrajectory('vibrato').onTargetShare).toBeCloseTo(1 / 3, 8);
    expect(summarizeTrajectory('vibrato', 15, Math.PI / 2).onTargetShare).toBe(
      0,
    );
    expect(summarizeTrajectory('vibrato', 120).onTargetShare).toBeCloseTo(
      0.25,
      8,
    );
  });
  it.each(['flat15', 'flat30'] as const)(
    'reports zero band occupancy for %s',
    (name) => {
      expect(summarizeTrajectory(name).onTargetShare).toBe(0);
    },
  );
  it('excludes silence from measured voice and the share denominator', () => {
    const summary = summarizeTrajectory('silence');
    expect(summary.measurableVoicedMs).toBe(0);
    expect(summary.onTargetShare).toBeNull();
    expect(summary.noPitchMs).toBe(4000);
    expect(summary.unobservedMs).toBe(1);
  });
});

describe('pitch-center accuracy separately from variation', () => {
  it.each([
    'center',
    'vibrato',
    'biased-vibrato',
    'flat15',
    'flat30',
    'approach',
    'random',
  ] as const)('preserves raw time-weighted precision for %s', (name) => {
    const summary = summarizeTrajectory(name);
    const cents = createPitchTrajectory(name).map((frame) => frame.cents!);
    const mean = cents.reduce((sum, value) => sum + value, 0) / cents.length;
    const variance =
      cents.reduce((sum, value) => sum + (value - mean) ** 2, 0) / cents.length;
    expect(summary.pitchMeanCents).toBeCloseTo(mean, 8);
    expect(
      summary.pitchM2CentsSquaredMs / summary.measurableVoicedMs,
    ).toBeCloseTo(variance, 8);
  });
});
