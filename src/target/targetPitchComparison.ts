import { createReferenceKey } from '../reference/referenceKeyboard';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import type {
  TargetDistanceBand,
  TargetNote,
  TargetOffScaleDirection,
  TargetPitchComparison,
  TargetPitchDirection,
  TargetPitchMeasurement,
} from '../types/targetPitch';
import {
  TARGET_CLOSE_LIMIT_CENTS,
  TARGET_DIFFERENT_NOTE_CENTS,
  TARGET_METER_LIMIT_CENTS,
  TARGET_NEIGHBORHOOD_LIMIT_CENTS,
  TARGET_TOLERANCE_CENTS,
} from './targetPitchConfig';

export function createTargetNote(midiNote: number): TargetNote | null {
  const key = createReferenceKey(midiNote);
  return key
    ? {
        midiNote: key.midiNote,
        label: key.label,
        frequencyHz: key.idealFrequencyHz,
      }
    : null;
}

export function calculateTargetRelativeCents(
  detectedFractionalMidi: number,
  targetMidi: number,
): number | null {
  if (!Number.isFinite(detectedFractionalMidi) || !Number.isInteger(targetMidi))
    return null;
  const cents = (detectedFractionalMidi - targetMidi) * 100;
  return Number.isFinite(cents) ? cents : null;
}

export function classifyTargetDirection(
  targetRelativeCents: number,
): TargetPitchDirection | null {
  if (!Number.isFinite(targetRelativeCents)) return null;
  if (targetRelativeCents < -TARGET_TOLERANCE_CENTS) return 'below';
  if (targetRelativeCents > TARGET_TOLERANCE_CENTS) return 'above';
  return 'on-target';
}

export function classifyTargetDistance(
  targetRelativeCents: number,
): TargetDistanceBand | null {
  if (!Number.isFinite(targetRelativeCents)) return null;
  const distance = Math.abs(targetRelativeCents);
  if (distance <= TARGET_TOLERANCE_CENTS) return 'on-target';
  if (distance <= TARGET_CLOSE_LIMIT_CENTS) return 'close';
  if (distance < TARGET_DIFFERENT_NOTE_CENTS) return 'far';
  return 'different-note';
}

export function mapTargetCentsToMeter(targetRelativeCents: number): {
  meterPercent: number;
  offScaleDirection: TargetOffScaleDirection;
} | null {
  if (!Number.isFinite(targetRelativeCents)) return null;
  const clamped = Math.min(
    TARGET_METER_LIMIT_CENTS,
    Math.max(-TARGET_METER_LIMIT_CENTS, targetRelativeCents),
  );
  return {
    meterPercent:
      ((clamped + TARGET_METER_LIMIT_CENTS) / (TARGET_METER_LIMIT_CENTS * 2)) *
      100,
    offScaleDirection:
      targetRelativeCents < -TARGET_METER_LIMIT_CENTS
        ? 'left'
        : targetRelativeCents > TARGET_METER_LIMIT_CENTS
          ? 'right'
          : null,
  };
}

export function comparePitchToTarget(
  selectedMidi: number | null,
  detectedPitch: MusicalPitch | null,
  continuityStatus: PitchContinuityStatus,
): TargetPitchComparison {
  const target = selectedMidi === null ? null : createTargetNote(selectedMidi);
  if (!target) return { status: 'inactive', target: null };
  if (continuityStatus === 'unvoiced' || !detectedPitch)
    return { status: 'no-pitch', target };

  const targetRelativeCents = calculateTargetRelativeCents(
    detectedPitch.fractionalMidi,
    target.midiNote,
  );
  const direction =
    targetRelativeCents === null
      ? null
      : classifyTargetDirection(targetRelativeCents);
  const distanceBand =
    targetRelativeCents === null
      ? null
      : classifyTargetDistance(targetRelativeCents);
  const meter =
    targetRelativeCents === null
      ? null
      : mapTargetCentsToMeter(targetRelativeCents);
  if (
    targetRelativeCents === null ||
    direction === null ||
    distanceBand === null ||
    meter === null
  )
    return { status: 'no-pitch', target };

  const measurement: TargetPitchMeasurement = {
    detectedPitch,
    targetRelativeCents,
    direction,
    distanceBand,
    withinTargetNeighborhood:
      Math.abs(targetRelativeCents) < TARGET_NEIGHBORHOOD_LIMIT_CENTS,
    ...meter,
  };
  return continuityStatus === 'uncertain'
    ? { status: 'uncertain', target, lastMeasured: measurement }
    : { status: 'measured', target, measurement };
}
