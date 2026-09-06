export type AnalysisDurationSummary = Readonly<{
  count: number;
  p50Ms: number | null;
  p95Ms: number | null;
  maximumMs: number | null;
  above8Ms: number;
}>;

/** Metadata only. Instantiate exclusively when audio diagnostics are requested. */
export function createAnalysisDurationProbe() {
  const durations = new Float64Array(128);
  let count = 0;
  let cursor = 0;
  return {
    record(durationMs: number) {
      if (!Number.isFinite(durationMs) || durationMs < 0) return;
      durations[cursor] = durationMs;
      cursor = (cursor + 1) % durations.length;
      count = Math.min(count + 1, durations.length);
    },
    reset() {
      count = 0;
      cursor = 0;
    },
    getSummary(): AnalysisDurationSummary {
      const ordered = Array.from(durations.subarray(0, count)).sort(
        (a, b) => a - b,
      );
      return {
        count,
        p50Ms: ordered[Math.ceil(count * 0.5) - 1] ?? null,
        p95Ms: ordered[Math.ceil(count * 0.95) - 1] ?? null,
        maximumMs: ordered.at(-1) ?? null,
        above8Ms: ordered.filter((duration) => duration > 8).length,
      };
    },
  };
}
