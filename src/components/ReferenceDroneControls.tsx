import { createReferenceKey } from '../reference/referenceKeyboard';
import type { ReferenceDroneSnapshot } from '../types/referenceDrone';

type ReferenceDroneControlsProps = {
  snapshot: ReferenceDroneSnapshot;
  selectedMidi: number | null;
  onStartSelected: (midiNote: number) => void;
  onStop: () => void;
  onVolumeChange: (normalizedVolume: number) => void;
};

export function ReferenceDroneControls({
  snapshot,
  selectedMidi,
  onStartSelected,
  onStop,
  onVolumeChange,
}: ReferenceDroneControlsProps) {
  const selectedKey =
    selectedMidi === null ? null : createReferenceKey(selectedMidi);
  const active =
    snapshot.status === 'starting' ||
    snapshot.status === 'playing' ||
    snapshot.status === 'changing' ||
    snapshot.status === 'stopping';

  return (
    <div
      className="reference-drone-controls"
      aria-label="Reference drone controls"
    >
      <div className="reference-drone-controls__buttons">
        <button
          type="button"
          className="secondary-button"
          disabled={!selectedKey || active}
          onClick={() => {
            if (selectedKey) onStartSelected(selectedKey.midiNote);
          }}
        >
          Start selected drone
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={!active || snapshot.status === 'stopping'}
          onClick={onStop}
        >
          Stop reference drone
        </button>
      </div>
      <div className="reference-drone-volume">
        <label htmlFor="reference-drone-volume">Reference drone volume</label>
        <input
          id="reference-drone-volume"
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(snapshot.volume * 100)}
          onChange={(event) =>
            onVolumeChange(Number(event.currentTarget.value) / 100)
          }
        />
        <output>{Math.round(snapshot.volume * 100)}%</output>
      </div>
      <p className="reference-drone-headphones">
        Headphones are recommended so the microphone does not detect the
        reference drone.
      </p>
      <p className="reference-drone-headphones">
        Low notes use gentle upper harmonics so they remain audible on small
        speakers.
      </p>
    </div>
  );
}
