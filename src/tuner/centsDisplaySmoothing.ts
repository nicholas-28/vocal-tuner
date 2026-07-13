import type {
  CentsClassification,
  CentsDisplayConfig,
  CentsDisplayInput,
  CentsDisplayState,
} from '../types/centsMeter';
import {
  DEFAULT_CENTS_DISPLAY_CONFIG,
  MAXIMUM_CENTS,
  MINIMUM_CENTS,
  isValidCentsDisplayConfig,
} from './centsDisplayConfig';

export function centsToMeterPercent(cents: number): number | null {
  if (!Number.isFinite(cents)) return null;
  const clamped = Math.min(MAXIMUM_CENTS, Math.max(MINIMUM_CENTS, cents));
  return ((clamped - MINIMUM_CENTS) / (MAXIMUM_CENTS - MINIMUM_CENTS)) * 100;
}

export function classifyCents(
  cents: number | null,
  toleranceCents = DEFAULT_CENTS_DISPLAY_CONFIG.inTuneToleranceCents,
): CentsClassification | null {
  if (
    cents === null ||
    !Number.isFinite(cents) ||
    !Number.isFinite(toleranceCents) ||
    toleranceCents < 0 ||
    toleranceCents >= MAXIMUM_CENTS
  )
    return null;
  if (cents < -toleranceCents) return 'flat';
  if (cents > toleranceCents) return 'sharp';
  return 'in-tune';
}

export function transitionCentsDisplay(
  current: CentsDisplayState,
  input: CentsDisplayInput,
  requestedConfig: CentsDisplayConfig = DEFAULT_CENTS_DISPLAY_CONFIG,
): CentsDisplayState {
  const config = isValidCentsDisplayConfig(requestedConfig)
    ? requestedConfig
    : DEFAULT_CENTS_DISPLAY_CONFIG;

  if (input.continuityStatus === 'unvoiced') return null;
  if (input.continuityStatus === 'uncertain') return current;
  if (!isValidMeasurement(input)) return current;

  const rawCents = input.rawCents as number;
  const noteMidi = input.noteMidi as number;
  const timestampMs = input.timestampMs as number;
  if (
    current === null ||
    current.noteMidi !== noteMidi ||
    input.reducedMotion
  ) {
    return { displayCents: rawCents, noteMidi, timestampMs };
  }

  const deltaTimeMs = timestampMs - current.timestampMs;
  if (!Number.isFinite(deltaTimeMs) || deltaTimeMs <= 0) return current;
  const alpha = 1 - Math.exp(-deltaTimeMs / config.timeConstantMs);
  const displayCents =
    current.displayCents + alpha * (rawCents - current.displayCents);
  if (!Number.isFinite(displayCents)) return current;
  return { displayCents, noteMidi, timestampMs };
}

function isValidMeasurement(input: CentsDisplayInput): boolean {
  return (
    input.rawCents !== null &&
    Number.isFinite(input.rawCents) &&
    input.noteMidi !== null &&
    Number.isInteger(input.noteMidi) &&
    input.timestampMs !== null &&
    Number.isFinite(input.timestampMs) &&
    input.timestampMs >= 0
  );
}
