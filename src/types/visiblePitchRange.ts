export type VisiblePitchRange = Readonly<{
  lowMidi: number;
  highMidi: number;
}>;

export type VisiblePitchRangePresetId = 'low' | 'middle' | 'high';

export type VisiblePitchRangePreset = Readonly<{
  id: VisiblePitchRangePresetId;
  range: VisiblePitchRange;
}>;

export type PitchRangePosition = 'below' | 'inside' | 'above';
