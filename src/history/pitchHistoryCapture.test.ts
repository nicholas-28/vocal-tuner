import { describe, expect, it } from 'vitest';
import {
  consumeResumeBoundary,
  createRecordingCaptureState,
  isHistoryIngestionAllowed,
  pausePitchHistoryCapture,
  resumePitchHistoryCapture,
  sourceToEffectiveHistoryTimestamp,
} from './pitchHistoryCapture';

describe('pitch history capture time state', () => {
  it('starts recording and maps source time unchanged', () => {
    const state = createRecordingCaptureState();
    expect(state.status).toBe('recording');
    expect(isHistoryIngestionAllowed(state)).toBe(true);
    expect(sourceToEffectiveHistoryTimestamp(state, 1200)).toBe(1200);
  });

  it('freezes on pause and rebases a five-second resume interval', () => {
    const recording = createRecordingCaptureState();
    const paused = pausePitchHistoryCapture(recording, 1000);
    expect(paused.status).toBe('paused');
    expect(isHistoryIngestionAllowed(paused)).toBe(false);
    expect(sourceToEffectiveHistoryTimestamp(paused, 4000)).toBe(1000);
    const resumed = resumePitchHistoryCapture(paused, 6000);
    expect(resumed).toEqual({
      status: 'recording',
      accumulatedPausedDurationMs: 5000,
      resumeBoundaryEffectiveMs: 1000,
    });
    expect(sourceToEffectiveHistoryTimestamp(resumed, 6100)).toBe(1100);
  });

  it('accumulates multiple pauses without backward effective time', () => {
    const firstPause = pausePitchHistoryCapture(
      createRecordingCaptureState(),
      1000,
    );
    const firstResume = resumePitchHistoryCapture(firstPause, 3000);
    const secondPause = pausePitchHistoryCapture(firstResume, 4000);
    expect(sourceToEffectiveHistoryTimestamp(secondPause, 8000)).toBe(2000);
    const secondResume = resumePitchHistoryCapture(secondPause, 9000);
    expect(sourceToEffectiveHistoryTimestamp(secondResume, 9100)).toBe(2100);
    expect(secondResume).toMatchObject({
      accumulatedPausedDurationMs: 7000,
      resumeBoundaryEffectiveMs: 2000,
    });
  });

  it('ignores repeated and invalid transitions without NaN', () => {
    const recording = createRecordingCaptureState();
    expect(resumePitchHistoryCapture(recording, 100)).toBe(recording);
    expect(pausePitchHistoryCapture(recording, Number.NaN)).toBe(recording);
    const paused = pausePitchHistoryCapture(recording, 100);
    expect(pausePitchHistoryCapture(paused, 200)).toBe(paused);
    expect(resumePitchHistoryCapture(paused, 99)).toBe(paused);
    expect(resumePitchHistoryCapture(paused, Infinity)).toBe(paused);
    expect(sourceToEffectiveHistoryTimestamp(recording, Number.NaN)).toBeNull();
  });

  it('consumes exactly one pending resume boundary', () => {
    const resumed = resumePitchHistoryCapture(
      pausePitchHistoryCapture(createRecordingCaptureState(), 100),
      200,
    );
    const consumed = consumeResumeBoundary(resumed);
    expect(consumed).toMatchObject({ resumeBoundaryEffectiveMs: null });
    expect(consumeResumeBoundary(consumed)).toBe(consumed);
  });
});
