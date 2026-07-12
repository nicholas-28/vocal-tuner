export type RawPitchDetection = {
  timestampMs: number;
  frequencyHz: number | null;
  confidence: number;
  rms: number;
  analysisDurationMs: number;
};

export type PitchAnalysisState =
  | 'inactive'
  | 'listening'
  | 'silence'
  | 'low-confidence'
  | 'detected'
  | 'error';

export type PitchDiagnostics = {
  state: PitchAnalysisState;
  detection: RawPitchDetection | null;
  cadenceHz: number | null;
};
