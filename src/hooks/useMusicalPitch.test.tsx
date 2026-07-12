import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import type { RawPitchDetection } from '../types/pitch';
import {
  acceptedDetectionToMusicalPitch,
  useMusicalPitchFromDetection,
} from './useMusicalPitch';

describe('musical pitch integration', () => {
  it('converts only accepted detector frequency', () => {
    const accepted = createPitchDetection({ frequencyHz: 220 });
    expect(acceptedDetectionToMusicalPitch(accepted)?.noteName).toBe('A');
    expect(acceptedDetectionToMusicalPitch(accepted)?.octave).toBe(3);

    for (const rejectionReason of [
      'silence',
      'no-candidate',
      'yin-threshold',
      'low-confidence',
      'out-of-range',
      'detector-error',
    ] as const) {
      expect(
        acceptedDetectionToMusicalPitch(
          createPitchDetection({
            frequencyHz: null,
            rawCandidateFrequencyHz: 220,
            rejectionReason,
          }),
        ),
      ).toBeNull();
    }
  });

  it('clears immediately when detection becomes null', () => {
    const { result, rerender } = renderHook(
      ({ detection }) => useMusicalPitchFromDetection(detection),
      {
        initialProps: {
          detection: createPitchDetection() as RawPitchDetection | null,
        },
      },
    );
    expect(result.current?.noteName).toBe('A');
    rerender({ detection: null });
    expect(result.current).toBeNull();
  });
});
