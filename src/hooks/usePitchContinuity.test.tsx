import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import { usePitchContinuity } from './usePitchContinuity';

describe('usePitchContinuity', () => {
  it('publishes transitions synchronously and resets session state and counters', () => {
    const { result } = renderHook(() => usePitchContinuity());
    act(() => {
      result.current.onDetection(createPitchDetection({ timestampMs: 100 }));
    });
    expect(result.current.state.status).toBe('voiced');
    act(() => result.current.reset());
    expect(result.current.state.status).toBe('unvoiced');
    expect(result.current.state.statistics.totalDetectorPublications).toBe(0);
  });

  it('safely ignores React publication after unmount', () => {
    const hook = renderHook(() => usePitchContinuity());
    const onDetection = hook.result.current.onDetection;
    hook.unmount();
    expect(() => onDetection(createPitchDetection())).not.toThrow();
  });
});
