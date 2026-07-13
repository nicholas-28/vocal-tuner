export type ReferenceKeyKind = 'natural' | 'accidental';

export type ReferenceKey = {
  midiNote: number;
  noteName: string;
  octave: number;
  label: string;
  pitchClass: number;
  accidental: '#' | null;
  kind: ReferenceKeyKind;
  idealFrequencyHz: number;
};

export type ReferenceKeyboardState = {
  pressedMidi: number | null;
  selectedMidi: number | null;
  focusedMidi: number;
};

export type ReferenceKeyLayout = {
  rowIndex: number;
  topRatio: number;
  centerRatio: number;
  heightRatio: number;
};

export type ReferenceFocusCommand = 'higher' | 'lower' | 'highest' | 'lowest';
