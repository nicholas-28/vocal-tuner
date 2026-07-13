import type { MidiRange, PitchGridStyle } from '../types/pitchGrid';
import { DEFAULT_VISIBLE_PITCH_RANGE } from './visiblePitchRange';

export const DEFAULT_PITCH_GRID_RANGE: Readonly<MidiRange> =
  DEFAULT_VISIBLE_PITCH_RANGE;

export const DEFAULT_PRESENT_TIME_X_RATIO = 0.8;
export const MAX_DEVICE_PIXEL_RATIO = 3;
export const ALL_LABELS_MIN_SEMITONE_HEIGHT_CSS_PX = 12;

export const DEFAULT_PITCH_GRID_LAYOUT = {
  labelGutterCssPx: 0,
  rightPaddingCssPx: 8,
  topPaddingCssPx: 8,
  bottomPaddingCssPx: 8,
} as const;

export const DEFAULT_PITCH_GRID_STYLE: Readonly<PitchGridStyle> = {
  backgroundColor: '#10141a',
  accidentalBandColor: '#0d1117',
  octave: {
    color: '#596574',
    widthCssPx: 1.5,
    labelColor: '#c2cbd6',
    labelFont: '600 11px Inter, ui-sans-serif, sans-serif',
  },
  natural: {
    color: '#343d49',
    widthCssPx: 1,
    labelColor: '#8f9aa8',
    labelFont: '500 10px Inter, ui-sans-serif, sans-serif',
  },
  accidental: {
    color: '#242b35',
    widthCssPx: 1,
    labelColor: '#687483',
    labelFont: '400 10px Inter, ui-sans-serif, sans-serif',
  },
  gutterSeparatorColor: '#343d49',
  gutterSeparatorWidthCssPx: 1,
  markerColor: '#738191',
  markerWidthCssPx: 1,
  labelInsetCssPx: 7,
};
