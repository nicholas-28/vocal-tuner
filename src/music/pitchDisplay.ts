export function formatFrequency(frequencyHz: number | null): string {
  return frequencyHz === null || !Number.isFinite(frequencyHz)
    ? '— Hz'
    : `${frequencyHz.toFixed(1)} Hz`;
}

export function formatCents(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return '— cents';
  const displayValue = Math.abs(cents) < 0.05 ? 0 : cents;
  return `${displayValue >= 0 ? '+' : ''}${displayValue.toFixed(1)} cents`;
}

export function centsToIndicatorPercent(cents: number | null): number {
  if (cents === null || !Number.isFinite(cents)) return 50;
  return ((Math.min(50, Math.max(-50, cents)) + 50) / 100) * 100;
}
