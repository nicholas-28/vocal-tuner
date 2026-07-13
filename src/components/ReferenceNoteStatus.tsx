import {
  createReferenceKey,
  formatReferenceKeyFrequency,
} from '../reference/referenceKeyboard';
import type { ReferenceKeyboardState } from '../types/referenceKey';

type ReferenceNoteStatusProps = {
  state: ReferenceKeyboardState;
};

export function ReferenceNoteStatus({ state }: ReferenceNoteStatusProps) {
  const midi = state.pressedMidi ?? state.selectedMidi;
  const key = midi === null ? null : createReferenceKey(midi);
  return (
    <p
      className="reference-note-status"
      aria-label="Reference note status"
      aria-live="polite"
    >
      {key
        ? `${state.pressedMidi === null ? 'Reference note selected' : 'Reference key pressed'}: ${key.label}, ${formatReferenceKeyFrequency(key.idealFrequencyHz)}.`
        : 'No reference note selected.'}
    </p>
  );
}
