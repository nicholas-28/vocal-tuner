import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VISIBLE_PITCH_RANGE,
  MAXIMUM_VISIBLE_MIDI,
  MINIMUM_VISIBLE_MIDI,
  OCTAVE_SEMITONES,
  VISIBLE_PITCH_RANGE_PRESETS,
  VISIBLE_RANGE_SPAN_SEMITONES,
  areVisiblePitchRangesEqual,
  canShiftVisiblePitchRange,
  getPitchRangePosition,
  getVisiblePitchRangeLabel,
  getVisiblePitchRangePresetId,
  isMidiVisibleInRange,
  isValidVisiblePitchRange,
  resolveVisiblePitchRangePreset,
  shiftVisiblePitchRange,
} from './visiblePitchRange';

describe('visible pitch range model', () => {
  it('defines default, limits, presets, and the inclusive two-octave span', () => {
    expect(DEFAULT_VISIBLE_PITCH_RANGE).toEqual({ lowMidi: 48, highMidi: 72 });
    expect(MINIMUM_VISIBLE_MIDI).toBe(36);
    expect(MAXIMUM_VISIBLE_MIDI).toBe(84);
    expect(VISIBLE_RANGE_SPAN_SEMITONES).toBe(24);
    expect(
      DEFAULT_VISIBLE_PITCH_RANGE.highMidi -
        DEFAULT_VISIBLE_PITCH_RANGE.lowMidi,
    ).toBe(24);
    expect(
      DEFAULT_VISIBLE_PITCH_RANGE.highMidi -
        DEFAULT_VISIBLE_PITCH_RANGE.lowMidi +
        1,
    ).toBe(25);
    expect(VISIBLE_PITCH_RANGE_PRESETS.map(({ id }) => id)).toEqual([
      'low',
      'middle',
      'high',
    ]);
  });

  it.each([
    ['low', { lowMidi: 36, highMidi: 60 }, 'C2–C4'],
    ['middle', { lowMidi: 48, highMidi: 72 }, 'C3–C5'],
    ['high', { lowMidi: 60, highMidi: 84 }, 'C4–C6'],
  ] as const)('resolves %s centrally', (id, range, label) => {
    expect(resolveVisiblePitchRangePreset(id)).toEqual(range);
    expect(getVisiblePitchRangeLabel(range)).toBe(label);
    expect(getVisiblePitchRangePresetId(range)).toBe(id);
  });

  it('accepts a custom fixed-span range without selecting a preset', () => {
    const custom = { lowMidi: 37, highMidi: 61 };
    expect(isValidVisiblePitchRange(custom)).toBe(true);
    expect(getVisiblePitchRangePresetId(custom)).toBeNull();
    expect(getVisiblePitchRangeLabel(custom)).toBe('C#2–C#4');
  });

  it.each([
    { lowMidi: 48, highMidi: 48 },
    { lowMidi: 60, highMidi: 48 },
    { lowMidi: 48.5, highMidi: 72.5 },
    { lowMidi: Number.NaN, highMidi: 72 },
    { lowMidi: 48, highMidi: Number.POSITIVE_INFINITY },
    { lowMidi: 35, highMidi: 59 },
    { lowMidi: 61, highMidi: 85 },
    { lowMidi: 48, highMidi: 71 },
  ])('rejects invalid range %#', (range) => {
    expect(isValidVisiblePitchRange(range)).toBe(false);
  });

  it('shifts by octaves without clamping or changing span', () => {
    expect(
      shiftVisiblePitchRange(DEFAULT_VISIBLE_PITCH_RANGE, -OCTAVE_SEMITONES),
    ).toEqual({ lowMidi: 36, highMidi: 60 });
    expect(
      shiftVisiblePitchRange(DEFAULT_VISIBLE_PITCH_RANGE, OCTAVE_SEMITONES),
    ).toEqual({ lowMidi: 60, highMidi: 84 });
    expect(
      shiftVisiblePitchRange({ lowMidi: 36, highMidi: 60 }, -12),
    ).toBeNull();
    expect(
      shiftVisiblePitchRange({ lowMidi: 60, highMidi: 84 }, 12),
    ).toBeNull();
    expect(shiftVisiblePitchRange(DEFAULT_VISIBLE_PITCH_RANGE, 0.5)).toBeNull();
    expect(canShiftVisiblePitchRange(DEFAULT_VISIBLE_PITCH_RANGE, 12)).toBe(
      true,
    );
  });

  it('uses inclusive visibility for integer and fractional MIDI', () => {
    const range = DEFAULT_VISIBLE_PITCH_RANGE;
    expect(isMidiVisibleInRange(48, range)).toBe(true);
    expect(isMidiVisibleInRange(60.25, range)).toBe(true);
    expect(isMidiVisibleInRange(72, range)).toBe(true);
    expect(getPitchRangePosition(47.99, range)).toBe('below');
    expect(getPitchRangePosition(72.01, range)).toBe('above');
    expect(getPitchRangePosition(Number.NaN, range)).toBeNull();
    expect(
      areVisiblePitchRangesEqual(range, { lowMidi: 48, highMidi: 72 }),
    ).toBe(true);
  });

  it('rejects invalid preset IDs', () => {
    expect(resolveVisiblePitchRangePreset('unknown')).toBeNull();
  });
});
