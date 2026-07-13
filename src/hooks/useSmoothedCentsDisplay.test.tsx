import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CentsDisplayInput } from '../types/centsMeter';
import { useSmoothedCentsDisplay } from './useSmoothedCentsDisplay';

const input = (rawCents: number, timestampMs: number): CentsDisplayInput => ({
  rawCents,
  noteMidi: 69,
  timestampMs,
  continuityStatus: 'voiced',
  reducedMotion: false,
});

describe('useSmoothedCentsDisplay', () => {
  it('updates, freezes during uncertainty, and resets for no pitch', () => {
    const hook = renderHook(({ value }) => useSmoothedCentsDisplay(value), {
      initialProps: { value: input(10, 100) },
    });
    expect(hook.result.current).toBe(10);
    act(() =>
      hook.rerender({
        value: { ...input(-30, 167), continuityStatus: 'uncertain' },
      }),
    );
    expect(hook.result.current).toBe(10);
    act(() =>
      hook.rerender({
        value: {
          rawCents: null,
          noteMidi: null,
          timestampMs: 300,
          continuityStatus: 'unvoiced',
          reducedMotion: false,
        },
      }),
    );
    expect(hook.result.current).toBeNull();
  });
});
