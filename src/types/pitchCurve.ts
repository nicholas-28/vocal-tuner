import type { PitchHistoryPoint } from './pitchHistory';

export type PitchCurveConfig = {
  interpolation?: 'linear' | 'monotone';
  visibleDurationMs: number;
  maxConnectIntervalMs: number;
  strokeColor: string;
  strokeWidthCssPx: number;
  pointRadiusCssPx: number;
};

export type PitchCurveSegment = readonly PitchHistoryPoint[];
