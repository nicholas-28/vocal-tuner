import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RawPitchDetection } from '../types/pitch';
import { usePitchDetection } from './usePitchDetection';

function detection(
  overrides: Partial<RawPitchDetection> = {},
): RawPitchDetection {
  return {
    timestampMs: 100,
    frequencyHz: 220,
    confidence: 0.96,
    rms: 0.2,
    analysisDurationMs: 1.2,
    ...overrides,
  };
}

describe('usePitchDetection', () => {
  it('publishes detected frequency and clears it for silence', () => {
    const { result } = renderHook(() => usePitchDetection());
    act(() => result.current.onDetection(detection()));
    expect(result.current.diagnostics.state).toBe('detected');
    expect(result.current.diagnostics.detection?.frequencyHz).toBe(220);

    act(() =>
      result.current.onDetection(
        detection({ timestampMs: 200, frequencyHz: null, rms: 0 }),
      ),
    );
    expect(result.current.diagnostics.state).toBe('silence');
    expect(result.current.diagnostics.detection?.frequencyHz).toBeNull();
    expect(result.current.diagnostics.cadenceHz).toBe(10);
  });

  it('distinguishes low confidence, errors, and reset', () => {
    const { result } = renderHook(() => usePitchDetection());
    act(() => result.current.onDetection(detection({ frequencyHz: null })));
    expect(result.current.diagnostics.state).toBe('low-confidence');
    act(() => result.current.onError());
    expect(result.current.diagnostics.state).toBe('error');
    act(() => result.current.reset());
    expect(result.current.diagnostics.state).toBe('inactive');
    expect(result.current.diagnostics.detection).toBeNull();
  });

  it('ignores late results after unmount', () => {
    const hook = renderHook(() => usePitchDetection());
    const onDetection = hook.result.current.onDetection;
    hook.unmount();
    expect(() => onDetection(detection())).not.toThrow();
  });
});
