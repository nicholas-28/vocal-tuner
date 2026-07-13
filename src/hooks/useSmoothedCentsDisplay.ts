import { useEffect, useState } from 'react';
import { DEFAULT_CENTS_DISPLAY_CONFIG } from '../tuner/centsDisplayConfig';
import { transitionCentsDisplay } from '../tuner/centsDisplaySmoothing';
import type {
  CentsDisplayConfig,
  CentsDisplayInput,
  CentsDisplayState,
} from '../types/centsMeter';

export function useSmoothedCentsDisplay(
  input: CentsDisplayInput,
  config?: CentsDisplayConfig,
) {
  const [state, setState] = useState<CentsDisplayState>(null);
  const { continuityStatus, noteMidi, rawCents, reducedMotion, timestampMs } =
    input;

  useEffect(() => {
    setState((current) =>
      transitionCentsDisplay(
        current,
        {
          continuityStatus,
          noteMidi,
          rawCents,
          reducedMotion,
          timestampMs,
        },
        config ?? DEFAULT_CENTS_DISPLAY_CONFIG,
      ),
    );
  }, [
    config,
    continuityStatus,
    noteMidi,
    rawCents,
    reducedMotion,
    timestampMs,
  ]);

  return state?.displayCents ?? null;
}
