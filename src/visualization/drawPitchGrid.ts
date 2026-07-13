import type { PitchGridStyle, PitchGridViewport } from '../types/pitchGrid';
import { ALL_LABELS_MIN_SEMITONE_HEIGHT_CSS_PX } from './pitchGridConfig';
import { getPitchGridNote } from './pitchGridNotes';
import {
  alignStrokeCoordinate,
  getCrispStrokeWidth,
  getVisibleMidiSequence,
  midiToY,
} from './pitchGridViewport';

function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidPitchGridStyle(style: PitchGridStyle): boolean {
  const lines = [style.octave, style.natural, style.accidental];
  return (
    isNonEmptyString(style.backgroundColor) &&
    isNonEmptyString(style.accidentalBandColor) &&
    isNonEmptyString(style.gutterSeparatorColor) &&
    isNonEmptyString(style.markerColor) &&
    Number.isFinite(style.gutterSeparatorWidthCssPx) &&
    style.gutterSeparatorWidthCssPx > 0 &&
    Number.isFinite(style.markerWidthCssPx) &&
    style.markerWidthCssPx > 0 &&
    Number.isFinite(style.labelInsetCssPx) &&
    style.labelInsetCssPx >= 0 &&
    lines.every(
      (line) =>
        isNonEmptyString(line.color) &&
        isNonEmptyString(line.labelColor) &&
        isNonEmptyString(line.labelFont) &&
        Number.isFinite(line.widthCssPx) &&
        line.widthCssPx > 0,
    )
  );
}

function strokeLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
) {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

export function drawPitchGrid(
  context: CanvasRenderingContext2D,
  viewport: PitchGridViewport,
  style: PitchGridStyle,
): void {
  const midiNotes = getVisibleMidiSequence(viewport);
  if (
    !midiNotes ||
    !isValidPitchGridStyle(style) ||
    viewport.backingWidthPx <= 0 ||
    viewport.backingHeightPx <= 0
  )
    return;

  context.save();
  try {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, viewport.backingWidthPx, viewport.backingHeightPx);
    context.setTransform(
      viewport.devicePixelRatio,
      0,
      0,
      viewport.devicePixelRatio,
      0,
      0,
    );
    context.fillStyle = style.backgroundColor;
    context.fillRect(0, 0, viewport.widthCssPx, viewport.heightCssPx);

    for (const midi of midiNotes) {
      const note = getPitchGridNote(midi);
      const centerY = midiToY(midi, viewport);
      if (!note || centerY === null) continue;
      if (!note.isNatural) {
        context.fillStyle = style.accidentalBandColor;
        context.fillRect(
          viewport.graphLeftX,
          centerY - viewport.semitoneHeight / 2,
          viewport.graphWidth,
          viewport.semitoneHeight,
        );
      }
    }

    for (const midi of midiNotes) {
      const note = getPitchGridNote(midi);
      const centerY = midiToY(midi, viewport);
      if (!note || centerY === null) continue;
      const lineStyle = note.isOctaveC
        ? style.octave
        : note.isNatural
          ? style.natural
          : style.accidental;
      const alignedY = alignStrokeCoordinate(
        centerY,
        lineStyle.widthCssPx,
        viewport.devicePixelRatio,
      );
      const crispWidth = getCrispStrokeWidth(
        lineStyle.widthCssPx,
        viewport.devicePixelRatio,
      );
      if (alignedY === null || crispWidth === null) continue;
      strokeLine(
        context,
        viewport.graphLeftX,
        alignedY,
        viewport.graphRightX,
        alignedY,
        lineStyle.color,
        crispWidth,
      );

      const showLabel =
        viewport.semitoneHeight >= ALL_LABELS_MIN_SEMITONE_HEIGHT_CSS_PX ||
        note.isNatural;
      if (showLabel && viewport.labelGutterCssPx > 0) {
        context.fillStyle = lineStyle.labelColor;
        context.font = lineStyle.labelFont;
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(
          note.label,
          viewport.graphLeftX - style.labelInsetCssPx,
          centerY,
        );
      }
    }

    const separatorX = alignStrokeCoordinate(
      viewport.graphLeftX,
      style.gutterSeparatorWidthCssPx,
      viewport.devicePixelRatio,
    );
    const separatorWidth = getCrispStrokeWidth(
      style.gutterSeparatorWidthCssPx,
      viewport.devicePixelRatio,
    );
    if (
      viewport.labelGutterCssPx > 0 &&
      separatorX !== null &&
      separatorWidth !== null
    ) {
      strokeLine(
        context,
        separatorX,
        viewport.graphTopY,
        separatorX,
        viewport.graphBottomY,
        style.gutterSeparatorColor,
        separatorWidth,
      );
    }
    const markerX = alignStrokeCoordinate(
      viewport.presentTimeX,
      style.markerWidthCssPx,
      viewport.devicePixelRatio,
    );
    const markerWidth = getCrispStrokeWidth(
      style.markerWidthCssPx,
      viewport.devicePixelRatio,
    );
    if (markerX !== null && markerWidth !== null) {
      strokeLine(
        context,
        markerX,
        viewport.graphTopY,
        markerX,
        viewport.graphBottomY,
        style.markerColor,
        markerWidth,
      );
    }
  } finally {
    context.restore();
  }
}
