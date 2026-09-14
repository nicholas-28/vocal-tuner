import { useEffect, useState } from 'react';
import {
  transitionTargetCentsDisplay,
  type TargetCentsDisplayInput,
} from '../target/targetCentsSmoothing';
import type { TargetCentsDisplayState } from '../types/targetPitch';

export function useTargetCentsDisplay(input: TargetCentsDisplayInput) {
  const [state, setState] = useState<TargetCentsDisplayState>(null);
  const {
    detectedMidi,
    continuityStatus,
    reducedMotion,
    targetMidi,
    targetRelativeCents,
    timestampMs,
  } = input;
  useEffect(() => {
    setState((current) =>
      transitionTargetCentsDisplay(current, {
        detectedMidi,
        continuityStatus,
        reducedMotion,
        targetMidi,
        targetRelativeCents,
        timestampMs,
      }),
    );
  }, [
    detectedMidi,
    continuityStatus,
    reducedMotion,
    targetMidi,
    targetRelativeCents,
    timestampMs,
  ]);
  return state?.displayCents ?? null;
}
