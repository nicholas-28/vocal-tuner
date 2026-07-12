import { DEFAULT_HISTORY_DURATION_MS } from '../history/pitchHistoryConfig';
import type { PitchCurveConfig } from '../types/pitchCurve';

export const MAX_PITCH_CURVE_CONNECT_INTERVAL_MS = 250;

export const DEFAULT_PITCH_CURVE_CONFIG: Readonly<PitchCurveConfig> = {
  visibleDurationMs: DEFAULT_HISTORY_DURATION_MS,
  maxConnectIntervalMs: MAX_PITCH_CURVE_CONNECT_INTERVAL_MS,
  strokeColor: '#78dfcb',
  strokeWidthCssPx: 2,
  pointRadiusCssPx: 1.5,
};

export function isValidPitchCurveConfig(config: PitchCurveConfig): boolean {
  return (
    Number.isFinite(config.visibleDurationMs) &&
    config.visibleDurationMs > 0 &&
    Number.isFinite(config.maxConnectIntervalMs) &&
    config.maxConnectIntervalMs > 0 &&
    typeof config.strokeColor === 'string' &&
    config.strokeColor.trim().length > 0 &&
    Number.isFinite(config.strokeWidthCssPx) &&
    config.strokeWidthCssPx > 0 &&
    Number.isFinite(config.pointRadiusCssPx) &&
    config.pointRadiusCssPx > 0
  );
}
