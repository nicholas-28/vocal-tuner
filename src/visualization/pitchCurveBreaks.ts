/** Render-only rejection timestamps. Never stored pitch, interpolation, or scoring evidence. */
export type PitchCurveBreaks = Readonly<{
  record(timestampMs: number, rejected: boolean): void;
  reset(): void;
  between(startMs: number, endMs: number): boolean;
  readonly count: number;
}>;

export function createPitchCurveBreaks(retentionMs = 30_000): PitchCurveBreaks {
  const timestamps = new Float64Array(1024);
  let start = 0,
    count = 0,
    last = -1,
    discardedThrough = -1;
  const at = (index: number) => timestamps[(start + index) % timestamps.length];
  return {
    get count() {
      return count;
    },
    reset() {
      start = 0;
      count = 0;
      last = -1;
      discardedThrough = -1;
    },
    record(timestampMs, rejected) {
      if (
        !Number.isFinite(timestampMs) ||
        timestampMs < 0 ||
        timestampMs <= last
      )
        return;
      last = timestampMs;
      while (count && at(0) < timestampMs - retentionMs) {
        start = (start + 1) % timestamps.length;
        count--;
      }
      if (!rejected) return;
      if (count === timestamps.length) {
        // If pathological overproduction exhausts capacity, fail closed for that older interval.
        discardedThrough = at(0);
        start = (start + 1) % timestamps.length;
        count--;
      }
      timestamps[(start + count) % timestamps.length] = timestampMs;
      count++;
    },
    between(startMs, endMs) {
      if (startMs <= discardedThrough) return true;
      let low = 0,
        high = count;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (at(mid) <= startMs) low = mid + 1;
        else high = mid;
      }
      return low < count && at(low) <= endMs;
    },
  };
}
