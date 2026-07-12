export type PitchRejectionReason =
  | 'silence'
  | 'no-candidate'
  | 'yin-threshold'
  | 'low-confidence'
  | 'invalid-frequency'
  | 'out-of-range'
  | 'detected'
  | 'detector-error';

export type PitchDetectorSettings = {
  sampleRate: number;
  fftSize: number;
  windowDurationMs: number;
  minimumFrequencyHz: number;
  maximumFrequencyHz: number;
  minimumRms: number;
  yinThreshold: number;
  minimumConfidence: number;
};

export type RawPitchDetection = {
  timestampMs: number;
  frequencyHz: number | null;
  confidence: number;
  rms: number;
  signalPassed: boolean;
  selectedLag: number | null;
  rawCandidateFrequencyHz: number | null;
  minimumYinValue: number | null;
  selectedYinValue: number | null;
  rawConfidence: number;
  rejectionReason: PitchRejectionReason;
  analysisDurationMs: number;
  settings: PitchDetectorSettings;
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
