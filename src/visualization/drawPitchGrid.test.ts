import { describe, expect, it, vi } from 'vitest';
import type { PitchGridStyle } from '../types/pitchGrid';
import { drawPitchGrid } from './drawPitchGrid';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
  DEFAULT_PITCH_GRID_STYLE,
} from './pitchGridConfig';
import { createPitchGridViewport } from './pitchGridViewport';

function mockContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
  } as unknown as CanvasRenderingContext2D;
}

describe('drawPitchGrid', () => {
  it('clears, resets DPR, draws 25 lines, labels, separator, and one marker', () => {
    const context = mockContext();
    const viewport = createPitchGridViewport({
      widthCssPx: 500,
      heightCssPx: 416,
      devicePixelRatio: 1.5,
      ...DEFAULT_PITCH_GRID_RANGE,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    });
    expect(viewport).not.toBeNull();
    if (!viewport) return;
    drawPitchGrid(context, viewport, DEFAULT_PITCH_GRID_STYLE);

    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
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
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 750, 624);
    expect(context.stroke).toHaveBeenCalledTimes(27);
    expect(context.fillText).toHaveBeenCalledTimes(25);
    expect(context.fillText).toHaveBeenCalledWith('C3', 35, 400);
    expect(context.fillText).toHaveBeenCalledWith('C4', 35, 208);
    expect(context.fillText).toHaveBeenCalledWith('A4', 35, 64);
    expect(context.fillText).toHaveBeenCalledWith('C5', 35, 16);

    const verticalLines = vi
      .mocked(context.moveTo)
      .mock.calls.filter(
        (call, index) =>
          call[0] === vi.mocked(context.lineTo).mock.calls[index]?.[0],
      );
    expect(verticalLines).toHaveLength(2);
  });

  it('uses each hierarchy style and restores state if drawing throws', () => {
    const context = mockContext();
    const colors: string[] = [];
    Object.defineProperty(context, 'strokeStyle', {
      set(value: string) {
        colors.push(value);
      },
    });
    const viewport = createPitchGridViewport({
      widthCssPx: 500,
      heightCssPx: 416,
      devicePixelRatio: 1,
      ...DEFAULT_PITCH_GRID_RANGE,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    });
    if (!viewport) return;
    drawPitchGrid(context, viewport, DEFAULT_PITCH_GRID_STYLE);
    expect(colors).toContain(DEFAULT_PITCH_GRID_STYLE.octave.color);
    expect(colors).toContain(DEFAULT_PITCH_GRID_STYLE.natural.color);
    expect(colors).toContain(DEFAULT_PITCH_GRID_STYLE.accidental.color);

    vi.mocked(context.fillRect).mockImplementationOnce(() => {
      throw new Error('draw failure');
    });
    expect(() =>
      drawPitchGrid(context, viewport, DEFAULT_PITCH_GRID_STYLE),
    ).toThrow('draw failure');
    expect(context.restore).toHaveBeenCalledTimes(2);
  });

  it('skips invalid style line widths safely', () => {
    const context = mockContext();
    const viewport = createPitchGridViewport({
      widthCssPx: 500,
      heightCssPx: 416,
      devicePixelRatio: 1,
      ...DEFAULT_PITCH_GRID_RANGE,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    });
    if (!viewport) return;
    const style: PitchGridStyle = {
      ...DEFAULT_PITCH_GRID_STYLE,
      markerWidthCssPx: 0,
      gutterSeparatorWidthCssPx: 0,
    };
    drawPitchGrid(context, viewport, style);
    expect(context.save).not.toHaveBeenCalled();
  });
});
