import { describe, expect, it } from 'vitest';
import {
  formatOnTargetShare,
  formatPracticeDuration,
  formatPracticeDurationLong,
} from './practiceDurationFormatting';

describe('practice duration formatting', () => {
  it.each([
    [0, '0.0 s'],
    [12_350, '12.3 s'],
    [59_950, '60.0 s'],
    [60_000, '1:00'],
    [83_000, '1:23'],
    [125_000, '2:05'],
  ] as const)('formats %s ms as %s', (duration, expected) => {
    expect(formatPracticeDuration(duration)).toBe(expected);
  });

  it('formats accessible long durations', () => {
    expect(formatPracticeDurationLong(1000)).toBe('1 second');
    expect(formatPracticeDurationLong(12_400)).toBe('12.4 seconds');
    expect(formatPracticeDurationLong(60_000)).toBe('1 minute');
    expect(formatPracticeDurationLong(121_000)).toBe('2 minutes 1 second');
  });

  it('rejects invalid duration and share values', () => {
    expect(formatPracticeDuration(-1)).toBe('—');
    expect(formatPracticeDuration(Number.NaN)).toBe('—');
    expect(formatPracticeDurationLong(Number.POSITIVE_INFINITY)).toBe(
      'Unavailable',
    );
    expect(formatOnTargetShare(null)).toBeNull();
    expect(formatOnTargetShare(-0.1)).toBeNull();
    expect(formatOnTargetShare(1.1)).toBeNull();
  });

  it('formats on-target share without judgment language', () => {
    expect(formatOnTargetShare(0)).toBe('0.0%');
    expect(formatOnTargetShare(0.6)).toBe('60.0%');
    expect(formatOnTargetShare(1)).toBe('100.0%');
  });
});
