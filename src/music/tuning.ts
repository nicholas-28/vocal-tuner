export const DEFAULT_TUNING_A4_HZ = 440;
export const MINIMUM_TUNING_A4_HZ = 400;
export const MAXIMUM_TUNING_A4_HZ = 480;

export function isValidTuningReference(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MINIMUM_TUNING_A4_HZ &&
    value <= MAXIMUM_TUNING_A4_HZ
  );
}
