import type { PitchHistoryPoint } from './pitchHistory';

export type PitchCurveConfig = {
  visibleDurationMs: number;
  maxConnectIntervalMs: number;
  strokeColor: string;
  strokeWidthCssPx: number;
  pointRadiusCssPx: number;
};

export type PitchCurveSegment = readonly PitchHistoryPoint[];
