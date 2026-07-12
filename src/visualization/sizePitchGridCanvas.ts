import type { PitchGridViewport } from '../types/pitchGrid';

export function sizePitchGridCanvas(
  canvas: HTMLCanvasElement,
  viewport: PitchGridViewport,
): void {
  canvas.width = viewport.backingWidthPx;
  canvas.height = viewport.backingHeightPx;
  canvas.style.width = `${viewport.widthCssPx}px`;
  canvas.style.height = `${viewport.heightCssPx}px`;
}
