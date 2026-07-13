import type { CentsDisplayConfig } from '../types/centsMeter';

export const MINIMUM_CENTS = -50;
export const MAXIMUM_CENTS = 50;

export const DEFAULT_CENTS_DISPLAY_CONFIG: Readonly<CentsDisplayConfig> = {
  timeConstantMs: 150,
  inTuneToleranceCents: 5,
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
