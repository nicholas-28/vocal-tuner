import type { MusicalPitch } from './musicalPitch';

export type TargetNote = {
  midiNote: number;
  label: string;
  frequencyHz: number;
};

export type TargetPitchDirection = 'below' | 'on-target' | 'above';

export type TargetDistanceBand =
  'on-target' | 'close' | 'far' | 'different-note';

export type TargetOffScaleDirection = 'left' | 'right' | null;

export type TargetPitchMeasurement = {
  detectedPitch: MusicalPitch;
  targetRelativeCents: number;
  direction: TargetPitchDirection;
  distanceBand: TargetDistanceBand;
  withinTargetNeighborhood: boolean;
  meterPercent: number;
  offScaleDirection: TargetOffScaleDirection;
};

export type TargetPitchComparison =
  | { status: 'inactive'; target: null }
  | { status: 'no-pitch'; target: TargetNote }
  | {
      status: 'uncertain';
      target: TargetNote;
      lastMeasured: TargetPitchMeasurement;
    }
  | {
      status: 'measured';
      target: TargetNote;
      measurement: TargetPitchMeasurement;
    };

export type TargetCentsDisplayState = Readonly<{
  displayCents: number;
  targetMidi: number;
  timestampMs: number;
}> | null;
