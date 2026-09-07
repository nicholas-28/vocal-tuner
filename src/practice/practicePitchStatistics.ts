import type { PracticeMetrics } from '../types/practiceSession';

type PitchStatistics = Pick<
  PracticeMetrics,
  'measurableVoicedMs' | 'pitchMeanCents' | 'pitchM2CentsSquaredMs'
>;

/** Weighted Welford update. Called only for the same capped raw intervals as timing. */
export function accumulatePracticePitch(
  current: PitchStatistics,
  cents: number,
  durationMs: number,
) {
  const totalMs = current.measurableVoicedMs + durationMs;
  const delta = cents - current.pitchMeanCents;
  const pitchMeanCents =
    current.pitchMeanCents + delta * (durationMs / totalMs);
  return {
    pitchMeanCents,
    pitchM2CentsSquaredMs:
      current.pitchM2CentsSquaredMs +
      durationMs * delta * (cents - pitchMeanCents),
  };
}

/** Session-wide descriptive statistics, never a success, stability, or vibrato classifier. */
export function summarizePracticePitch(metrics: PitchStatistics) {
  if (metrics.measurableVoicedMs <= 0) return null;
  return {
    meanCents: metrics.pitchMeanCents,
    spreadCents: Math.sqrt(
      Math.max(0, metrics.pitchM2CentsSquaredMs / metrics.measurableVoicedMs),
    ),
  };
}
