import { isValidTuningReference } from './tuning';

export function frequencyToFractionalMidi(
  frequencyHz: number,
  tuningA4Hz: number,
): number | null {
  if (
    !Number.isFinite(frequencyHz) ||
    frequencyHz <= 0 ||
    !isValidTuningReference(tuningA4Hz)
  ) {
    return null;
  }

  const fractionalMidi = 69 + 12 * Math.log2(frequencyHz / tuningA4Hz);
  return Number.isFinite(fractionalMidi) ? fractionalMidi : null;
}

export function fractionalMidiToNearestNote(
  fractionalMidi: number,
): number | null {
  if (!Number.isFinite(fractionalMidi)) return null;
  const nearestNote = Math.round(fractionalMidi);
  return Object.is(nearestNote, -0) ? 0 : nearestNote;
}
