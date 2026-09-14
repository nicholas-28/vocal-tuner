import { smoothVisualCents } from '../tuner/visualResponse';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import type { TargetCentsDisplayState } from '../types/targetPitch';
import { TARGET_DISPLAY_TIME_CONSTANT_MS } from './targetPitchConfig';

export type TargetCentsDisplayInput = {
  detectedMidi?: number | null;
  targetRelativeCents: number | null;
  targetMidi: number | null;
  timestampMs: number | null;
  continuityStatus: PitchContinuityStatus;
  reducedMotion: boolean;
};

export function transitionTargetCentsDisplay(
  current: TargetCentsDisplayState,
  input: TargetCentsDisplayInput,
  timeConstantMs = TARGET_DISPLAY_TIME_CONSTANT_MS,
): TargetCentsDisplayState {
  if (input.continuityStatus === 'unvoiced') return null;
  if (!isValidInput(input)) return current;
  const targetRelativeCents = input.targetRelativeCents as number;
  const targetMidi = input.targetMidi as number;
  const timestampMs = input.timestampMs as number;
  if (
    current === null ||
    current.targetMidi !== targetMidi ||
    current.detectedMidi !== input.detectedMidi ||
    input.reducedMotion
  )
    return {
      displayCents: targetRelativeCents,
      targetMidi,
      timestampMs,
      ...(input.detectedMidi === undefined
        ? {}
        : { detectedMidi: input.detectedMidi }),
    };
  if (input.continuityStatus === 'uncertain') return current;
  const deltaTimeMs = timestampMs - current.timestampMs;
  const validTimeConstant =
    Number.isFinite(timeConstantMs) && timeConstantMs > 0
      ? timeConstantMs
      : TARGET_DISPLAY_TIME_CONSTANT_MS;
  if (!Number.isFinite(deltaTimeMs) || deltaTimeMs <= 0) return current;
  const displayCents = smoothVisualCents(
    current.displayCents,
    targetRelativeCents,
    deltaTimeMs,
    validTimeConstant,
  );
  return Number.isFinite(displayCents)
    ? { ...current, displayCents, targetMidi, timestampMs }
    : current;
}

function isValidInput(input: TargetCentsDisplayInput): boolean {
  return (
    input.targetRelativeCents !== null &&
    Number.isFinite(input.targetRelativeCents) &&
    input.targetMidi !== null &&
    Number.isInteger(input.targetMidi) &&
    input.timestampMs !== null &&
    Number.isFinite(input.timestampMs) &&
    input.timestampMs >= 0
  );
}
