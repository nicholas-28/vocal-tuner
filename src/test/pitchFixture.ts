import type { PitchDetectorSettings, RawPitchDetection } from '../types/pitch';

export const testPitchSettings: PitchDetectorSettings = {
  sampleRate: 48_000,
  fftSize: 4096,
  windowDurationMs: 4096 / 48,
  minimumFrequencyHz: 65,
  maximumFrequencyHz: 1200,
  minimumRms: 0.005,
  yinThreshold: 0.35,
  minimumConfidence: 0.7,
};

export function createPitchDetection(
  overrides: Partial<RawPitchDetection> = {},
): RawPitchDetection {
  return {
    timestampMs: 1,
    frequencyHz: 220,
    confidence: 0.95,
    rms: 0.4,
    signalPassed: true,
    selectedLag: 218.18,
    rawCandidateFrequencyHz: 220,
    minimumYinValue: 0.05,
    selectedYinValue: 0.05,
    rawConfidence: 0.95,
    rejectionReason: 'detected',
    analysisDurationMs: 1,
    settings: testPitchSettings,
    ...overrides,
  };
}
