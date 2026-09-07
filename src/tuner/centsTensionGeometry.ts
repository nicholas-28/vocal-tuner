import { MAXIMUM_CENTS, MINIMUM_CENTS } from './centsDisplayConfig';
import { centsToMeterPercent } from './centsDisplaySmoothing';

/** Presentation only: a tapered ribbon in a 100 × 48 viewBox, anchored at x=50. */
export function getCentsTensionGeometry(cents: number | null) {
  if (cents === null || !Number.isFinite(cents)) return null;
  const endpointPercent = centsToMeterPercent(cents)!;
  const displacement = endpointPercent - 50;
  const direction =
    displacement < 0 ? 'flat' : displacement > 0 ? 'sharp' : 'center';
  // Collapse both length and thickness through zero; no dead zone or overshoot.
  const height = Math.min(12, Math.abs(displacement) * 1.2);
  const midpoint = (50 + endpointPercent) / 2;
  const path =
    displacement === 0
      ? ''
      : `M 50 ${24 - height / 3} Q ${midpoint} ${24 - height} ${endpointPercent} 24 Q ${midpoint} ${24 + height} 50 ${24 + height / 3} Z`;
  return {
    endpointPercent,
    direction,
    path,
    clamped: cents < MINIMUM_CENTS || cents > MAXIMUM_CENTS,
  };
}
