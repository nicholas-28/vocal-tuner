import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import { usePitchHistory } from './usePitchHistory';

describe('usePitchHistory', () => {
  it('defers a short uncertainty and inserts exactly one confirmed gap', () => {
    const { result } = renderHook(() => usePitchHistory());
    act(() => result.current.startSession());
    const pitch = (timestampMs: number, gapBeforeTimestampMs: number | null) =>
      result.current.onContinuityDecision({
        kind: 'pitch',
        source: 'raw',
        detection: createPitchDetection({ timestampMs }),
        gapBeforeTimestampMs,
        gapReason: gapBeforeTimestampMs === null ? null : 'continuity-timeout',
      });
    act(() => pitch(100, null));
    act(() =>
      result.current.onContinuityDecision({
        kind: 'hold',
        reason: 'low-confidence',
        durationMs: 0,
      }),
    );
    act(() => pitch(240, null));
    expect(result.current.history.points.map((point) => point.kind)).toEqual([
      'pitch',
      'pitch',
    ]);
    act(() => pitch(500, 300));
    expect(result.current.history.points.map((point) => point.kind)).toEqual([
      'pitch',
      'pitch',
      'gap',
      'pitch',
    ]);
  });

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

  it('pauses ingestion, rebases resume time, and inserts one gap boundary', () => {
    let sourceNowMs = 1000;
    const { result } = renderHook(() =>
      usePitchHistory(15_000, () => sourceNowMs),
    );
    act(() => result.current.startSession());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 900 })),
    );
    act(() => result.current.pause());
    expect(result.current.captureState.status).toBe('paused');

    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 3000 })),
    );
    act(() =>
      result.current.onDetection(
        createPitchDetection({
          timestampMs: 4000,
          frequencyHz: null,
          rejectionReason: 'silence',
        }),
      ),
    );
    expect(result.current.history.points).toHaveLength(1);

    sourceNowMs = 6000;
    act(() => result.current.resume());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 6100 })),
    );
    expect(result.current.captureState.status).toBe('recording');
    expect(result.current.history.points.map((point) => point.kind)).toEqual([
      'pitch',
      'gap',
      'pitch',
    ]);
    expect(
      result.current.history.points.map((point) => point.timestampMs),
    ).toEqual([900, 1000, 1100]);
    expect(result.current.summary.retainedDurationMs).toBe(200);
  });

  it('keeps Clear paused and resumes fresh without a stale boundary', () => {
    let sourceNowMs = 1000;
    const { result } = renderHook(() =>
      usePitchHistory(15_000, () => sourceNowMs),
    );
    act(() => result.current.startSession());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 900 })),
    );
    act(() => result.current.pause());
    act(() => result.current.clear());
    expect(result.current.captureState.status).toBe('paused');
    expect(result.current.history.points).toEqual([]);

    sourceNowMs = 3000;
    act(() => result.current.resume());
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 3100 })),
    );
    expect(result.current.history.points).toHaveLength(1);
    expect(result.current.history.points[0]).toMatchObject({
      kind: 'pitch',
      timestampMs: 1100,
    });
  });

  it('resets pause bookkeeping on Stop and starts the next session recording', () => {
    let sourceNowMs = 1000;
    const { result } = renderHook(() =>
      usePitchHistory(15_000, () => sourceNowMs),
    );
    act(() => result.current.startSession());
    const firstSessionVersion = result.current.sessionVersion;
    act(() => result.current.pause());
    act(() => result.current.stopSession());
    expect(result.current.captureState).toMatchObject({
      status: 'recording',
      accumulatedPausedDurationMs: 0,
    });
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 2000 })),
    );
    expect(result.current.history.points).toEqual([]);

    sourceNowMs = 50;
    act(() => result.current.startSession());
    expect(result.current.sessionVersion).toBe(firstSessionVersion + 1);
    act(() =>
      result.current.onDetection(createPitchDetection({ timestampMs: 60 })),
    );
    expect(result.current.history.points[0].timestampMs).toBe(60);
  });
});
