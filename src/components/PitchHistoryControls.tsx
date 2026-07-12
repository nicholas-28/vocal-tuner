import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';

type PitchHistoryControlsProps = {
  captureState: PitchHistoryCaptureState;
  sessionActive: boolean;
  historyEmpty: boolean;
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
};

export function PitchHistoryControls({
  captureState,
  sessionActive,
  historyEmpty,
  onPause,
  onResume,
  onClear,
}: PitchHistoryControlsProps) {
  const paused = captureState.status === 'paused';
  return (
    <div className="history-controls">
      <button
        className="secondary-button"
        type="button"
        disabled={!sessionActive}
        onClick={paused ? onResume : onPause}
      >
        {paused ? 'Resume history' : 'Pause history'}
      </button>
      <button
        className="secondary-button"
        type="button"
        disabled={historyEmpty}
        onClick={onClear}
      >
        Clear history
      </button>
    </div>
  );
}
