export type RecordingPitchHistoryCapture = Readonly<{
  status: 'recording';
  accumulatedPausedDurationMs: number;
  resumeBoundaryEffectiveMs: number | null;
}>;

export type PausedPitchHistoryCapture = Readonly<{
  status: 'paused';
  accumulatedPausedDurationMs: number;
  pauseStartedSourceMs: number;
  frozenEffectiveTimeMs: number;
}>;

export type PitchHistoryCaptureState =
  RecordingPitchHistoryCapture | PausedPitchHistoryCapture;
