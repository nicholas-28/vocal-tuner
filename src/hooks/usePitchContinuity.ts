import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPitchContinuityState,
  transitionPitchContinuity,
} from '../pitch/pitchContinuity';
import { DEFAULT_PITCH_CONTINUITY_CONFIG } from '../pitch/pitchContinuityConfig';
import type { RawPitchDetection } from '../types/pitch';
import type {
  PitchContinuityConfig,
  PitchContinuityDecision,
} from '../types/pitchContinuity';

export function usePitchContinuity(
  config: PitchContinuityConfig = DEFAULT_PITCH_CONTINUITY_CONFIG,
) {
  const [state, setState] = useState(createPitchContinuityState);
  const stateRef = useRef(state);
  const mountedRef = useRef(true);

  const onDetection = useCallback(
    (detection: RawPitchDetection): PitchContinuityDecision => {
      const transition = transitionPitchContinuity(
        stateRef.current,
        detection,
        config,
      );
      stateRef.current = transition.state;
      if (mountedRef.current) setState(transition.state);
      return transition.decision;
    },
    [config],
  );

  const reset = useCallback(() => {
    const initialState = createPitchContinuityState();
    stateRef.current = initialState;
    if (mountedRef.current) setState(initialState);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { state, onDetection, reset };
}
