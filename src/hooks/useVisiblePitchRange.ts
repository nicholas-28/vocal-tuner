import { useCallback, useMemo, useState } from 'react';
import type {
  VisiblePitchRange,
  VisiblePitchRangePresetId,
} from '../types/visiblePitchRange';
import {
  OCTAVE_SEMITONES,
  areVisiblePitchRangesEqual,
  canShiftVisiblePitchRange,
  createDefaultVisiblePitchRange,
  getVisiblePitchRangePresetId,
  isValidVisiblePitchRange,
  resolveVisiblePitchRangePreset,
  shiftVisiblePitchRange,
} from '../visualization/visiblePitchRange';

export function useVisiblePitchRange(
  initialRange: VisiblePitchRange = createDefaultVisiblePitchRange(),
) {
  const [range, setRange] = useState<VisiblePitchRange>(() =>
    isValidVisiblePitchRange(initialRange)
      ? initialRange
      : createDefaultVisiblePitchRange(),
  );

  const selectPreset = useCallback((id: VisiblePitchRangePresetId) => {
    const preset = resolveVisiblePitchRangePreset(id);
    if (!preset) return;
    setRange((current) =>
      areVisiblePitchRangesEqual(current, preset) ? current : preset,
    );
  }, []);

  const shiftByOctaves = useCallback((octaves: number) => {
    if (!Number.isInteger(octaves)) return;
    setRange(
      (current) =>
        shiftVisiblePitchRange(current, octaves * OCTAVE_SEMITONES) ?? current,
    );
  }, []);

  const reset = useCallback(() => {
    setRange((current) => {
      const defaultRange = createDefaultVisiblePitchRange();
      return areVisiblePitchRangesEqual(current, defaultRange)
        ? current
        : defaultRange;
    });
  }, []);

  const selectedPresetId = useMemo(
    () => getVisiblePitchRangePresetId(range),
    [range],
  );

  const shiftDownOctave = useCallback(
    () => shiftByOctaves(-1),
    [shiftByOctaves],
  );
  const shiftUpOctave = useCallback(() => shiftByOctaves(1), [shiftByOctaves]);

  return {
    range,
    selectedPresetId,
    canShiftDown: canShiftVisiblePitchRange(range, -OCTAVE_SEMITONES),
    canShiftUp: canShiftVisiblePitchRange(range, OCTAVE_SEMITONES),
    selectPreset,
    shiftDownOctave,
    shiftUpOctave,
    reset,
  };
}
