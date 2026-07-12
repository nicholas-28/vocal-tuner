import type { PitchGridViewport } from '../types/pitchGrid';

export function getHistoricalWidth(viewport: PitchGridViewport): number | null {
  const width = viewport.presentTimeX - viewport.graphLeftX;
  return Number.isFinite(width) && width > 0 ? width : null;
}

export function getPixelsPerMs(
  viewport: PitchGridViewport,
  visibleDurationMs: number,
): number | null {
  const width = getHistoricalWidth(viewport);
  if (
    width === null ||
    !Number.isFinite(visibleDurationMs) ||
    visibleDurationMs <= 0
  ) {
    return null;
  }
  return width / visibleDurationMs;
}

export function timestampToX(
  timestampMs: number,
  referenceTimeMs: number,
  viewport: PitchGridViewport,
  visibleDurationMs: number,
): number | null {
  const pixelsPerMs = getPixelsPerMs(viewport, visibleDurationMs);
  if (
    pixelsPerMs === null ||
    !Number.isFinite(timestampMs) ||
    !Number.isFinite(referenceTimeMs) ||
    timestampMs < 0 ||
    referenceTimeMs < 0 ||
    timestampMs > referenceTimeMs ||
    timestampMs < referenceTimeMs - visibleDurationMs
  ) {
    return null;
  }
  const x =
    viewport.presentTimeX - (referenceTimeMs - timestampMs) * pixelsPerMs;
  return Number.isFinite(x) ? x : null;
}

export function xToTimestamp(
  x: number,
  referenceTimeMs: number,
  viewport: PitchGridViewport,
  visibleDurationMs: number,
): number | null {
  const pixelsPerMs = getPixelsPerMs(viewport, visibleDurationMs);
  if (
    pixelsPerMs === null ||
    !Number.isFinite(x) ||
    !Number.isFinite(referenceTimeMs) ||
    x < viewport.graphLeftX ||
    x > viewport.presentTimeX
  ) {
    return null;
  }
  const timestamp = referenceTimeMs - (viewport.presentTimeX - x) / pixelsPerMs;
  return Number.isFinite(timestamp) ? timestamp : null;
}
