export function formatPracticeDuration(durationMs: number): string {
  if (!isValidDuration(durationMs)) return '—';
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(1)} s`;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatPracticeDurationLong(durationMs: number): string {
  if (!isValidDuration(durationMs)) return 'Unavailable';
  if (durationMs < 60_000) {
    const seconds = Number((durationMs / 1000).toFixed(1));
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`];
  if (seconds > 0)
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  return parts.join(' ');
}

export function formatOnTargetShare(share: number | null): string | null {
  if (share === null || !Number.isFinite(share) || share < 0 || share > 1)
    return null;
  return `${(share * 100).toFixed(1)}%`;
}

function isValidDuration(durationMs: number): boolean {
  return Number.isFinite(durationMs) && durationMs >= 0;
}
