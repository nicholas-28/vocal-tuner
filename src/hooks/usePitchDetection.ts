import { useCallback, useEffect, useRef, useState } from 'react';
import { pitchDetectorConfig } from '../audio/pitchDetector';
import type { PitchDiagnostics, RawPitchDetection } from '../types/pitch';

const initialDiagnostics: PitchDiagnostics = {
  state: 'inactive',
  detection: null,
  cadenceHz: null,
};

export function usePitchDetection() {
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  const previousTimestampRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const onDetection = useCallback((detection: RawPitchDetection) => {
    if (!mountedRef.current) return;
    const previousTimestamp = previousTimestampRef.current;
    previousTimestampRef.current = detection.timestampMs;
    const cadenceHz =
      previousTimestamp === null || detection.timestampMs <= previousTimestamp
        ? null
        : 1000 / (detection.timestampMs - previousTimestamp);
    const state =
      detection.rms < pitchDetectorConfig.minimumRms
        ? 'silence'
        : detection.frequencyHz === null
          ? 'low-confidence'
          : 'detected';
    setDiagnostics({ state, detection, cadenceHz });
  }, []);

  const onError = useCallback(() => {
    if (mountedRef.current)
      setDiagnostics({ ...initialDiagnostics, state: 'error' });
  }, []);

  const reset = useCallback(() => {
    previousTimestampRef.current = null;
    if (mountedRef.current) setDiagnostics(initialDiagnostics);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { diagnostics, onDetection, onError, reset };
}
