import type { PitchGridViewport } from '../types/pitchGrid';

export function sizePitchGridCanvas(
  canvas: HTMLCanvasElement,
  viewport: PitchGridViewport,
): void {
  if (canvas.width !== viewport.backingWidthPx)
    canvas.width = viewport.backingWidthPx;
  if (canvas.height !== viewport.backingHeightPx)
    canvas.height = viewport.backingHeightPx;
  canvas.style.width = `${viewport.widthCssPx}px`;
  canvas.style.height = `${viewport.heightCssPx}px`;
}
