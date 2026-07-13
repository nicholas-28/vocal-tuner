import type { PitchContinuityStatus } from './pitchContinuity';

export type CentsClassification = 'flat' | 'in-tune' | 'sharp';

export type CentsDisplayConfig = {
  timeConstantMs: number;
  inTuneToleranceCents: number;
};

export type CentsDisplayInput = {
  rawCents: number | null;
  noteMidi: number | null;
  timestampMs: number | null;
  continuityStatus: PitchContinuityStatus;
  reducedMotion: boolean;
};

export type CentsDisplayState = Readonly<{
  displayCents: number;
  noteMidi: number;
  timestampMs: number;
}> | null;
