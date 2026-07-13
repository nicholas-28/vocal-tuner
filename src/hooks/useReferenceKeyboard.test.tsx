import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReferenceKeyboard } from './useReferenceKeyboard';

describe('useReferenceKeyboard', () => {
  it('maintains transient press, persistent selection, and one pointer owner', () => {
    const { result } = renderHook(() =>
      useReferenceKeyboard({ lowMidi: 48, highMidi: 72 }),
    );
    expect(result.current.state).toEqual({
      pressedMidi: null,
      selectedMidi: null,
      focusedMidi: 60,
    });

    act(() => expect(result.current.beginPointerPress(60, 1)).toBe(true));
    expect(result.current.state).toMatchObject({
      pressedMidi: 60,
      selectedMidi: null,
    });
    act(() => expect(result.current.beginPointerPress(61, 2)).toBe(false));
    act(() => expect(result.current.endPointerPress(2)).toBe(false));
    expect(result.current.state.pressedMidi).toBe(60);
    act(() => expect(result.current.endPointerPress(1)).toBe(true));
    act(() => result.current.selectMidi(60));
    expect(result.current.state).toMatchObject({
      pressedMidi: null,
      selectedMidi: 60,
    });
  });

  it('clears transient interaction, preserves selection, and clamps focus', () => {
    const { result, rerender } = renderHook(
      ({ lowMidi, highMidi }) => useReferenceKeyboard({ lowMidi, highMidi }),
      { initialProps: { lowMidi: 48, highMidi: 72 } },
    );
    act(() => {
      result.current.beginKeyboardPress(72);
      result.current.selectMidi(72);
    });
    expect(result.current.state.pressedMidi).toBe(72);
    rerender({ lowMidi: 36, highMidi: 60 });
    expect(result.current.state).toEqual({
      pressedMidi: null,
      selectedMidi: 72,
      focusedMidi: 60,
    });
  });
});
