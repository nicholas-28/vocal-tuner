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
});
