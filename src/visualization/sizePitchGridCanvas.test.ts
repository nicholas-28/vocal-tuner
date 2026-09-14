import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
} from './pitchGridConfig';
import { createPitchGridViewport } from './pitchGridViewport';
import { sizePitchGridCanvas } from './sizePitchGridCanvas';

describe('sizePitchGridCanvas', () => {
  it('keeps CSS and backing sizes separate without compounding repeated sizing', () => {
    const canvas = document.createElement('canvas');
    const viewport = createPitchGridViewport({
      widthCssPx: 320,
      heightCssPx: 400,
      devicePixelRatio: 1.5,
      ...DEFAULT_PITCH_GRID_RANGE,
      ...DEFAULT_PITCH_GRID_LAYOUT,
      presentTimeXRatio: 0.8,
    });
    if (!viewport) return;
    sizePitchGridCanvas(canvas, viewport);
    sizePitchGridCanvas(canvas, viewport);
    expect(canvas.width).toBe(480);
    expect(canvas.height).toBe(600);
    expect(canvas.style.width).toBe('320px');
    expect(canvas.style.height).toBe('400px');
  });
});

it('does not erase an unchanged canvas when guides change', () => {
  let writes = 0;
  const canvas = {
    get width() {
      return 640;
    },
    set width(_value: number) {
      writes++;
    },
    get height() {
      return 800;
    },
    set height(_value: number) {
      writes++;
    },
    style: {},
  } as HTMLCanvasElement;
  const viewport = createPitchGridViewport({
    ...DEFAULT_PITCH_GRID_RANGE,
    ...DEFAULT_PITCH_GRID_LAYOUT,
    widthCssPx: 320,
    heightCssPx: 400,
    devicePixelRatio: 2,
    presentTimeXRatio: 0.96,
  })!;
  sizePitchGridCanvas(canvas, viewport);
  expect(writes).toBe(0);
});
