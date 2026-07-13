import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
  DEFAULT_PRESENT_TIME_X_RATIO,
} from './pitchGridConfig';
import {
  alignStrokeCoordinate,
  createPitchGridViewport,
  getCrispStrokeWidth,
  getVisibleMidiSequence,
  isValidMidiRange,
  isValidPitchGridViewport,
  midiToY,
  normalizeDevicePixelRatio,
  normalizePresentTimeRatio,
  yToMidi,
} from './pitchGridViewport';

function viewport(widthCssPx = 500, heightCssPx = 416, ratio = 0.8) {
  return createPitchGridViewport({
    widthCssPx,
    heightCssPx,
    devicePixelRatio: 1.5,
    ...DEFAULT_PITCH_GRID_RANGE,
    ...DEFAULT_PITCH_GRID_LAYOUT,
    presentTimeXRatio: ratio,
  });
}

describe('pitch grid range', () => {
  it('defines the inclusive C3-C5 range with every semitone', () => {
    expect(DEFAULT_PITCH_GRID_RANGE).toEqual({ lowMidi: 48, highMidi: 72 });
    const notes = getVisibleMidiSequence(DEFAULT_PITCH_GRID_RANGE);
    expect(notes).toHaveLength(25);
    expect(notes?.[0]).toBe(72);
    expect(notes?.at(-1)).toBe(48);
    expect(notes).toContain(60);
  });

  it.each([
    { lowMidi: 60, highMidi: 60 },
    { lowMidi: 61, highMidi: 60 },
    { lowMidi: 48.5, highMidi: 72 },
    { lowMidi: Number.NaN, highMidi: 72 },
    { lowMidi: 48, highMidi: Number.POSITIVE_INFINITY },
  ])('rejects invalid musical bounds %#', (range) => {
    expect(isValidMidiRange(range)).toBe(false);
    expect(getVisibleMidiSequence(range)).toBeNull();
  });

  it('accepts a custom integer range', () => {
    expect(isValidMidiRange({ lowMidi: 36, highMidi: 60 })).toBe(true);
  });
});

describe('pitch grid viewport and coordinates', () => {
  it('maps inclusive note centers and the midpoint with equal spacing', () => {
    const result = viewport();
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.visibleNoteCount).toBe(25);
    expect(result.graphLeftX).toBe(0);
    expect(result.graphRightX).toBe(492);
    expect(result.graphTopY).toBe(8);
    expect(result.graphBottomY).toBe(408);
    expect(result.semitoneHeight).toBe(16);
    expect(isValidPitchGridViewport(result)).toBe(true);
    expect(midiToY(72, result)).toBe(16);
    expect(midiToY(60, result)).toBe(208);
    expect(midiToY(48, result)).toBe(400);
    expect(midiToY(60.5, result)).toBe(200);
    expect((midiToY(60, result) ?? 0) - (midiToY(61, result) ?? 0)).toBe(16);
  });

  it('round-trips fractional MIDI and preserves meaning after resize', () => {
    const first = viewport();
    const resized = viewport(750, 616);
    expect(first).not.toBeNull();
    expect(resized).not.toBeNull();
    if (!first || !resized) return;
    for (const midi of [48, 60, 60.37, 69, 72]) {
      expect(yToMidi(midiToY(midi, first) ?? NaN, first)).toBeCloseTo(midi);
      expect(yToMidi(midiToY(midi, resized) ?? NaN, resized)).toBeCloseTo(midi);
    }
    expect(midiToY(61, first)).toBeLessThan(midiToY(60, first) ?? 0);
  });

  it.each([
    [0, 0],
    [0.5, 246],
    [DEFAULT_PRESENT_TIME_X_RATIO, 393.6],
    [1, 492],
  ])('places graph-relative ratio %s at %s', (ratio, expected) => {
    expect(viewport(500, 416, ratio)?.presentTimeX).toBe(expected);
  });

  it('clamps finite marker ratios and rejects non-finite ratios', () => {
    expect(normalizePresentTimeRatio(-1)).toBe(0);
    expect(normalizePresentTimeRatio(2)).toBe(1);
    expect(normalizePresentTimeRatio(Number.NaN)).toBeNull();
  });

  it.each([
    [1, 500, 416],
    [1.5, 750, 624],
    [2, 1000, 832],
  ])('calculates DPR %s backing dimensions', (dpr, width, height) => {
    const result = createPitchGridViewport({
      widthCssPx: 500,
      heightCssPx: 416,
      devicePixelRatio: dpr,
      ...DEFAULT_PITCH_GRID_RANGE,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    });
    expect(result?.backingWidthPx).toBe(width);
    expect(result?.backingHeightPx).toBe(height);
    expect(result?.widthCssPx).toBe(500);
  });

  it('normalizes invalid and excessive DPR safely', () => {
    expect(normalizeDevicePixelRatio(Number.NaN)).toBe(1);
    expect(normalizeDevicePixelRatio(0)).toBe(1);
    expect(normalizeDevicePixelRatio(4)).toBe(3);
  });

  it.each([
    { widthCssPx: 0, heightCssPx: 100 },
    { widthCssPx: -1, heightCssPx: 100 },
    { widthCssPx: Number.NaN, heightCssPx: 100 },
    { widthCssPx: 100, heightCssPx: 0 },
    { widthCssPx: 8, heightCssPx: 100 },
  ])('rejects invalid graph geometry %#', (dimensions) => {
    expect(
      createPitchGridViewport({
        ...dimensions,
        devicePixelRatio: 1,
        ...DEFAULT_PITCH_GRID_RANGE,
        ...DEFAULT_PITCH_GRID_LAYOUT,
        presentTimeXRatio: 0.8,
      }),
    ).toBeNull();
  });

  it('aligns strokes deterministically at fractional DPR', () => {
    expect(alignStrokeCoordinate(10, 1, 1)).toBe(10.5);
    expect(alignStrokeCoordinate(10, 1, 1.5)).toBe(10);
    expect(alignStrokeCoordinate(10, 1, 2)).toBe(10);
    expect(alignStrokeCoordinate(10, 0, 1)).toBeNull();
    expect(getCrispStrokeWidth(1, 1)).toBe(1);
    expect(getCrispStrokeWidth(1, 1.5)).toBeCloseTo(4 / 3);
    expect(getCrispStrokeWidth(1, 2)).toBe(1);
  });
});
