import { useEffect, useState } from 'react';
import {
  transitionTargetCentsDisplay,
  type TargetCentsDisplayInput,
} from '../target/targetCentsSmoothing';
import type { TargetCentsDisplayState } from '../types/targetPitch';

export function useTargetCentsDisplay(input: TargetCentsDisplayInput) {
  const [state, setState] = useState<TargetCentsDisplayState>(null);
  const {
    continuityStatus,
    reducedMotion,
    targetMidi,
    targetRelativeCents,
    timestampMs,
  } = input;
  useEffect(() => {
    setState((current) =>
      transitionTargetCentsDisplay(current, {
        continuityStatus,
        reducedMotion,
        targetMidi,
        targetRelativeCents,
        timestampMs,
      }),
    );
  }, [
    continuityStatus,
    reducedMotion,
    targetMidi,
    targetRelativeCents,
    timestampMs,
  ]);
  return state?.displayCents ?? null;
}
