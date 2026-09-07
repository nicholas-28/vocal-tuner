import { describe, expect, it } from 'vitest';
import { classifyCents } from '../tuner/centsDisplaySmoothing';
import {
  classifyTargetDirection,
  classifyTargetDistance,
} from '../target/targetPitchComparison';
import { createPracticeObservation } from '../practice/practiceSession';
import { classifyPitchAccuracy } from './pitchCalibration';

describe('shared immediate pitch calibration', () => {
  it.each([
    [0, 'dead-center'],
    [5, 'dead-center'],
    [5.001, 'in-tune'],
    [10, 'in-tune'],
    [10.001, 'close'],
    [15, 'close'],
    [25, 'close'],
    [25.001, 'outside'],
    [50, 'outside'],
    [500, 'outside'],
  ] as const)('classifies ±%s cents as %s', (cents, band) => {
    expect(classifyPitchAccuracy(cents)).toBe(band);
    expect(classifyPitchAccuracy(-cents)).toBe(band);
  });
  it.each([-10, -7, 0, 7, 10])(
    'agrees across tuner, target, and practice occupancy at %s cents when the target is the nearest note',
    (cents) => {
      expect(classifyCents(cents)).toBe('in-tune');
      expect(classifyTargetDirection(cents)).toBe('on-target');
      expect(createPracticeObservation(cents)?.kind).toBe('on-target');
    },
  );
  it('keeps close distinct from on target', () => {
    expect(classifyTargetDistance(25)).toBe('close');
    expect(classifyTargetDistance(25.001)).toBe('far');
    expect(createPracticeObservation(15)?.kind).toBe('off-target');
  });
  it.each([null, NaN, Infinity, -Infinity])(
    'rejects %s without inventing a band',
    (cents) => {
      expect(classifyPitchAccuracy(cents)).toBeNull();
    },
  );
});
