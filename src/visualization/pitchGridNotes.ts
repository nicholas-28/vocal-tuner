import {
  midiNoteToNoteName,
  midiNoteToOctave,
  midiNoteToPitchClass,
} from '../music/midiToNote';

export type PitchGridNote = {
  midi: number;
  label: string;
  isNatural: boolean;
  isOctaveC: boolean;
};

export function getPitchGridNote(midi: number): PitchGridNote | null {
  const noteName = midiNoteToNoteName(midi);
  const octave = midiNoteToOctave(midi);
  const pitchClass = midiNoteToPitchClass(midi);
  if (noteName === null || octave === null || pitchClass === null) return null;
  return {
    midi,
    label: `${noteName}${octave}`,
    isNatural: !noteName.includes('#'),
    isOctaveC: pitchClass === 0,
  };
}
