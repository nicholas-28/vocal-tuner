import { describe, expect, it } from 'vitest';
import { getCentsTensionGeometry } from './centsTensionGeometry';

describe('getCentsTensionGeometry', () => {
  it('collapses at the fixed center without a displacement', () => {
    expect(getCentsTensionGeometry(0)).toEqual({
      endpointPercent: 50,
      direction: 'center',
      path: '',
      clamped: false,
    });
  });

  it.each([
    [-25, 25, 'flat'],
    [25, 75, 'sharp'],
    [-50, 0, 'flat'],
    [50, 100, 'sharp'],
    [-500, 0, 'flat'],
    [500, 100, 'sharp'],
  ] as const)(
    'maps %s cents to a bounded %s endpoint',
    (cents, endpoint, direction) => {
      const geometry = getCentsTensionGeometry(cents)!;
      expect(geometry.endpointPercent).toBe(endpoint);
      expect(geometry.direction).toBe(direction);
      expect(geometry.path).toMatch(/^M 50 /);
      expect(geometry.clamped).toBe(Math.abs(cents) > 50);
    },
  );

  it('contracts through zero and grows on the other side without a dead zone', () => {
    const endpoints = [-5, -0.01, 0, 0.01, 5].map(
      (cents) => getCentsTensionGeometry(cents)!.endpointPercent,
    );
    [45, 49.99, 50, 50.01, 55].forEach((expected, index) =>
      expect(endpoints[index]).toBeCloseTo(expected, 8),
    );
    expect(getCentsTensionGeometry(-0.01)!.path).not.toBe('');
    expect(getCentsTensionGeometry(0.01)!.path).not.toBe('');
  });

  it.each([null, NaN, Infinity, -Infinity])(
    'does not invent geometry for %s',
    (cents) => {
      expect(getCentsTensionGeometry(cents)).toBeNull();
    },
  );
});
