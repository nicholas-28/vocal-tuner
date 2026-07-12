import type { MusicalPitch } from '../types/musicalPitch';
import {
  fractionalMidiToNearestNote,
  frequencyToFractionalMidi,
} from './frequencyToMidi';
import {
  midiNoteToNoteName,
  midiNoteToOctave,
  midiNoteToPitchClass,
  noteNameToAccidental,
} from './midiToNote';
import { midiNoteToFrequency } from './noteFrequency';
import { DEFAULT_TUNING_A4_HZ, isValidTuningReference } from './tuning';

export const MINIMUM_APPLICATION_FREQUENCY_HZ = 65;
export const MAXIMUM_APPLICATION_FREQUENCY_HZ = 1200;

export function frequencyToMusicalPitch(
  frequencyHz: number | null | undefined,
  tuningA4Hz = DEFAULT_TUNING_A4_HZ,
): MusicalPitch | null {
  if (
    typeof frequencyHz !== 'number' ||
    !Number.isFinite(frequencyHz) ||
    frequencyHz < MINIMUM_APPLICATION_FREQUENCY_HZ ||
    frequencyHz > MAXIMUM_APPLICATION_FREQUENCY_HZ ||
    !isValidTuningReference(tuningA4Hz)
  ) {
    return null;
  }

  const fractionalMidi = frequencyToFractionalMidi(frequencyHz, tuningA4Hz);
  if (fractionalMidi === null) return null;
  const midiNote = fractionalMidiToNearestNote(fractionalMidi);
  if (midiNote === null) return null;
  const pitchClass = midiNoteToPitchClass(midiNote);
  const noteName = midiNoteToNoteName(midiNote);
  const octave = midiNoteToOctave(midiNote);
  const idealFrequencyHz = midiNoteToFrequency(midiNote, tuningA4Hz);
  if (
    pitchClass === null ||
    noteName === null ||
    octave === null ||
    idealFrequencyHz === null
  ) {
    return null;
  }

  const cents = (fractionalMidi - midiNote) * 100;
  if (!Number.isFinite(cents)) return null;

  return {
    frequencyHz,
    fractionalMidi,
    midiNote,
    pitchClass,
    noteName,
    accidental: noteNameToAccidental(noteName),
    octave,
    cents,
    idealFrequencyHz,
    tuningA4Hz,
  };
}
