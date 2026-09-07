/** Provisional feedback bands, not a physiological standard or exercise pass rule. */
export const PITCH_CALIBRATION = Object.freeze({
  deadCenterCents: 5,
  inTuneCents: 10,
  closeCents: 25,
  visualLimitCents: 50,
});

export function classifyPitchAccuracy(cents: number | null) {
  if (cents === null || !Number.isFinite(cents)) return null;
  const distance = Math.abs(cents);
  if (distance <= PITCH_CALIBRATION.deadCenterCents) return 'dead-center';
  if (distance <= PITCH_CALIBRATION.inTuneCents) return 'in-tune';
  if (distance <= PITCH_CALIBRATION.closeCents) return 'close';
  return 'outside';
}
