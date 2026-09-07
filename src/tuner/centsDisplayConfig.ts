import { PITCH_CALIBRATION } from '../calibration/pitchCalibration';
import type { CentsDisplayConfig } from '../types/centsMeter';

export const MINIMUM_CENTS = -PITCH_CALIBRATION.visualLimitCents;
export const MAXIMUM_CENTS = PITCH_CALIBRATION.visualLimitCents;

export const DEFAULT_CENTS_DISPLAY_CONFIG: Readonly<CentsDisplayConfig> = {
  timeConstantMs: 150,
  inTuneToleranceCents: PITCH_CALIBRATION.inTuneCents,
};

export function isValidCentsDisplayConfig(config: CentsDisplayConfig): boolean {
  return (
    Number.isFinite(config.timeConstantMs) &&
    config.timeConstantMs > 0 &&
    Number.isFinite(config.inTuneToleranceCents) &&
    config.inTuneToleranceCents >= 0 &&
    config.inTuneToleranceCents < MAXIMUM_CENTS
  );
}
