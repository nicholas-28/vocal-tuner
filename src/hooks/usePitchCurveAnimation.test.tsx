import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePitchCurveAnimation } from './usePitchCurveAnimation';

describe('usePitchCurveAnimation', () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 0;

  beforeEach(() => {
    callbacks.clear();
    nextId = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        nextId += 1;
        callbacks.set(nextId, callback);
        return nextId;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => callbacks.delete(id)),
    );
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  it('starts one active loop, uses the latest draw ref, and cancels on Stop', () => {
    const firstDraw = vi.fn();
    const hook = renderHook(
      ({ active, draw }) =>
        usePitchCurveAnimation({
          active,
          fallbackReferenceTimeMs: 900,
          draw,
        }),
      { initialProps: { active: false, draw: firstDraw } },
    );
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(firstDraw).toHaveBeenCalledWith(900);

    hook.rerender({ active: true, draw: firstDraw });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    const secondDraw = vi.fn();
    hook.rerender({ active: true, draw: secondDraw });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    act(() => callbacks.get(1)?.(1100));
    expect(secondDraw).toHaveBeenCalledWith(1100);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    hook.rerender({ active: false, draw: secondDraw });
    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(secondDraw).toHaveBeenCalledWith(1100);
  });

  it('cancels on unmount, ignores late frames, and restarts once', () => {
    const draw = vi.fn();
    const hook = renderHook(
      ({ active }) =>
        usePitchCurveAnimation({
          active,
          fallbackReferenceTimeMs: null,
          draw,
        }),
      { initialProps: { active: true } },
    );
    const lateCallback = callbacks.get(1)!;
    hook.rerender({ active: false });
    hook.rerender({ active: true });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    hook.unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    act(() => lateCallback(1500));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('freezes the newest immediate active reference before the next frame', () => {
    const draw = vi.fn();
    const hook = renderHook(
      ({ active, fallbackReferenceTimeMs }) =>
        usePitchCurveAnimation({ active, fallbackReferenceTimeMs, draw }),
      { initialProps: { active: true, fallbackReferenceTimeMs: 900 } },
    );
    vi.mocked(performance.now).mockReturnValue(1050);
    hook.rerender({ active: true, fallbackReferenceTimeMs: 1040 });
    hook.rerender({ active: false, fallbackReferenceTimeMs: 1040 });
    expect(draw).toHaveBeenLastCalledWith(1050);
  });

  it('cancels for pause, redraws frozen on resize, and resumes rebased once', () => {
    let accumulatedPauseMs = 0;
    const toReferenceTime = (sourceTimestampMs: number) =>
      sourceTimestampMs - accumulatedPauseMs;
    const firstDraw = vi.fn();
    const hook = renderHook(
      ({ active, draw }) =>
        usePitchCurveAnimation({
          active,
          fallbackReferenceTimeMs: 900,
          resetKey: 1,
          toReferenceTime,
          draw,
        }),
      { initialProps: { active: true, draw: firstDraw } },
    );
    act(() => callbacks.get(1)?.(1100));
    hook.rerender({ active: false, draw: firstDraw });
    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(firstDraw).toHaveBeenLastCalledWith(1100);

    const resizedDraw = vi.fn();
    hook.rerender({ active: false, draw: resizedDraw });
    expect(resizedDraw).toHaveBeenCalledWith(1100);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    accumulatedPauseMs = 5000;
    vi.mocked(performance.now).mockReturnValue(6100);
    hook.rerender({ active: true, draw: resizedDraw });
    expect(resizedDraw).toHaveBeenLastCalledWith(1100);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(3);
  });

  it('uses the exact pause reference between animation frames', () => {
    const draw = vi.fn();
    const hook = renderHook(
      ({ active, inactiveReferenceTimeMs }) =>
        usePitchCurveAnimation({
          active,
          fallbackReferenceTimeMs: 900,
          inactiveReferenceTimeMs,
          draw,
        }),
      {
        initialProps: {
          active: true,
          inactiveReferenceTimeMs: null as number | null,
        },
      },
    );
    act(() => callbacks.get(1)?.(1000));
    hook.rerender({ active: false, inactiveReferenceTimeMs: 1016 });
    expect(draw).toHaveBeenLastCalledWith(1016);
  });
});
