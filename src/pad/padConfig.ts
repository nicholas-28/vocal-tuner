import type {
  Key,
  PadEnvelope,
  PadGainBudget,
  PadResponsePolicy,
  PadTuning,
} from './types';

/**
 * Provisional P1-a interaction parameters for testing the causality hypothesis.
 * These are neither canonical Vocal Tuner constants nor scientific or
 * evidence-base claims. Human testing is expected to change them.
 */

export const DEFAULT_KEY: Key = Object.freeze({
  tonicPitchClass: 0,
  mode: 'major',
});

export const DEFAULT_VOICING_FLOOR_CENTS = 4800;

export const PAD_TUNING: PadTuning = Object.freeze({
  shimmerQuietTimeConstantMs: 65,
  harmonyTimeConstantMs: 120,
  pitchClassHysteresisCents: 20,
  pitchClassDwellMs: 120,
  octaveFoldToleranceCents: 60,
  octaveConfirmMs: 250,
});

/**
 * Harmony smoothing will use a plain first-order exponential. It must not use
 * smoothVisualCents, whose fast branch is appropriate only for the shimmer
 * path and intentionally snaps outside its roughly three-cent quiet region.
 */

/** Chosen P1-a policy; the total is not derived from the reference drone. */
export const PAD_GAIN_BUDGET: PadGainBudget = Object.freeze({
  totalPeak: 0.16,
  chordBody: 0.12,
  shimmer: 0.04,
});

export const PAD_ENVELOPE: PadEnvelope = Object.freeze({
  chordAttackMs: 90,
  chordCrossfadeMs: 120,
  chordReleaseMs: 1500,
  shimmerAttackMs: 40,
  shimmerReleaseMs: 300,
});

export const PAD_RESPONSE_POLICY: PadResponsePolicy = Object.freeze({
  harmonyChangeBudgetMs: 400,
  referenceLeapCents: 400,
  shimmerSettleFraction: 0.9,
  shimmerSettleBudgetMs: 100,
});

/**
 * Deferred mechanics: amplitude/RMS response, non-pitched breath/noise
 * response, chord thinning, chromatic colour tone, bass, Home, Return,
 * settled spans, logging, scoring, and progression.
 */
