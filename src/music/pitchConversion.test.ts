import { describe, expect, it } from 'vitest';
import {
  fractionalMidiToNearestNote,
  frequencyToFractionalMidi,
} from './frequencyToMidi';
import {
  midiNoteToNoteName,
  midiNoteToOctave,
  midiNoteToPitchClass,
  noteNameToAccidental,
  PITCH_CLASS_NAMES,
} from './midiToNote';
import { midiNoteToFrequency } from './noteFrequency';
import { frequencyToMusicalPitch } from './pitchConversion';
import {
  DEFAULT_TUNING_A4_HZ,
  isValidTuningReference,
  MAXIMUM_TUNING_A4_HZ,
  MINIMUM_TUNING_A4_HZ,
} from './tuning';

describe('musical pitch conversion', () => {
  it.each([
    [440, 69, 'A', 4],
    [220, 57, 'A', 3],
    [880, 81, 'A', 5],
    [261.625565, 60, 'C', 4],
    [277.182631, 61, 'C#', 4],
    [329.627557, 64, 'E', 4],
    [130.812783, 48, 'C', 3],
  ] as const)(
    'converts %s Hz to MIDI %s %s%s',
    (frequency, midi, name, octave) => {
      const pitch = frequencyToMusicalPitch(frequency);
      expect(pitch?.midiNote).toBe(midi);
      expect(pitch?.noteName).toBe(name);
      expect(pitch?.octave).toBe(octave);
      expect(pitch?.cents).toBeCloseTo(0, 3);
      expect(pitch?.idealFrequencyHz).toBeCloseTo(frequency, 4);
      expect(pitch?.tuningA4Hz).toBe(DEFAULT_TUNING_A4_HZ);
    },
  );

  it.each([
    [0, 'C', -1],
    [12, 'C', 0],
    [59, 'B', 3],
    [60, 'C', 4],
    [61, 'C#', 4],
    [71, 'B', 4],
    [72, 'C', 5],
    [127, 'G', 9],
  ] as const)('maps MIDI %s to %s%s', (midi, name, octave) => {
    expect(midiNoteToNoteName(midi)).toBe(name);
    expect(midiNoteToOctave(midi)).toBe(octave);
  });

  it('uses one sharp-only pitch-class table and wraps negative MIDI notes', () => {
    expect(PITCH_CLASS_NAMES).toEqual([
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
    ]);
    PITCH_CLASS_NAMES.forEach((name, pitchClass) => {
      expect(midiNoteToNoteName(60 + pitchClass)).toBe(name);
      expect(midiNoteToPitchClass(60 + pitchClass)).toBe(pitchClass);
      expect(noteNameToAccidental(name)).toBe(name.includes('#') ? '#' : null);
    });
    expect(midiNoteToPitchClass(-1)).toBe(11);
  });

  it('keeps cents signed and switches notes deterministically at half steps', () => {
    const below = frequencyToMusicalPitch(438);
    const above = frequencyToMusicalPitch(442);
    expect(below?.cents).toBeLessThan(0);
    expect(above?.cents).toBeGreaterThan(0);

    const positiveMidpointHz = midiNoteToFrequency(69.5, 440)!;
    const negativeMidpointHz = midiNoteToFrequency(-0.5, 440)!;
    expect(frequencyToMusicalPitch(positiveMidpointHz)?.midiNote).toBe(70);
    expect(frequencyToMusicalPitch(positiveMidpointHz)?.cents).toBeCloseTo(
      -50,
      8,
    );

    const negativeFractionalMidi = frequencyToFractionalMidi(
      negativeMidpointHz,
      440,
    )!;
    expect(fractionalMidiToNearestNote(negativeFractionalMidi)).toBe(0);
    expect((negativeFractionalMidi - 0) * 100).toBeCloseTo(-50, 8);

    const justBelow = midiNoteToFrequency(69.499999, 440)!;
    const justAbove = midiNoteToFrequency(69.500001, 440)!;
    expect(frequencyToMusicalPitch(justBelow)?.midiNote).toBe(69);
    expect(frequencyToMusicalPitch(justBelow)?.cents).toBeCloseTo(49.9999, 3);
    expect(frequencyToMusicalPitch(justAbove)?.midiNote).toBe(70);
    expect(frequencyToMusicalPitch(justAbove)?.cents).toBeCloseTo(-49.9999, 3);
  });

  it('supports validated tuning references', () => {
    expect(frequencyToMusicalPitch(442, 442)?.noteName).toBe('A');
    expect(frequencyToMusicalPitch(442, 442)?.cents).toBeCloseTo(0, 8);
    expect(frequencyToMusicalPitch(440, 442)?.cents).toBeLessThan(0);
    expect(frequencyToMusicalPitch(442, 440)?.cents).toBeGreaterThan(0);
    expect(frequencyToMusicalPitch(432, 432)?.cents).toBeCloseTo(0, 8);
    expect(isValidTuningReference(MINIMUM_TUNING_A4_HZ)).toBe(true);
    expect(isValidTuningReference(MAXIMUM_TUNING_A4_HZ)).toBe(true);
    expect(isValidTuningReference(399.99)).toBe(false);
    expect(isValidTuningReference(480.01)).toBe(false);
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Infinity,
    -Infinity,
    null,
    undefined,
    64.99,
    1200.01,
  ])('safely rejects invalid application input %s', (frequency) => {
    expect(frequencyToMusicalPitch(frequency)).toBeNull();
  });

  it.each([Number.NaN, Infinity, -Infinity, 0, 399, 481])(
    'rejects invalid tuning %s',
    (tuning) => {
      expect(frequencyToMusicalPitch(440, tuning)).toBeNull();
    },
  );
});
