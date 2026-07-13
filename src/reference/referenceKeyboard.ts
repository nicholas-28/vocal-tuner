import {
  midiNoteToNoteName,
  midiNoteToOctave,
  midiNoteToPitchClass,
  noteNameToAccidental,
} from '../music/midiToNote';
import { midiNoteToFrequency } from '../music/noteFrequency';
import { DEFAULT_TUNING_A4_HZ } from '../music/tuning';
import type {
  ReferenceFocusCommand,
  ReferenceKey,
  ReferenceKeyLayout,
} from '../types/referenceKey';
import type { VisiblePitchRange } from '../types/visiblePitchRange';
import { isValidVisiblePitchRange } from '../visualization/visiblePitchRange';

export const DEFAULT_REFERENCE_FOCUS_MIDI = 60;

export function createReferenceKey(
  midiNote: number,
  tuningA4Hz = DEFAULT_TUNING_A4_HZ,
): ReferenceKey | null {
  if (!Number.isInteger(midiNote)) return null;
  const noteName = midiNoteToNoteName(midiNote);
  const octave = midiNoteToOctave(midiNote);
  const pitchClass = midiNoteToPitchClass(midiNote);
  const idealFrequencyHz = midiNoteToFrequency(midiNote, tuningA4Hz);
  if (
    noteName === null ||
    octave === null ||
    pitchClass === null ||
    idealFrequencyHz === null
  ) {
    return null;
  }
  const accidental = noteNameToAccidental(noteName);
  return {
    midiNote,
    noteName,
    octave,
    label: `${noteName}${octave}`,
    pitchClass,
    accidental,
    kind: accidental === null ? 'natural' : 'accidental',
    idealFrequencyHz,
  };
}

export function generateReferenceKeys(
  range: VisiblePitchRange,
  tuningA4Hz = DEFAULT_TUNING_A4_HZ,
): ReferenceKey[] {
  if (!isValidVisiblePitchRange(range)) return [];
  const keys: ReferenceKey[] = [];
  for (let midi = range.highMidi; midi >= range.lowMidi; midi -= 1) {
    const key = createReferenceKey(midi, tuningA4Hz);
    if (!key) return [];
    keys.push(key);
  }
  return keys;
}

export function getReferenceKeyLayout(
  midiNote: number,
  range: VisiblePitchRange,
): ReferenceKeyLayout | null {
  if (
    !Number.isInteger(midiNote) ||
    !isValidVisiblePitchRange(range) ||
    midiNote < range.lowMidi ||
    midiNote > range.highMidi
  ) {
    return null;
  }
  const noteCount = range.highMidi - range.lowMidi + 1;
  const rowIndex = range.highMidi - midiNote;
  return {
    rowIndex,
    topRatio: rowIndex / noteCount,
    centerRatio: (rowIndex + 0.5) / noteCount,
    heightRatio: 1 / noteCount,
  };
}

export function isReferenceKeyVisible(
  midiNote: number,
  range: VisiblePitchRange,
): boolean {
  return getReferenceKeyLayout(midiNote, range) !== null;
}

export function clampReferenceFocusMidi(
  midiNote: number,
  range: VisiblePitchRange,
): number | null {
  if (!Number.isInteger(midiNote) || !isValidVisiblePitchRange(range)) {
    return null;
  }
  return Math.min(range.highMidi, Math.max(range.lowMidi, midiNote));
}

export function resolveReferenceFocusMidi(
  currentMidi: number,
  command: ReferenceFocusCommand,
  range: VisiblePitchRange,
): number | null {
  const current = clampReferenceFocusMidi(currentMidi, range);
  if (current === null) return null;
  switch (command) {
    case 'higher':
      return Math.min(range.highMidi, current + 1);
    case 'lower':
      return Math.max(range.lowMidi, current - 1);
    case 'highest':
      return range.highMidi;
    case 'lowest':
      return range.lowMidi;
  }
}

export function formatReferenceKeyFrequency(frequencyHz: number): string {
  return Number.isFinite(frequencyHz) && frequencyHz > 0
    ? `${frequencyHz.toFixed(1)} Hz`
    : '— Hz';
}
