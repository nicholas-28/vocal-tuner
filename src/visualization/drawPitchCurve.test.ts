import { describe, expect, it, vi } from 'vitest';
import type { PitchHistoryPoint } from '../types/pitchHistory';
import { drawPitchCurve } from './drawPitchCurve';
import { DEFAULT_PITCH_CURVE_CONFIG } from './pitchCurveConfig';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
} from './pitchGridConfig';
import { createPitchGridViewport } from './pitchGridViewport';

function mockContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
  } as unknown as CanvasRenderingContext2D;
}

const view = createPitchGridViewport({
  widthCssPx: 500,
  heightCssPx: 416,
  devicePixelRatio: 1.5,
  ...DEFAULT_PITCH_GRID_RANGE,
  ...DEFAULT_PITCH_GRID_LAYOUT,
  presentTimeXRatio: 0.8,
})!;
const point = (timestampMs: number, midi: number): PitchHistoryPoint => ({
  timestampMs,
  midi,
  frequencyHz: 440,
  confidence: 0.9,
  kind: 'pitch',
});

describe('drawPitchCurve', () => {
  it('clears, applies DPR, clips the graph, and draws timestamp/MIDI coordinates', () => {
    const context = mockContext();
    drawPitchCurve(
      context,
      view,
      [point(19_800, 60), point(19_900, 60.5), point(20_000, 61)],
      20_000,
      DEFAULT_PITCH_CURVE_CONFIG,
    );
    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 750, 624);
    expect(context.setTransform).toHaveBeenNthCalledWith(1, 1, 0, 0, 1, 0, 0);
    expect(context.setTransform).toHaveBeenNthCalledWith(
      2,
      1.5,
      0,
      0,
      1.5,
      0,
      0,
    );
    expect(context.rect).toHaveBeenCalledWith(42, 8, 360, 400);
    expect(context.clip).toHaveBeenCalledOnce();
    expect(context.moveTo).toHaveBeenCalledOnce();
    expect(context.lineTo).toHaveBeenCalledTimes(2);
    expect(vi.mocked(context.moveTo).mock.calls[0][0]).toBeGreaterThan(42);
    expect(vi.mocked(context.lineTo).mock.calls.at(-1)?.[0]).toBe(402);
    expect(vi.mocked(context.lineTo).mock.calls.at(-1)?.[1]).toBe(192);
  });

  it('uses separate paths across a gap and a dot for an isolated point', () => {
    const context = mockContext();
    drawPitchCurve(
      context,
      view,
      [
        point(19_500, 60),
        point(19_600, 61),
        {
          timestampMs: 19_700,
          midi: null,
          frequencyHz: null,
          confidence: 0,
          kind: 'gap',
        },
        point(19_800, 62),
      ],
      20_000,
      DEFAULT_PITCH_CURVE_CONFIG,
    );
    expect(context.moveTo).toHaveBeenCalledOnce();
    expect(context.lineTo).toHaveBeenCalledOnce();
    expect(context.stroke).toHaveBeenCalledOnce();
    expect(context.arc).toHaveBeenCalledOnce();
    expect(context.fill).toHaveBeenCalledOnce();
  });

  it('skips invalid timing or style without touching the context', () => {
    const context = mockContext();
    drawPitchCurve(context, view, [], Number.NaN, DEFAULT_PITCH_CURVE_CONFIG);
    drawPitchCurve(context, view, [], 20_000, {
      ...DEFAULT_PITCH_CURVE_CONFIG,
      strokeWidthCssPx: 0,
    });
    drawPitchCurve(
      context,
      { ...view, graphWidth: Number.NaN },
      [],
      20_000,
      DEFAULT_PITCH_CURVE_CONFIG,
    );
    expect(context.save).not.toHaveBeenCalled();
  });
});
