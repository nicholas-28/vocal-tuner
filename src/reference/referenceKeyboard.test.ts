import { describe, expect, it } from 'vitest';
import type { VisiblePitchRange } from '../types/visiblePitchRange';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PRESENT_TIME_X_RATIO,
} from '../visualization/pitchGridConfig';
import {
  createPitchGridViewport,
  midiToY,
} from '../visualization/pitchGridViewport';
import {
  clampReferenceFocusMidi,
  createReferenceKey,
  formatReferenceKeyFrequency,
  generateReferenceKeys,
  getReferenceKeyLayout,
  resolveReferenceFocusMidi,
} from './referenceKeyboard';

const ranges: VisiblePitchRange[] = [
  { lowMidi: 36, highMidi: 60 },
  { lowMidi: 48, highMidi: 72 },
  { lowMidi: 60, highMidi: 84 },
];

describe('reference key generation', () => {
  it.each(ranges)(
    'creates one descending key per inclusive note for %#',
    (range) => {
      const original = { ...range };
      const keys = generateReferenceKeys(range);
      expect(keys).toHaveLength(25);
      expect(keys[0]?.midiNote).toBe(range.highMidi);
      expect(keys.at(-1)?.midiNote).toBe(range.lowMidi);
      expect(new Set(keys.map((key) => key.midiNote)).size).toBe(25);
      expect(range).toEqual(original);
    },
  );

  it('reuses sharp note labels, octave transitions, and ideal frequencies', () => {
    expect(createReferenceKey(59)).toMatchObject({
      label: 'B3',
      kind: 'natural',
      accidental: null,
    });
    expect(createReferenceKey(60)).toMatchObject({
      label: 'C4',
      kind: 'natural',
      pitchClass: 0,
    });
    expect(createReferenceKey(61)).toMatchObject({
      label: 'C#4',
      kind: 'accidental',
      accidental: '#',
    });
    expect(createReferenceKey(69)?.idealFrequencyHz).toBe(440);
    expect(createReferenceKey(57)?.idealFrequencyHz).toBe(220);
    expect(createReferenceKey(60)?.idealFrequencyHz).toBeCloseTo(261.6256);
    expect(formatReferenceKeyFrequency(261.6256)).toBe('261.6 Hz');
    expect(
      generateReferenceKeys(ranges[1]).every((key) => !key.label.includes('b')),
    ).toBe(true);
  });

  it.each([
    [60, 'natural'],
    [61, 'accidental'],
    [62, 'natural'],
    [63, 'accidental'],
    [64, 'natural'],
    [65, 'natural'],
    [66, 'accidental'],
    [68, 'accidental'],
    [70, 'accidental'],
    [71, 'natural'],
  ])('classifies MIDI %s as %s', (midi, kind) => {
    expect(createReferenceKey(midi)?.kind).toBe(kind);
  });

  it('rejects invalid MIDI and invalid ranges safely', () => {
    expect(createReferenceKey(60.5)).toBeNull();
    expect(generateReferenceKeys({ lowMidi: 48, highMidi: 48 })).toEqual([]);
    expect(formatReferenceKeyFrequency(Number.NaN)).toBe('— Hz');
  });
});

describe('reference keyboard layout and focus', () => {
  const range = { lowMidi: 48, highMidi: 72 };

  it('uses equal rows whose centers match semitone-center ratios', () => {
    expect(getReferenceKeyLayout(72, range)).toEqual({
      rowIndex: 0,
      topRatio: 0,
      centerRatio: 0.5 / 25,
      heightRatio: 1 / 25,
    });
    expect(getReferenceKeyLayout(60, range)).toEqual({
      rowIndex: 12,
      topRatio: 12 / 25,
      centerRatio: 12.5 / 25,
      heightRatio: 1 / 25,
    });
    expect(getReferenceKeyLayout(48, range)).toEqual({
      rowIndex: 24,
      topRatio: 24 / 25,
      centerRatio: 24.5 / 25,
      heightRatio: 1 / 25,
    });
    expect(getReferenceKeyLayout(47, range)).toBeNull();
  });

  it('matches Canvas MIDI centers at every note without cumulative drift', () => {
    const viewport = createPitchGridViewport({
      widthCssPx: 400,
      heightCssPx: 516,
      devicePixelRatio: 2,
      ...range,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: DEFAULT_PRESENT_TIME_X_RATIO,
    });
    expect(viewport).not.toBeNull();
    if (!viewport) return;
    for (let midi = range.lowMidi; midi <= range.highMidi; midi += 1) {
      const layout = getReferenceKeyLayout(midi, range);
      expect(layout).not.toBeNull();
      expect(midiToY(midi, viewport)).toBeCloseTo(
        viewport.graphTopY +
          (layout?.centerRatio ?? Number.NaN) * viewport.graphHeight,
      );
    }
  });

  it('clamps focus and navigates without wrapping', () => {
    expect(clampReferenceFocusMidi(80, range)).toBe(72);
    expect(clampReferenceFocusMidi(40, range)).toBe(48);
    expect(resolveReferenceFocusMidi(60, 'higher', range)).toBe(61);
    expect(resolveReferenceFocusMidi(60, 'lower', range)).toBe(59);
    expect(resolveReferenceFocusMidi(72, 'higher', range)).toBe(72);
    expect(resolveReferenceFocusMidi(48, 'lower', range)).toBe(48);
    expect(resolveReferenceFocusMidi(60, 'highest', range)).toBe(72);
    expect(resolveReferenceFocusMidi(60, 'lowest', range)).toBe(48);
  });
});
