import { describe, expect, it } from 'vitest';
import type { PitchHistoryPoint } from '../types/pitchHistory';
import { buildPitchCurveSegments } from './pitchCurveSegments';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
} from './pitchGridConfig';
import { createPitchGridViewport } from './pitchGridViewport';

const view = createPitchGridViewport({
  widthCssPx: 500,
  heightCssPx: 416,
  devicePixelRatio: 1,
  ...DEFAULT_PITCH_GRID_RANGE,
  ...DEFAULT_PITCH_GRID_LAYOUT,
  presentTimeXRatio: 0.8,
})!;

const pitch = (timestampMs: number, midi = 60): PitchHistoryPoint => ({
  timestampMs,
  midi,
  frequencyHz: 261.63,
  confidence: 0.9,
  kind: 'pitch',
});
const gap = (timestampMs: number): PitchHistoryPoint => ({
  timestampMs,
  midi: null,
  frequencyHz: null,
  confidence: 0,
  kind: 'gap',
});
const segments = (points: readonly PitchHistoryPoint[]) =>
  buildPitchCurveSegments(points, view, 20_000, 15_000, 250);

describe('pitch curve segments', () => {
  it('handles empty, single, and adjacent pitch histories', () => {
    expect(segments([])).toEqual([]);
    expect(segments([pitch(19_900)])).toEqual([[pitch(19_900)]]);
    expect(segments([pitch(19_800), pitch(19_900), pitch(20_000)])).toEqual([
      [pitch(19_800), pitch(19_900), pitch(20_000)],
    ]);
  });

  it('breaks pitch-gap-pitch and ignores consecutive gaps', () => {
    expect(
      segments([pitch(19_500), gap(19_600), gap(19_700), pitch(19_800)]),
    ).toEqual([[pitch(19_500)], [pitch(19_800)]]);
  });

  it('connects unsampled short uncertainty but never crosses a confirmed gap', () => {
    expect(segments([pitch(19_800, 60), pitch(19_960, 60.4)])).toEqual([
      [pitch(19_800, 60), pitch(19_960, 60.4)],
    ]);
    expect(
      segments([pitch(19_500, 60), gap(19_600), pitch(19_760, 60.4)]),
    ).toEqual([[pitch(19_500, 60)], [pitch(19_760, 60.4)]]);
  });

  it('breaks on null/invalid MIDI, non-monotonic time, and large intervals', () => {
    const invalidMidi = { ...pitch(19_200), midi: Number.NaN };
    expect(
      segments([
        pitch(19_000),
        invalidMidi,
        pitch(19_300),
        pitch(19_200),
        pitch(19_900),
      ]),
    ).toEqual([[pitch(19_000)], [pitch(19_300)], [pitch(19_900)]]);
  });

  it('omits out-of-range and old points, then starts a segment on re-entry', () => {
    const input = [
      pitch(4000),
      pitch(19_000, 47.9),
      pitch(19_100, 60),
      pitch(19_200, 72.1),
      pitch(19_300, 69),
    ];
    const snapshot = input.map((point) => ({ ...point }));
    expect(segments(input)).toEqual([[pitch(19_100, 60)], [pitch(19_300, 69)]]);
    expect(input).toEqual(snapshot);
  });

  it('reveals retained points after a range-only viewport change', () => {
    const input = [pitch(19_800, 40), pitch(19_900, 50), pitch(20_000, 70)];
    const snapshot = input.map((point) => ({ ...point }));
    const lowView = createPitchGridViewport({
      widthCssPx: 500,
      heightCssPx: 416,
      devicePixelRatio: 1,
      lowMidi: 36,
      highMidi: 60,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    })!;
    const highView = createPitchGridViewport({
      widthCssPx: 500,
      heightCssPx: 416,
      devicePixelRatio: 1,
      lowMidi: 60,
      highMidi: 84,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    })!;
    expect(
      buildPitchCurveSegments(input, lowView, 20_000, 15_000, 250),
    ).toEqual([[pitch(19_800, 40), pitch(19_900, 50)]]);
    expect(
      buildPitchCurveSegments(input, highView, 20_000, 15_000, 250),
    ).toEqual([[pitch(20_000, 70)]]);
    expect(input).toEqual(snapshot);
  });
});

it('never bridges a rejected observation inside a short continuity-held interval', async () => {
  const { createPitchCurveBreaks } = await import('./pitchCurveBreaks');
  const breaks = createPitchCurveBreaks();
  breaks.record(19_833, true);
  const input = Object.freeze([
    Object.freeze(pitch(19_800)),
    Object.freeze(pitch(19_900)),
  ]);
  expect(
    buildPitchCurveSegments(input, view, 20_000, 15_000, 250, breaks),
  ).toEqual([[input[0]], [input[1]]]);
  expect(input).toHaveLength(2);
});

it.each([5000, 15000, 30000])(
  'filters the %s ms time window without rewriting history timestamps',
  (duration) => {
    const input = Object.freeze(
      [
        pitch(1000),
        pitch(10_000),
        pitch(20_000),
        pitch(29_900),
        pitch(30_000),
      ].map((point) => Object.freeze(point)),
    );
    const visible = buildPitchCurveSegments(
      input,
      view,
      30_000,
      duration,
      250,
    ).flat();
    expect(
      visible.every((point) => point.timestampMs >= 30_000 - duration),
    ).toBe(true);
    expect(visible).toContain(input.at(-1));
    visible.forEach((point) => expect(input).toContain(point));
    expect(input.map((point) => point.timestampMs)).toEqual([
      1000, 10_000, 20_000, 29_900, 30_000,
    ]);
  },
);
