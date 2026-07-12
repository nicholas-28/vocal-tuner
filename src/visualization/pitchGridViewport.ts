import type {
  MidiRange,
  PitchGridViewport,
  PitchGridViewportInput,
} from '../types/pitchGrid';
import { MAX_DEVICE_PIXEL_RATIO } from './pitchGridConfig';

export function isValidMidiRange(range: MidiRange): boolean {
  return (
    Number.isFinite(range.lowMidi) &&
    Number.isFinite(range.highMidi) &&
    Number.isInteger(range.lowMidi) &&
    Number.isInteger(range.highMidi) &&
    range.highMidi > range.lowMidi
  );
}

export function getVisibleMidiSequence(range: MidiRange): number[] | null {
  if (!isValidMidiRange(range)) return null;
  return Array.from(
    { length: range.highMidi - range.lowMidi + 1 },
    (_, index) => range.highMidi - index,
  );
}

export function normalizeDevicePixelRatio(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(value, MAX_DEVICE_PIXEL_RATIO);
}

export function normalizePresentTimeRatio(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function createPitchGridViewport(
  input: PitchGridViewportInput,
): PitchGridViewport | null {
  if (
    !isValidMidiRange(input) ||
    !Number.isFinite(input.widthCssPx) ||
    !Number.isFinite(input.heightCssPx) ||
    input.widthCssPx <= 0 ||
    input.heightCssPx <= 0 ||
    !isNonNegativeFinite(input.labelGutterCssPx) ||
    !isNonNegativeFinite(input.rightPaddingCssPx) ||
    !isNonNegativeFinite(input.topPaddingCssPx) ||
    !isNonNegativeFinite(input.bottomPaddingCssPx)
  ) {
    return null;
  }

  const presentTimeXRatio = normalizePresentTimeRatio(input.presentTimeXRatio);
  if (presentTimeXRatio === null) return null;

  const graphLeftX = input.labelGutterCssPx;
  const graphRightX = input.widthCssPx - input.rightPaddingCssPx;
  const graphTopY = input.topPaddingCssPx;
  const graphBottomY = input.heightCssPx - input.bottomPaddingCssPx;
  const graphWidth = graphRightX - graphLeftX;
  const graphHeight = graphBottomY - graphTopY;
  if (graphWidth <= 0 || graphHeight <= 0) return null;

  const devicePixelRatio = normalizeDevicePixelRatio(input.devicePixelRatio);
  const visibleNoteCount = input.highMidi - input.lowMidi + 1;

  return {
    ...input,
    devicePixelRatio,
    presentTimeXRatio,
    backingWidthPx: Math.round(input.widthCssPx * devicePixelRatio),
    backingHeightPx: Math.round(input.heightCssPx * devicePixelRatio),
    graphLeftX,
    graphRightX,
    graphTopY,
    graphBottomY,
    graphWidth,
    graphHeight,
    visibleNoteCount,
    semitoneHeight: graphHeight / visibleNoteCount,
    presentTimeX: graphLeftX + graphWidth * presentTimeXRatio,
  };
}

export function isValidPitchGridViewport(viewport: PitchGridViewport): boolean {
  return (
    isValidMidiRange(viewport) &&
    Number.isFinite(viewport.widthCssPx) &&
    viewport.widthCssPx > 0 &&
    Number.isFinite(viewport.heightCssPx) &&
    viewport.heightCssPx > 0 &&
    Number.isFinite(viewport.devicePixelRatio) &&
    viewport.devicePixelRatio >= 1 &&
    Number.isFinite(viewport.backingWidthPx) &&
    viewport.backingWidthPx > 0 &&
    Number.isFinite(viewport.backingHeightPx) &&
    viewport.backingHeightPx > 0 &&
    Number.isFinite(viewport.graphLeftX) &&
    Number.isFinite(viewport.graphRightX) &&
    viewport.graphRightX > viewport.graphLeftX &&
    Number.isFinite(viewport.graphTopY) &&
    Number.isFinite(viewport.graphBottomY) &&
    viewport.graphBottomY > viewport.graphTopY &&
    Number.isFinite(viewport.graphWidth) &&
    viewport.graphWidth > 0 &&
    Number.isFinite(viewport.graphHeight) &&
    viewport.graphHeight > 0 &&
    Number.isFinite(viewport.semitoneHeight) &&
    viewport.semitoneHeight > 0 &&
    Number.isFinite(viewport.presentTimeX) &&
    viewport.presentTimeX >= viewport.graphLeftX &&
    viewport.presentTimeX <= viewport.graphRightX
  );
}

export function midiToY(
  midi: number,
  viewport: PitchGridViewport,
): number | null {
  if (!Number.isFinite(midi)) return null;
  return (
    viewport.graphTopY +
    (viewport.highMidi + 0.5 - midi) * viewport.semitoneHeight
  );
}

export function yToMidi(y: number, viewport: PitchGridViewport): number | null {
  if (!Number.isFinite(y)) return null;
  return (
    viewport.highMidi + 0.5 - (y - viewport.graphTopY) / viewport.semitoneHeight
  );
}

export function alignStrokeCoordinate(
  coordinateCssPx: number,
  lineWidthCssPx: number,
  devicePixelRatio: number,
): number | null {
  if (
    !Number.isFinite(coordinateCssPx) ||
    !Number.isFinite(lineWidthCssPx) ||
    lineWidthCssPx <= 0
  ) {
    return null;
  }
  const dpr = normalizeDevicePixelRatio(devicePixelRatio);
  const deviceLineWidth = Math.max(1, Math.round(lineWidthCssPx * dpr));
  const deviceOffset = deviceLineWidth % 2 === 1 ? 0.5 : 0;
  return (Math.round(coordinateCssPx * dpr) + deviceOffset) / dpr;
}

export function getCrispStrokeWidth(
  lineWidthCssPx: number,
  devicePixelRatio: number,
): number | null {
  if (!Number.isFinite(lineWidthCssPx) || lineWidthCssPx <= 0) return null;
  const dpr = normalizeDevicePixelRatio(devicePixelRatio);
  return Math.max(1, Math.round(lineWidthCssPx * dpr)) / dpr;
}
