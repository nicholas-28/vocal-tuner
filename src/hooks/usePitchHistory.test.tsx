import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import { usePitchHistory } from './usePitchHistory';

describe('usePitchHistory', () => {
  it('records accepted pitch and sparse rejected gaps only during a session', () => {
    const { result } = renderHook(() => usePitchHistory());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 10 })),
    );
    expect(result.current.summary.totalPoints).toBe(0);

    act(() => result.current.startSession());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 100 })),
    );
    act(() =>
      result.current.onDetection(
        createPitchDetection({
          timestampMs: 200,
          frequencyHz: null,
          rejectionReason: 'silence',
        }),
      ),
    );
    act(() =>
      result.current.onDetection(
        createPitchDetection({
          timestampMs: 300,
          frequencyHz: null,
          rawCandidateFrequencyHz: 220,
          rejectionReason: 'low-confidence',
        }),
      ),
    );
    expect(result.current.history.points.map((point) => point.kind)).toEqual([
      'pitch',
      'gap',
    ]);
  });

  it.each([
    'silence',
    'low-confidence',
    'no-candidate',
    'out-of-range',
    'detector-error',
  ] as const)(
    'records %s as a gap rather than a raw pitch',
    (rejectionReason) => {
      const { result } = renderHook(() => usePitchHistory());
      act(() => result.current.startSession());
      act(() =>
        result.current.onDetection(
          createPitchDetection({
            timestampMs: 100,
            frequencyHz: null,
            rawCandidateFrequencyHz: 440,
            rejectionReason,
          }),
        ),
      );
      expect(result.current.history.points).toEqual([
        {
          timestampMs: 100,
          midi: null,
          frequencyHz: null,
          confidence: 0,
          kind: 'gap',
        },
      ]);
    },
  );

  it('freezes on stop and starts the next session empty', () => {
    const { result } = renderHook(() => usePitchHistory());
    act(() => result.current.startSession());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 100 })),
    );
    act(() => result.current.stopSession());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 200 })),
    );
    expect(result.current.summary.totalPoints).toBe(1);

    act(() => result.current.startSession());
    expect(result.current.summary.totalPoints).toBe(0);
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 10 })),
    );
    expect(result.current.history.points[0].timestampMs).toBe(10);
  });

  it('clears while active without affecting the current detector value', () => {
    const currentDetection = createPitchDetection({ timestampMs: 100 });
    const { result } = renderHook(() => usePitchHistory());
    act(() => result.current.startSession());
    act(() => result.current.onDetection(currentDetection));
    act(() => result.current.clear());
    expect(result.current.summary.totalPoints).toBe(0);
    expect(currentDetection.frequencyHz).toBe(220);

    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 200 })),
    );
    expect(result.current.summary.pitchPoints).toBe(1);
  });

  it('ignores late updates after unmount and owns no external resources', () => {
    const hook = renderHook(() => usePitchHistory());
    act(() => hook.result.current.startSession());
    const onDetection = hook.result.current.onDetection;
    hook.unmount();
    expect(() => onDetection(createPitchDetection())).not.toThrow();
  });
});
