import type {
  PitchRangePosition,
  VisiblePitchRange,
  VisiblePitchRangePreset,
  VisiblePitchRangePresetId,
} from '../types/visiblePitchRange';
import { getPitchGridNote } from './pitchGridNotes';

export const MINIMUM_VISIBLE_MIDI = 36;
export const MAXIMUM_VISIBLE_MIDI = 84;
export const VISIBLE_RANGE_SPAN_SEMITONES = 24;
export const OCTAVE_SEMITONES = 12;
export const DEFAULT_VISIBLE_PITCH_RANGE_PRESET_ID: VisiblePitchRangePresetId =
  'middle';

export const VISIBLE_PITCH_RANGE_PRESETS: readonly VisiblePitchRangePreset[] = [
  { id: 'low', range: { lowMidi: 36, highMidi: 60 } },
  { id: 'middle', range: { lowMidi: 48, highMidi: 72 } },
  { id: 'high', range: { lowMidi: 60, highMidi: 84 } },
];

export const DEFAULT_VISIBLE_PITCH_RANGE: VisiblePitchRange =
  VISIBLE_PITCH_RANGE_PRESETS.find(
    ({ id }) => id === DEFAULT_VISIBLE_PITCH_RANGE_PRESET_ID,
  )!.range;

export function isValidVisiblePitchRange(
  value: unknown,
): value is VisiblePitchRange {
  if (typeof value !== 'object' || value === null) return false;
  const range = value as VisiblePitchRange;
  return (
    Number.isFinite(range.lowMidi) &&
    Number.isFinite(range.highMidi) &&
    Number.isInteger(range.lowMidi) &&
    Number.isInteger(range.highMidi) &&
    range.lowMidi >= MINIMUM_VISIBLE_MIDI &&
    range.highMidi <= MAXIMUM_VISIBLE_MIDI &&
    range.highMidi - range.lowMidi === VISIBLE_RANGE_SPAN_SEMITONES
  );
}

export function createDefaultVisiblePitchRange(): VisiblePitchRange {
  return { ...DEFAULT_VISIBLE_PITCH_RANGE };
}

export function resolveVisiblePitchRangePreset(
  id: string,
): VisiblePitchRange | null {
  const preset = VISIBLE_PITCH_RANGE_PRESETS.find((item) => item.id === id);
  return preset ? { ...preset.range } : null;
}

export function getVisiblePitchRangePresetId(
  range: VisiblePitchRange,
): VisiblePitchRangePresetId | null {
  return (
    VISIBLE_PITCH_RANGE_PRESETS.find((preset) =>
      areVisiblePitchRangesEqual(range, preset.range),
    )?.id ?? null
  );
}

export function shiftVisiblePitchRange(
  range: VisiblePitchRange,
  semitones: number,
): VisiblePitchRange | null {
  if (!isValidVisiblePitchRange(range) || !Number.isInteger(semitones)) {
    return null;
  }
  const shifted = {
    lowMidi: range.lowMidi + semitones,
    highMidi: range.highMidi + semitones,
  };
  return isValidVisiblePitchRange(shifted) ? shifted : null;
}

export function canShiftVisiblePitchRange(
  range: VisiblePitchRange,
  semitones: number,
): boolean {
  return shiftVisiblePitchRange(range, semitones) !== null;
}

export function areVisiblePitchRangesEqual(
  first: VisiblePitchRange,
  second: VisiblePitchRange,
): boolean {
  return first.lowMidi === second.lowMidi && first.highMidi === second.highMidi;
}

export function getVisiblePitchRangeLabel(
  range: VisiblePitchRange,
): string | null {
  if (!isValidVisiblePitchRange(range)) return null;
  const low = getPitchGridNote(range.lowMidi)?.label;
  const high = getPitchGridNote(range.highMidi)?.label;
  return low && high ? `${low}–${high}` : null;
}

export function getPitchRangePosition(
  midi: number,
  range: VisiblePitchRange,
): PitchRangePosition | null {
  if (!Number.isFinite(midi) || !isValidVisiblePitchRange(range)) return null;
  if (midi < range.lowMidi) return 'below';
  if (midi > range.highMidi) return 'above';
  return 'inside';
}

export function isMidiVisibleInRange(
  midi: number,
  range: VisiblePitchRange,
): boolean {
  return getPitchRangePosition(midi, range) === 'inside';
}
