import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEY,
  PAD_ENVELOPE,
  PAD_GAIN_BUDGET,
  PAD_RESPONSE_POLICY,
  PAD_TUNING,
} from './padConfig';

describe('pad configuration', () => {
  it('keeps the component gains within the total peak budget', () => {
    expect(
      PAD_GAIN_BUDGET.chordBody + PAD_GAIN_BUDGET.shimmer,
    ).toBeLessThanOrEqual(PAD_GAIN_BUDGET.totalPeak);
  });

  it('uses finite positive durations and time constants', () => {
    const durations = [
      PAD_TUNING.shimmerQuietTimeConstantMs,
      PAD_TUNING.harmonyTimeConstantMs,
      PAD_TUNING.pitchClassDwellMs,
      PAD_TUNING.octaveConfirmMs,
      PAD_ENVELOPE.chordAttackMs,
      PAD_ENVELOPE.chordCrossfadeMs,
      PAD_ENVELOPE.chordReleaseMs,
      PAD_ENVELOPE.shimmerAttackMs,
      PAD_ENVELOPE.shimmerReleaseMs,
      PAD_RESPONSE_POLICY.harmonyChangeBudgetMs,
      PAD_RESPONSE_POLICY.shimmerSettleBudgetMs,
    ];

    for (const duration of durations) {
      expect(Number.isFinite(duration)).toBe(true);
      expect(duration).toBeGreaterThan(0);
    }
  });

  it('uses a proper fraction for shimmer settling', () => {
    expect(PAD_RESPONSE_POLICY.shimmerSettleFraction).toBeGreaterThan(0);
    expect(PAD_RESPONSE_POLICY.shimmerSettleFraction).toBeLessThan(1);
  });

  it('defines a valid major default key', () => {
    expect(Number.isInteger(DEFAULT_KEY.tonicPitchClass)).toBe(true);
    expect(DEFAULT_KEY.tonicPitchClass).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_KEY.tonicPitchClass).toBeLessThanOrEqual(11);
    expect(DEFAULT_KEY.mode).toBe('major');
  });
});
