import type { VisiblePitchRange } from '../types/visiblePitchRange';
import {
  MAXIMUM_VISIBLE_MIDI,
  MINIMUM_VISIBLE_MIDI,
  PITCH_ZOOM_SPANS,
  type PitchZoomSpan,
  getPitchRangePosition,
} from '../visualization/visiblePitchRange';
import { getPitchGridNote } from '../visualization/pitchGridNotes';

type PitchRangeControlsProps = {
  range: VisiblePitchRange;
  currentMidi: number | null;
  onZoom: (span: PitchZoomSpan) => void;
  onCenter: (midi: number) => void;
};

export function PitchRangeControls({
  range,
  currentMidi,
  onZoom,
  onCenter,
}: PitchRangeControlsProps) {
  const pitchPosition =
    currentMidi === null ? null : getPitchRangePosition(currentMidi, range);
  return (
    <div
      className="pitch-range-controls"
      role="group"
      aria-label="Visible graph range"
    >
      <label>
        Pitch span
        <select
          aria-label="Pitch span"
          value={range.highMidi - range.lowMidi}
          onChange={(event) =>
            onZoom(Number(event.target.value) as PitchZoomSpan)
          }
        >
          {PITCH_ZOOM_SPANS.map((span) => (
            <option key={span} value={span}>
              {span / 12} {span === 12 ? 'octave' : 'octaves'}
            </option>
          ))}
        </select>
      </label>
      <button
        className="secondary-button"
        type="button"
        disabled={currentMidi === null || !Number.isFinite(currentMidi)}
        onClick={() => currentMidi !== null && onCenter(currentMidi)}
      >
        Center my voice
      </button>
      {(pitchPosition === 'below' || pitchPosition === 'above') && (
        <p className="pitch-range-controls__outside">
          Current pitch is {pitchPosition} the visible graph range.
        </p>
      )}
    </div>
  );
}

export function PitchRangePositionControls({
  range,
  onCenter,
  onReset,
}: {
  range: VisiblePitchRange;
  onCenter: (midi: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      <label>
        Graph center note
        <select
          aria-label="Graph center note"
          value={(range.lowMidi + range.highMidi) / 2}
          onChange={(event) => onCenter(Number(event.target.value))}
        >
          {Array.from(
            { length: MAXIMUM_VISIBLE_MIDI - MINIMUM_VISIBLE_MIDI + 1 },
            (_, i) => i + MINIMUM_VISIBLE_MIDI,
          ).map((midi) => (
            <option value={midi} key={midi}>
              {getPitchGridNote(midi)?.label}
            </option>
          ))}
        </select>
      </label>
      <button className="secondary-button" type="button" onClick={onReset}>
        Reset graph range
      </button>
    </>
  );
}
