export const VISUAL_RESPONSE = Object.freeze({
  quietTimeConstantMs: 65,
  fastTimeConstantMs: 25,
  quietDisplacementCents: 3,
});

/** Exact two-rate exponential integration: no overshoot, prediction, or raw mutation. */
export function smoothVisualCents(
  current: number,
  target: number,
  elapsedMs: number,
  quietTimeConstantMs: number = VISUAL_RESPONSE.quietTimeConstantMs,
): number {
  const error = current - target;
  const distance = Math.abs(error);
  if (distance === 0 || elapsedMs <= 0) return current;
  const fastMs = Math.min(
    VISUAL_RESPONSE.fastTimeConstantMs,
    quietTimeConstantMs,
  );
  const fastDuration =
    distance > VISUAL_RESPONSE.quietDisplacementCents
      ? fastMs * Math.log(distance / VISUAL_RESPONSE.quietDisplacementCents)
      : 0;
  const fastElapsed = Math.min(elapsedMs, fastDuration);
  const remainingError =
    error *
    Math.exp(-fastElapsed / fastMs) *
    Math.exp(-(elapsedMs - fastElapsed) / quietTimeConstantMs);
  return target + remainingError;
}
