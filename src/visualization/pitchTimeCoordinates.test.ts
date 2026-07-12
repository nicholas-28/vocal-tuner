import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
} from './pitchGridConfig';
import { createPitchGridViewport } from './pitchGridViewport';
import {
  getHistoricalWidth,
  getPixelsPerMs,
  timestampToX,
  xToTimestamp,
} from './pitchTimeCoordinates';

function viewport(widthCssPx = 500) {
  return createPitchGridViewport({
    widthCssPx,
    heightCssPx: 416,
    devicePixelRatio: 1,
    ...DEFAULT_PITCH_GRID_RANGE,
    ...DEFAULT_PITCH_GRID_LAYOUT,
    presentTimeXRatio: 0.8,
  })!;
}

describe('pitch time coordinates', () => {
  it('maps the 15-second history window to graph-left through present time', () => {
    const view = viewport();
    expect(getHistoricalWidth(view)).toBe(360);
    expect(getPixelsPerMs(view, 15_000)).toBe(0.024);
    expect(timestampToX(20_000, 20_000, view, 15_000)).toBe(402);
    expect(timestampToX(5000, 20_000, view, 15_000)).toBe(42);
    expect(timestampToX(12_500, 20_000, view, 15_000)).toBe(222);
  });

  it('excludes older and future timestamps and rejects invalid inputs', () => {
    const view = viewport();
    expect(timestampToX(4999, 20_000, view, 15_000)).toBeNull();
    expect(timestampToX(20_001, 20_000, view, 15_000)).toBeNull();
    expect(timestampToX(Number.NaN, 20_000, view, 15_000)).toBeNull();
    expect(timestampToX(20_000, Number.NaN, view, 15_000)).toBeNull();
    expect(timestampToX(20_000, 20_000, view, 0)).toBeNull();
  });

  it('round-trips time and preserves meaning after resize', () => {
    for (const view of [viewport(), viewport(800)]) {
      const x = timestampToX(16_250, 20_000, view, 15_000)!;
      expect(xToTimestamp(x, 20_000, view, 15_000)).toBeCloseTo(16_250);
      expect(x).toBeGreaterThanOrEqual(view.graphLeftX);
      expect(x).toBeLessThanOrEqual(view.presentTimeX);
    }
  });
});
