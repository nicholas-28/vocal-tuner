import { describe, expect, it } from 'vitest';
import {
  createIdlePracticeSession,
  createPracticeObservation,
  finishPracticeSession,
  pausePracticeSession,
  previewPracticeSession,
  processPracticeObservation,
  resumePracticeSession,
  startPracticeSession,
} from './practiceSession';
import { summarizePracticePitch } from './practicePitchStatistics';

const start = () =>
  startPracticeSession(
    createIdlePracticeSession(),
    { midiNote: 69, label: 'A4', frequencyHz: 440 },
    0,
    1,
  );

describe('raw practice statistics use exactly the accounted intervals', () => {
  it('weights unequal intervals and excludes held uncertainty, silence, and missing evidence', () => {
    let state = processPracticeObservation(
      start(),
      createPracticeObservation(10)!,
      1,
    );
    state = processPracticeObservation(
      state,
      createPracticeObservation(-20)!,
      51,
    );
    state = processPracticeObservation(state, { kind: 'uncertain' }, 201);
    state = processPracticeObservation(state, { kind: 'no-pitch' }, 301);
    state = processPracticeObservation(state, { kind: 'unobserved' }, 401);
    const finished = finishPracticeSession(state, 501);
    if (finished.status !== 'completed') throw new Error('Expected completion');
    expect(finished.summary).toMatchObject({
      measurableVoicedMs: 200,
      uncertainMs: 100,
      noPitchMs: 100,
      unobservedMs: 101,
    });
    const pitch = summarizePracticePitch(finished.summary)!;
    expect(pitch.meanCents).toBeCloseTo(-12.5, 8);
    expect(pitch.spreadCents).toBeCloseTo(Math.sqrt(168.75), 8);
  });
  it('does not extend statistics past the evidence cap or count previews twice', () => {
    const state = processPracticeObservation(
      start(),
      createPracticeObservation(15)!,
      1,
    );
    const preview = previewPracticeSession(state, 1001)!;
    expect(preview.measurableVoicedMs).toBe(250);
    expect(summarizePracticePitch(preview)).toEqual({
      meanCents: 15,
      spreadCents: 0,
    });
    expect(previewPracticeSession(state, 1001)).toEqual(preview);
    const finished = finishPracticeSession(state, 1001);
    if (finished.status !== 'completed') throw new Error('Expected completion');
    expect(finished.summary.pitchM2CentsSquaredMs).toBe(
      preview.pitchM2CentsSquaredMs,
    );
    expect(finished.summary.measurableVoicedMs).toBe(250);
    expect(
      summarizePracticePitch(previewPracticeSession(start(), 1001)!),
    ).toBeNull();
  });
  it('excludes pauses and post-resume waiting, rejects stale frames, and freezes completion', () => {
    let state = processPracticeObservation(
      start(),
      createPracticeObservation(10)!,
      1,
    );
    state = pausePracticeSession(state, 51);
    state = resumePracticeSession(state, 501, true);
    state = processPracticeObservation(
      state,
      createPracticeObservation(-20)!,
      601,
    );
    expect(
      processPracticeObservation(state, createPracticeObservation(50)!, 601),
    ).toBe(state);
    expect(
      processPracticeObservation(state, createPracticeObservation(50)!, 10),
    ).toBe(state);
    const finished = finishPracticeSession(state, 701);
    if (finished.status !== 'completed') throw new Error('Expected completion');
    expect(finished.summary.measurableVoicedMs).toBe(150);
    expect(summarizePracticePitch(finished.summary)!.meanCents).toBeCloseTo(
      -10,
      8,
    );
    expect(
      processPracticeObservation(finished, createPracticeObservation(50)!, 800),
    ).toBe(finished);
  });
});
