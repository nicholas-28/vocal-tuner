import { expect, it, vi } from 'vitest';
import { drawPitchTarget } from './drawPitchTarget';
import { createPitchGridViewport, midiToY } from './pitchGridViewport';
import { DEFAULT_PITCH_GRID_LAYOUT } from './pitchGridConfig';

it('aligns one dashed target guide exactly with the keyboard semitone and omits absent/outside targets', () => {
  const viewport = createPitchGridViewport({
    ...DEFAULT_PITCH_GRID_LAYOUT,
    lowMidi: 54,
    highMidi: 66,
    widthCssPx: 300,
    heightCssPx: 480,
    devicePixelRatio: 3,
    presentTimeXRatio: 0.96,
  })!;
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  drawPitchTarget(context, viewport, 60);
  expect(context.moveTo).toHaveBeenCalledWith(
    viewport.graphLeftX,
    midiToY(60, viewport),
  );
  expect(context.lineTo).toHaveBeenCalledWith(
    viewport.presentTimeX,
    midiToY(60, viewport),
  );
  expect(context.setLineDash).toHaveBeenCalledWith([5, 5]);
  expect(context.restore).toHaveBeenCalledOnce();
  for (const midi of [null, NaN, 53, 67])
    drawPitchTarget(context, viewport, midi);
  expect(context.stroke).toHaveBeenCalledOnce();
});
