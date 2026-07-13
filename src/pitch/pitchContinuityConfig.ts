import type { PitchContinuityConfig } from '../types/pitchContinuity';

export const DEFAULT_PITCH_CONTINUITY_CONFIG: Readonly<PitchContinuityConfig> =
  {
    gracePeriodMs: 160,
  };

export function isValidPitchContinuityConfig(
  config: PitchContinuityConfig,
): boolean {
  return Number.isFinite(config.gracePeriodMs) && config.gracePeriodMs > 0;
}
