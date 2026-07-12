import type { PitchCurveSegment } from '../types/pitchCurve';
import type { PitchGridViewport } from '../types/pitchGrid';
import type { PitchHistoryPoint } from '../types/pitchHistory';
import { timestampToX } from './pitchTimeCoordinates';

export function buildPitchCurveSegments(
  points: readonly PitchHistoryPoint[],
  viewport: PitchGridViewport,
  referenceTimeMs: number,
  visibleDurationMs: number,
  maxConnectIntervalMs: number,
): PitchCurveSegment[] {
  if (
    !Number.isFinite(referenceTimeMs) ||
    referenceTimeMs < 0 ||
    !Number.isFinite(maxConnectIntervalMs) ||
    maxConnectIntervalMs <= 0
  ) {
    return [];
  }

  const segments: PitchHistoryPoint[][] = [];
  let current: PitchHistoryPoint[] = [];
  let previousTimestampMs: number | null = null;

  const breakSegment = () => {
    if (current.length > 0) segments.push(current);
    current = [];
  };

  for (const point of points) {
    const validTimestamp =
      Number.isFinite(point.timestampMs) && point.timestampMs >= 0;
    const monotonic =
      validTimestamp &&
      (previousTimestampMs === null || point.timestampMs > previousTimestampMs);
    const validPitch =
      point.kind === 'pitch' &&
      point.midi !== null &&
      Number.isFinite(point.midi) &&
      point.midi >= viewport.lowMidi &&
      point.midi <= viewport.highMidi;
    const visible =
      validTimestamp &&
      timestampToX(
        point.timestampMs,
        referenceTimeMs,
        viewport,
        visibleDurationMs,
      ) !== null;
    const connectable =
      previousTimestampMs === null ||
      point.timestampMs - previousTimestampMs <= maxConnectIntervalMs;

    if (!monotonic || !validPitch || !visible || !connectable) {
      breakSegment();
    }
    if (monotonic && validPitch && visible) current.push(point);

    previousTimestampMs = validTimestamp ? point.timestampMs : null;
  }
  breakSegment();
  return segments;
}
