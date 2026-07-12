export type MidiRange = {
  lowMidi: number;
  highMidi: number;
};

export type PitchGridViewportInput = MidiRange & {
  widthCssPx: number;
  heightCssPx: number;
  devicePixelRatio: number;
  labelGutterCssPx: number;
  rightPaddingCssPx: number;
  topPaddingCssPx: number;
  bottomPaddingCssPx: number;
  presentTimeXRatio: number;
};

export type PitchGridViewport = PitchGridViewportInput & {
  backingWidthPx: number;
  backingHeightPx: number;
  graphLeftX: number;
  graphRightX: number;
  graphTopY: number;
  graphBottomY: number;
  graphWidth: number;
  graphHeight: number;
  visibleNoteCount: number;
  semitoneHeight: number;
  presentTimeX: number;
};

export type PitchGridLineStyle = {
  color: string;
  widthCssPx: number;
  labelColor: string;
  labelFont: string;
};

export type PitchGridStyle = {
  backgroundColor: string;
  accidentalBandColor: string;
  octave: PitchGridLineStyle;
  natural: PitchGridLineStyle;
  accidental: PitchGridLineStyle;
  gutterSeparatorColor: string;
  gutterSeparatorWidthCssPx: number;
  markerColor: string;
  markerWidthCssPx: number;
  labelInsetCssPx: number;
};
