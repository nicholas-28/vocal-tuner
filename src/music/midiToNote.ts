import type { Accidental } from '../types/musicalPitch';

export const PITCH_CLASS_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export function midiNoteToPitchClass(midiNote: number): number | null {
  if (!Number.isInteger(midiNote)) return null;
  return ((midiNote % 12) + 12) % 12;
}

export function midiNoteToNoteName(midiNote: number): string | null {
  const pitchClass = midiNoteToPitchClass(midiNote);
  return pitchClass === null ? null : PITCH_CLASS_NAMES[pitchClass];
}

export function midiNoteToOctave(midiNote: number): number | null {
  return Number.isInteger(midiNote) ? Math.floor(midiNote / 12) - 1 : null;
}

export function noteNameToAccidental(noteName: string): Accidental {
  return noteName.includes('#') ? '#' : null;
}
