import { useMemo } from 'react';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import { DEFAULT_TUNING_A4_HZ } from '../music/tuning';
import type { RawPitchDetection } from '../types/pitch';

export function useMusicalPitch(
  acceptedFrequencyHz: number | null,
  tuningA4Hz = DEFAULT_TUNING_A4_HZ,
) {
  return useMemo(
    () => frequencyToMusicalPitch(acceptedFrequencyHz, tuningA4Hz),
    [acceptedFrequencyHz, tuningA4Hz],
  );
}

export function acceptedDetectionToMusicalPitch(
  detection: RawPitchDetection | null,
  tuningA4Hz = DEFAULT_TUNING_A4_HZ,
) {
  return frequencyToMusicalPitch(
    detection?.rejectionReason === 'detected' ? detection.frequencyHz : null,
    tuningA4Hz,
  );
}

export function useMusicalPitchFromDetection(
  detection: RawPitchDetection | null,
  tuningA4Hz = DEFAULT_TUNING_A4_HZ,
) {
  return useMemo(
    () => acceptedDetectionToMusicalPitch(detection, tuningA4Hz),
    [detection, tuningA4Hz],
  );
}
