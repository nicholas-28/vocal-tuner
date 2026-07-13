import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useVisiblePitchRange } from './useVisiblePitchRange';

describe('useVisiblePitchRange', () => {
  it('selects presets, shifts, resets, and preserves duplicate identity', () => {
    const { result } = renderHook(() => useVisiblePitchRange());
    expect(result.current.range).toEqual({ lowMidi: 48, highMidi: 72 });
    expect(result.current.selectedPresetId).toBe('middle');
    const initial = result.current.range;
    act(() => result.current.selectPreset('middle'));
    expect(result.current.range).toBe(initial);

    act(() => result.current.shiftDownOctave());
    expect(result.current.range).toEqual({ lowMidi: 36, highMidi: 60 });
    expect(result.current.selectedPresetId).toBe('low');
    expect(result.current.canShiftDown).toBe(false);
    act(() => result.current.shiftDownOctave());
    expect(result.current.range).toEqual({ lowMidi: 36, highMidi: 60 });

    act(() => result.current.shiftUpOctave());
    act(() => result.current.shiftUpOctave());
    expect(result.current.range).toEqual({ lowMidi: 60, highMidi: 84 });
    expect(result.current.canShiftUp).toBe(false);
    act(() => result.current.reset());
    expect(result.current.range).toEqual({ lowMidi: 48, highMidi: 72 });
  });

  it('supports a valid custom range and falls back from invalid initial state', () => {
    const custom = renderHook(() =>
      useVisiblePitchRange({ lowMidi: 37, highMidi: 61 }),
    );
    expect(custom.result.current.selectedPresetId).toBeNull();
    const invalid = renderHook(() =>
      useVisiblePitchRange({ lowMidi: 90, highMidi: 114 }),
    );
    expect(invalid.result.current.range).toEqual({ lowMidi: 48, highMidi: 72 });
  });
});
