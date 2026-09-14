import type { PitchCurveBreaks } from './pitchCurveBreaks';
import { interpolatePitchCurve } from './pitchCurveInterpolation';
import type { PitchCurveConfig } from '../types/pitchCurve';
import type { PitchGridViewport } from '../types/pitchGrid';
import type { PitchHistoryPoint } from '../types/pitchHistory';
import { buildPitchCurveSegments } from './pitchCurveSegments';
import { isValidPitchCurveConfig } from './pitchCurveConfig';
import {
  getCrispStrokeWidth,
  isValidPitchGridViewport,
  midiToY,
} from './pitchGridViewport';
import { timestampToX } from './pitchTimeCoordinates';

export function drawPitchCurve(
  context: CanvasRenderingContext2D,
  viewport: PitchGridViewport,
  points: readonly PitchHistoryPoint[],
  referenceTimeMs: number,
  config: PitchCurveConfig,
  breaks?: PitchCurveBreaks,
): void {
  if (
    !isValidPitchCurveConfig(config) ||
    !isValidPitchGridViewport(viewport) ||
    !Number.isFinite(referenceTimeMs) ||
    referenceTimeMs < 0 ||
    viewport.backingWidthPx <= 0 ||
    viewport.backingHeightPx <= 0
  ) {
    return;
  }

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
    context.beginPath();
    context.rect(
      viewport.graphLeftX,
      viewport.graphTopY,
      viewport.presentTimeX - viewport.graphLeftX,
      viewport.graphHeight,
    );
    context.clip();

    const segments = buildPitchCurveSegments(
      points,
      viewport,
      referenceTimeMs,
      config.visibleDurationMs,
      config.maxConnectIntervalMs,
      breaks,
    );
    const strokeWidth = getCrispStrokeWidth(
      config.strokeWidthCssPx,
      viewport.devicePixelRatio,
    );
    if (strokeWidth === null) return;
    context.strokeStyle = config.strokeColor;
    context.fillStyle = config.strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    for (const segment of segments) {
      if (segment.length === 1) {
        const point = segment[0];
        const x = timestampToX(
          point.timestampMs,
          referenceTimeMs,
          viewport,
          config.visibleDurationMs,
        );
        const y = midiToY(point.midi ?? Number.NaN, viewport);
        if (x === null || y === null) continue;
        context.beginPath();
        context.arc(x, y, config.pointRadiusCssPx, 0, Math.PI * 2);
        context.fill();
        continue;
      }

      const vertices = segment.map((point) => ({
        x: timestampToX(
          point.timestampMs,
          referenceTimeMs,
          viewport,
          config.visibleDurationMs,
        )!,
        y: midiToY(point.midi!, viewport)!,
      }));
      context.beginPath();
      context.moveTo(vertices[0].x, vertices[0].y);
      if (config.interpolation === 'monotone') {
        for (const curve of interpolatePitchCurve(vertices)) {
          context.bezierCurveTo(
            curve.control1.x,
            curve.control1.y,
            curve.control2.x,
            curve.control2.y,
            curve.to.x,
            curve.to.y,
          );
        }
      } else {
        for (const point of vertices.slice(1)) context.lineTo(point.x, point.y);
      }
      context.stroke();
    }
  } finally {
    context.restore();
  }
}
