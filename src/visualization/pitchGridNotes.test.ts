import { describe, expect, it } from 'vitest';
import { getPitchGridNote } from './pitchGridNotes';

describe('pitch grid note labels', () => {
  it.each([
    [48, 'C3', true, true],
    [49, 'C#3', false, false],
    [59, 'B3', true, false],
    [60, 'C4', true, true],
    [61, 'C#4', false, false],
    [69, 'A4', true, false],
    [71, 'B4', true, false],
    [72, 'C5', true, true],
  ])('describes MIDI %s as %s', (midi, label, natural, octaveC) => {
    expect(getPitchGridNote(midi)).toEqual({
      midi,
      label,
      isNatural: natural,
      isOctaveC: octaveC,
    });
  });

  it('uses all twelve pitch classes from the shared music utilities', () => {
    expect(
      Array.from(
        { length: 12 },
        (_, index) => getPitchGridNote(60 + index)?.label,
      ),
    ).toEqual([
      'C4',
      'C#4',
      'D4',
      'D#4',
      'E4',
      'F4',
      'F#4',
      'G4',
      'G#4',
      'A4',
      'A#4',
      'B4',
    ]);
  });
});
