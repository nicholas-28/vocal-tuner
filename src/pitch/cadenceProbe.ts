/** Bounded timing metadata, enabled only by the diagnostics owner. */
export function createCadenceProbe() {
  const timestamps = new Float64Array(128);
  let count = 0;
  let cursor = 0;
  let last: number | null = null;
  return {
    record(timestampMs: number) {
      if (
        !Number.isFinite(timestampMs) ||
        (last !== null && timestampMs <= last)
      )
        return;
      last = timestampMs;
      timestamps[cursor] = timestampMs;
      cursor = (cursor + 1) % timestamps.length;
      count = Math.min(count + 1, timestamps.length);
    },
    reset() {
      count = 0;
      cursor = 0;
      last = null;
    },
    getSummary(nowMs = performance.now()) {
      const values = Array.from(
        { length: count },
        (_, i) =>
          timestamps[
            (cursor - count + i + timestamps.length) % timestamps.length
          ],
      );
      const intervals = values.slice(1).map((value, i) => value - values[i]);
      const sorted = [...intervals].sort((a, b) => a - b);
      const active = last !== null && nowMs >= last && nowMs - last <= 250;
      return {
        count,
        hz:
          intervals.length && active
            ? (intervals.length * 1000) / (values.at(-1)! - values[0])
            : null,
        medianMs: sorted[Math.ceil(sorted.length * 0.5) - 1] ?? null,
        p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? null,
      };
    },
  };
}
