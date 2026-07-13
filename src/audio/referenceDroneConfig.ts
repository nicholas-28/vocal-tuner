import type {
  ReferenceDroneConfig,
  ReferenceDroneDiagnostics,
} from '../types/referenceDrone';

export const DEFAULT_REFERENCE_DRONE_CONFIG: Readonly<ReferenceDroneConfig> = {
  oscillatorType: 'sine',
  attackSeconds: 0.05,
  releaseSeconds: 0.12,
  transitionSeconds: 0.07,
  volumeSmoothingSeconds: 0.03,
  defaultVolume: 0.25,
  maximumMasterGain: 0.16,
};

export function createInitialReferenceDroneDiagnostics(): ReferenceDroneDiagnostics {
  return {
    contextState: 'unavailable',
    engineState: 'idle',
    voiceState: 'none',
    oscillatorStarted: false,
    graphConnected: false,
    destinationConnected: false,
    midiNote: null,
    frequencyHz: null,
    oscillatorType: DEFAULT_REFERENCE_DRONE_CONFIG.oscillatorType,
    voiceGainTarget: null,
    masterGain: null,
    effectiveGain: null,
    lastCommand: null,
    errorCode: null,
    errorMessage: null,
  };
}

export function isValidReferenceDroneConfig(
  config: ReferenceDroneConfig,
): boolean {
  return (
    config.oscillatorType === 'sine' &&
    Number.isFinite(config.attackSeconds) &&
    config.attackSeconds > 0 &&
    Number.isFinite(config.releaseSeconds) &&
    config.releaseSeconds > 0 &&
    Number.isFinite(config.transitionSeconds) &&
    config.transitionSeconds > 0 &&
    Number.isFinite(config.volumeSmoothingSeconds) &&
    config.volumeSmoothingSeconds > 0 &&
    Number.isFinite(config.defaultVolume) &&
    config.defaultVolume >= 0 &&
    config.defaultVolume <= 1 &&
    Number.isFinite(config.maximumMasterGain) &&
    config.maximumMasterGain > 0 &&
    config.maximumMasterGain <= 0.2
  );
}

export function normalizeReferenceDroneVolume(
  value: number,
  fallback = DEFAULT_REFERENCE_DRONE_CONFIG.defaultVolume,
): number {
  if (!Number.isFinite(value)) return Math.min(1, Math.max(0, fallback));
  return Math.min(1, Math.max(0, value));
}

export function mapReferenceDroneVolumeToGain(
  normalizedVolume: number,
  maximumGain = DEFAULT_REFERENCE_DRONE_CONFIG.maximumMasterGain,
): number {
  if (!Number.isFinite(maximumGain) || maximumGain <= 0) return 0;
  return normalizeReferenceDroneVolume(normalizedVolume) * maximumGain;
}
