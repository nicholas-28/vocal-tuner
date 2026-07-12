import { describe, expect, it } from 'vitest';
import {
  centsToIndicatorPercent,
  formatCents,
  formatFrequency,
} from './pitchDisplay';

describe('pitch display utilities', () => {
  it('formats values and neutral placeholders', () => {
    expect(formatFrequency(440.04)).toBe('440.0 Hz');
    expect(formatFrequency(null)).toBe('— Hz');
    expect(formatCents(12.34)).toBe('+12.3 cents');
    expect(formatCents(-12.34)).toBe('-12.3 cents');
    expect(formatCents(-0.00001)).toBe('+0.0 cents');
    expect(formatCents(null)).toBe('— cents');
  });

  it.each([
    [-75, 0],
    [-50, 0],
    [0, 50],
    [50, 100],
    [75, 100],
    [null, 50],
  ] as const)('maps %s cents to %s percent', (cents, percent) => {
    expect(centsToIndicatorPercent(cents)).toBe(percent);
  });
});
