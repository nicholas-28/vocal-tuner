import type {
  PitchHistoryCaptureState,
  RecordingPitchHistoryCapture,
} from '../types/pitchHistoryCapture';

export function createRecordingCaptureState(): PitchHistoryCaptureState {
  return {
    status: 'recording',
    accumulatedPausedDurationMs: 0,
    resumeBoundaryEffectiveMs: null,
  };
}

export function pausePitchHistoryCapture(
  state: PitchHistoryCaptureState,
  sourceTimestampMs: number,
): PitchHistoryCaptureState {
  if (
    state.status !== 'recording' ||
    !isValidSourceTimestamp(sourceTimestampMs) ||
    sourceTimestampMs < state.accumulatedPausedDurationMs
  ) {
    return state;
  }
  return {
    status: 'paused',
    accumulatedPausedDurationMs: state.accumulatedPausedDurationMs,
    pauseStartedSourceMs: sourceTimestampMs,
    frozenEffectiveTimeMs:
      sourceTimestampMs - state.accumulatedPausedDurationMs,
  };
}

export function resumePitchHistoryCapture(
  state: PitchHistoryCaptureState,
  sourceTimestampMs: number,
): PitchHistoryCaptureState {
  if (
    state.status !== 'paused' ||
    !isValidSourceTimestamp(sourceTimestampMs) ||
    sourceTimestampMs < state.pauseStartedSourceMs
  ) {
    return state;
  }
  return {
    status: 'recording',
    accumulatedPausedDurationMs:
      state.accumulatedPausedDurationMs +
      (sourceTimestampMs - state.pauseStartedSourceMs),
    resumeBoundaryEffectiveMs: state.frozenEffectiveTimeMs,
  };
}

export function sourceToEffectiveHistoryTimestamp(
  state: PitchHistoryCaptureState,
  sourceTimestampMs: number,
): number | null {
  if (!isValidSourceTimestamp(sourceTimestampMs)) return null;
  if (state.status === 'paused') return state.frozenEffectiveTimeMs;
  const effectiveTimestampMs =
    sourceTimestampMs - state.accumulatedPausedDurationMs;
  return Number.isFinite(effectiveTimestampMs) && effectiveTimestampMs >= 0
    ? effectiveTimestampMs
    : null;
}

export function consumeResumeBoundary(
  state: PitchHistoryCaptureState,
): PitchHistoryCaptureState {
  return state.status === 'recording' &&
    state.resumeBoundaryEffectiveMs !== null
    ? { ...state, resumeBoundaryEffectiveMs: null }
    : state;
}

export function isHistoryIngestionAllowed(
  state: PitchHistoryCaptureState,
): state is RecordingPitchHistoryCapture {
  return state.status === 'recording';
}

function isValidSourceTimestamp(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
