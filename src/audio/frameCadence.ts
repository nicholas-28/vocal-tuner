/** Phase-preserving RAF gate. Missed slots are skipped, never replayed. */
export function createFrameCadence(intervalMs: number) {
  let nextAt: number | null = null;
  // Allow sub-millisecond RAF jitter without losing a whole low-power frame.
  // Deadlines stay anchored: this never accumulates into a higher target rate.
  const epsilonMs = 1;
  return (timestampMs: number): boolean => {
    if (!Number.isFinite(timestampMs)) return false;
    if (nextAt === null) nextAt = timestampMs;
    if (timestampMs + epsilonMs < nextAt) return false;
    const slots =
      Math.floor((timestampMs + epsilonMs - nextAt) / intervalMs) + 1;
    nextAt += slots * intervalMs;
    return true;
  };
}
