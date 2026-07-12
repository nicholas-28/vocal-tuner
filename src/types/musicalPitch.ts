export type Accidental = '#' | null;

export type MusicalPitch = {
  frequencyHz: number;
  fractionalMidi: number;
  midiNote: number;
  pitchClass: number;
  noteName: string;
  accidental: Accidental;
  octave: number;
  cents: number;
  idealFrequencyHz: number;
  tuningA4Hz: number;
};
