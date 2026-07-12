import { isValidTuningReference } from './tuning';

export function midiNoteToFrequency(
  midiNote: number,
  tuningA4Hz: number,
): number | null {
  if (!Number.isFinite(midiNote) || !isValidTuningReference(tuningA4Hz)) {
    return null;
  }
  const frequencyHz = tuningA4Hz * 2 ** ((midiNote - 69) / 12);
  return Number.isFinite(frequencyHz) && frequencyHz > 0 ? frequencyHz : null;
}
