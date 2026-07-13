import { describe, expect, it } from 'vitest';
import {
  formatTargetDistance,
  getTargetInstruction,
} from './targetDistanceFormatting';

describe('target distance formatting', () => {
  it.each([
    [0, 'Within 10 cents of A4'],
    [-10, 'Within 10 cents of A4'],
    [10, 'Within 10 cents of A4'],
    [-10.1, '10.1 cents below A4'],
    [35.25, '35.3 cents above A4'],
    [100, '1 semitone above A4'],
    [-200, '2 semitones below A4'],
    [1200, '1 octave above A4'],
    [-2400, '2 octaves below A4'],
    [1350.25, '1 octave, 1 semitone, and 50.3 cents above A4'],
  ] as const)('formats %s cents meaningfully', (cents, expected) => {
    expect(formatTargetDistance(cents, 'A4')).toBe(expected);
  });

  it('rejects unusable values', () => {
    expect(formatTargetDistance(Number.NaN, 'A4')).toBeNull();
    expect(formatTargetDistance(0, '')).toBeNull();
  });

  it('never inverts corrective direction', () => {
    expect(getTargetInstruction('below')).toBe('Raise the pitch');
    expect(getTargetInstruction('on-target')).toBe('On target');
    expect(getTargetInstruction('above')).toBe('Lower the pitch');
  });
});
