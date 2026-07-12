export const DEFAULT_HISTORY_DURATION_MS = 15_000;
export const MINIMUM_HISTORY_DURATION_MS = 5_000;
export const MAXIMUM_HISTORY_DURATION_MS = 60_000;
export const MAXIMUM_HISTORY_POINTS_PER_SECOND = 15;
export const MINIMUM_HISTORY_INTERVAL_MS =
  1000 / MAXIMUM_HISTORY_POINTS_PER_SECOND;
export const MEANINGFUL_PITCH_CHANGE_MIDI = 0.5;

export function isValidHistoryDuration(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MINIMUM_HISTORY_DURATION_MS &&
    value <= MAXIMUM_HISTORY_DURATION_MS
  );
}
