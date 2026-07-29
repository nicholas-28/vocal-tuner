import type {
  ReferenceDroneAudioContextConstructorName,
  ReferenceDroneAutomationDiagnostics,
  ReferenceDroneConfig,
  ReferenceDroneDiagnosticTestResult,
  ReferenceDroneDiagnostics,
} from '../types/referenceDrone';
import { createInitialSignalMeasurement } from './referenceDroneSignal';

export const DEFAULT_REFERENCE_DRONE_CONFIG: Readonly<ReferenceDroneConfig> = {
  oscillatorType: 'sine',
  attackSeconds: 0.05,
  releaseSeconds: 0.12,
  transitionSeconds: 0.07,
  volumeSmoothingSeconds: 0.03,
  defaultVolume: 0.25,
  maximumMasterGain: 0.16,
};

export function createInitialAutomationDiagnostics(): ReferenceDroneAutomationDiagnostics {
  return Object.freeze({
    currentValue: null,
    scheduledTarget: null,
    schedulingContextTime: null,
    lastAutomationTimestampMs: null,
    method: 'none',
    fallbackMethod: null,
    scheduledAfterRunning: null,
  });
}

export function createInitialDiagnosticTestResult(
  graphPath: string,
): ReferenceDroneDiagnosticTestResult {
  return Object.freeze({
    status: 'idle',
    graphPath,
    oscillatorStarted: false,
    automation: createInitialAutomationDiagnostics(),
    signal: createInitialSignalMeasurement(),
    errorMessage: null,
  });
}

function getAudioSessionDiagnostics() {
  const audioSession =
    typeof navigator === 'undefined'
      ? undefined
      : (
          navigator as Navigator & {
            audioSession?: { type?: unknown; state?: unknown };
          }
        ).audioSession;
  return Object.freeze({
    available: Boolean(audioSession),
    type: typeof audioSession?.type === 'string' ? audioSession.type : null,
    state: typeof audioSession?.state === 'string' ? audioSession.state : null,
    preparationResult: 'not-requested' as const,
    priorType: null,
    restoredType: null,
    errorMessage: null,
  });
}

export function createInitialReferenceDroneDiagnostics(
  constructorName: ReferenceDroneAudioContextConstructorName = 'unavailable',
  engineGenerationId = 0,
): ReferenceDroneDiagnostics {
  return {
    userAgentSummary:
      typeof navigator === 'undefined' ? 'unavailable' : navigator.userAgent,
    secureContext:
      typeof window !== 'undefined' && window.isSecureContext === true,
    constructorAvailable: constructorName !== 'unavailable',
    constructorName,
    contextGenerationId: null,
    contextState: 'unavailable',
    contextSampleRate: null,
    contextBaseLatency: null,
    destinationChannelCount: null,
    engineState: 'idle',
    voiceState: 'none',
    engineGenerationId,
    voiceGenerationId: null,
    oscillatorCreated: false,
    oscillatorStarted: false,
    oscillatorEnded: false,
    graphConnected: false,
    voiceGainConnected: false,
    masterGainConnected: false,
    destinationConnected: false,
    midiNote: null,
    frequencyHz: null,
    oscillatorType: DEFAULT_REFERENCE_DRONE_CONFIG.oscillatorType,
    voiceGainTarget: null,
    voiceGainCurrent: null,
    masterGain: null,
    masterGainCurrent: null,
    effectiveGain: null,
    lastUserActivationTimestampMs: null,
    lastCommand: null,
    resumeRequested: false,
    resumeResult: 'not-requested',
    contextStateAfterResume: null,
    renderingClockAdvanced: null,
    lastStateChangeTimestampMs: null,
    lastVisibilityChange: null,
    documentVisibilityState:
      typeof document === 'undefined'
        ? 'unavailable'
        : document.visibilityState,
    pageLifecycleState: 'active',
    requiresExplicitReactivation: false,
    outputTestStatus: 'idle',
    persistentSignal: createInitialSignalMeasurement(),
    engineOutputTest: createInitialDiagnosticTestResult(
      'oscillator → voice gain → master gain → output analyser → destination',
    ),
    directOutputTest: createInitialDiagnosticTestResult(
      'temporary oscillator → temporary gain → temporary analyser → destination',
    ),
    constantGainOutputTest: createInitialDiagnosticTestResult(
      'temporary oscillator → constant gain → temporary analyser → destination',
    ),
    recreatedContextOutputTest: createInitialDiagnosticTestResult(
      'new context → temporary oscillator → constant gain → temporary analyser → destination',
    ),
    contextCloseResult: 'not-requested',
    previousContextGenerationId: null,
    voiceAutomation: createInitialAutomationDiagnostics(),
    masterAutomation: createInitialAutomationDiagnostics(),
    audioSession: getAudioSessionDiagnostics(),
    backend: 'web-audio',
    timbreProfile: 'pure-sine-fallback',
    partials: [],
    predictedPeak: null,
    lifecycleLog: [],
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
