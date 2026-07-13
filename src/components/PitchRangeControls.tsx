import type {
  VisiblePitchRange,
  VisiblePitchRangePresetId,
} from '../types/visiblePitchRange';
import {
  DEFAULT_VISIBLE_PITCH_RANGE,
  VISIBLE_PITCH_RANGE_PRESETS,
  areVisiblePitchRangesEqual,
  getPitchRangePosition,
  getVisiblePitchRangeLabel,
} from '../visualization/visiblePitchRange';

type PitchRangeControlsProps = {
  range: VisiblePitchRange;
  selectedPresetId: VisiblePitchRangePresetId | null;
  canShiftDown: boolean;
  canShiftUp: boolean;
  currentMidi: number | null;
  onSelectPreset: (id: VisiblePitchRangePresetId) => void;
  onShiftDown: () => void;
  onShiftUp: () => void;
  onReset: () => void;
};

export function PitchRangeControls({
  range,
  selectedPresetId,
  canShiftDown,
  canShiftUp,
  currentMidi,
  onSelectPreset,
  onShiftDown,
  onShiftUp,
  onReset,
}: PitchRangeControlsProps) {
  const rangeLabel = getVisiblePitchRangeLabel(range) ?? 'Unavailable';
  const pitchPosition =
    currentMidi === null ? null : getPitchRangePosition(currentMidi, range);

  return (
    <fieldset className="pitch-range-controls">
      <legend>Visible graph range</legend>
      <div className="pitch-range-controls__presets">
        {VISIBLE_PITCH_RANGE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="range-button"
            type="button"
            aria-pressed={selectedPresetId === preset.id}
            onClick={() => onSelectPreset(preset.id)}
          >
            {getVisiblePitchRangeLabel(preset.range)}
          </button>
        ))}
      </div>
      <div className="pitch-range-controls__actions">
        <button
          className="secondary-button"
          type="button"
          disabled={!canShiftDown}
          onClick={onShiftDown}
        >
          Shift graph down one octave
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={areVisiblePitchRangesEqual(
            range,
            DEFAULT_VISIBLE_PITCH_RANGE,
          )}
          onClick={onReset}
        >
          Reset graph range
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={!canShiftUp}
          onClick={onShiftUp}
        >
          Shift graph up one octave
        </button>
      </div>
      <p className="pitch-range-controls__status" aria-live="polite">
        Current graph range: {rangeLabel}.
      </p>
      {pitchPosition === 'below' && (
        <p className="pitch-range-controls__outside">
          Current pitch is below the visible graph range.
        </p>
      )}
      {pitchPosition === 'above' && (
        <p className="pitch-range-controls__outside">
          Current pitch is above the visible graph range.
        </p>
      )}
    </fieldset>
  );
}
