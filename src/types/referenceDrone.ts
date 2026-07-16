export type ReferenceDroneStatus =
  'stopped' | 'starting' | 'playing' | 'changing' | 'stopping' | 'error';

export type ReferenceDroneErrorCode =
  | 'unavailable'
  | 'invalid-note'
  | 'context-not-running'
  | 'context-interrupted'
  | 'context-closed'
  | 'graph-connection-failed'
  | 'oscillator-start-failed'
  | 'audio-start-failed';

export type ReferenceDroneContextState =
  | 'unavailable'
  | 'suspended'
  | 'running'
  | 'interrupted'
  | 'closed'
  | 'unknown';

export type ReferenceDroneAudioContextConstructorName =
  'AudioContext' | 'webkitAudioContext' | 'unavailable';

export type ReferenceDroneResumeResult =
  'not-requested' | 'pending' | 'resolved' | 'rejected';

export type ReferenceDroneLifecycleEvent = Readonly<{
  sequence: number;
  relativeTimeMs: number;
  name: string;
  detail: string | null;
}>;

export type ReferenceDroneOutputTestStatus =
  'idle' | 'starting' | 'playing' | 'succeeded' | 'failed';

export type ReferenceDroneSignalClassification =
  'unknown' | 'digitally-silent' | 'digitally-active';

export type ReferenceDroneSignalMeasurement = Readonly<{
  classification: ReferenceDroneSignalClassification;
  rms: number | null;
  peak: number | null;
  latestSampledTimestampMs: number | null;
  samplesInspected: number;
  consecutiveActiveMeasurements: number;
  consecutiveSilentMeasurements: number;
  lastDigitallyActiveTimestampMs: number | null;
  analyserGenerationId: number | null;
  contextGenerationId: number | null;
  voiceGenerationId: number | null;
  analyserConnectedToDestination: boolean;
}>;

export type ReferenceDroneAutomationDiagnostics = Readonly<{
  currentValue: number | null;
  scheduledTarget: number | null;
  schedulingContextTime: number | null;
  lastAutomationTimestampMs: number | null;
  method: string;
  fallbackMethod: string | null;
  scheduledAfterRunning: boolean | null;
}>;

export type ReferenceDroneDiagnosticTestResult = Readonly<{
  status: ReferenceDroneOutputTestStatus;
  graphPath: string;
  oscillatorStarted: boolean;
  automation: ReferenceDroneAutomationDiagnostics;
  signal: ReferenceDroneSignalMeasurement;
  errorMessage: string | null;
}>;

export type ReferenceDroneAudioSessionDiagnostics = Readonly<{
  available: boolean;
  type: string | null;
  state: string | null;
}>;

export type ReferenceDroneVoiceState =
  'none' | 'created' | 'started' | 'releasing' | 'ended';

export type ReferenceDroneDiagnostics = {
  userAgentSummary: string;
  secureContext: boolean;
  constructorAvailable: boolean;
  constructorName: ReferenceDroneAudioContextConstructorName;
  contextGenerationId: number | null;
  contextState: ReferenceDroneContextState;
  contextSampleRate: number | null;
  contextBaseLatency: number | null;
  destinationChannelCount: number | null;
  engineState: ReferenceDroneStatus | 'idle' | 'disposed';
  voiceState: ReferenceDroneVoiceState;
  engineGenerationId: number;
  voiceGenerationId: number | null;
  oscillatorCreated: boolean;
  oscillatorStarted: boolean;
  oscillatorEnded: boolean;
  graphConnected: boolean;
  voiceGainConnected: boolean;
  masterGainConnected: boolean;
  destinationConnected: boolean;
  midiNote: number | null;
  frequencyHz: number | null;
  oscillatorType: OscillatorType;
  voiceGainTarget: number | null;
  voiceGainCurrent: number | null;
  masterGain: number | null;
  masterGainCurrent: number | null;
  effectiveGain: number | null;
  lastUserActivationTimestampMs: number | null;
  lastCommand: string | null;
  resumeRequested: boolean;
  resumeResult: ReferenceDroneResumeResult;
  contextStateAfterResume: ReferenceDroneContextState | null;
  renderingClockAdvanced: boolean | null;
  lastStateChangeTimestampMs: number | null;
  lastVisibilityChange: string | null;
  documentVisibilityState: string;
  pageLifecycleState: string;
  requiresExplicitReactivation: boolean;
  outputTestStatus: ReferenceDroneOutputTestStatus;
  persistentSignal: ReferenceDroneSignalMeasurement;
  engineOutputTest: ReferenceDroneDiagnosticTestResult;
  directOutputTest: ReferenceDroneDiagnosticTestResult;
  constantGainOutputTest: ReferenceDroneDiagnosticTestResult;
  recreatedContextOutputTest: ReferenceDroneDiagnosticTestResult;
  contextCloseResult: string;
  previousContextGenerationId: number | null;
  voiceAutomation: ReferenceDroneAutomationDiagnostics;
  masterAutomation: ReferenceDroneAutomationDiagnostics;
  audioSession: ReferenceDroneAudioSessionDiagnostics;
  lifecycleLog: readonly ReferenceDroneLifecycleEvent[];
  errorCode: ReferenceDroneErrorCode | null;
  errorMessage: string | null;
};

export type ReferenceDroneNote = {
  midiNote: number;
  frequencyHz: number;
};

export type ReferenceDroneSnapshot = {
  status: ReferenceDroneStatus;
  activeMidi: number | null;
  frequencyHz: number | null;
  volume: number;
  errorCode: ReferenceDroneErrorCode | null;
  diagnostics: ReferenceDroneDiagnostics;
};

export type ReferenceDroneCommandResult =
  { ok: true } | { ok: false; errorCode: ReferenceDroneErrorCode };

export type ReferenceDroneConfig = {
  oscillatorType: OscillatorType;
  attackSeconds: number;
  releaseSeconds: number;
  transitionSeconds: number;
  volumeSmoothingSeconds: number;
  defaultVolume: number;
  maximumMasterGain: number;
};

export type ReferenceDroneEngine = {
  activateFromUserGesture: (
    note: ReferenceDroneNote,
  ) => Promise<ReferenceDroneCommandResult>;
  play: (note: ReferenceDroneNote) => Promise<ReferenceDroneCommandResult>;
  playOutputTestFromUserGesture: () => Promise<ReferenceDroneCommandResult>;
  playDirectOutputTestFromUserGesture: () => Promise<ReferenceDroneCommandResult>;
  playConstantGainOutputTestFromUserGesture: () => Promise<ReferenceDroneCommandResult>;
  recreateContextAndPlayOutputTestFromUserGesture: () => Promise<ReferenceDroneCommandResult>;
  stop: () => Promise<void>;
  setVolume: (normalizedVolume: number) => void;
  getSnapshot: () => ReferenceDroneSnapshot;
  subscribe: (
    listener: (snapshot: ReferenceDroneSnapshot) => void,
  ) => () => void;
  dispose: () => Promise<void>;
};

export type ReferenceDroneEngineFactory = (
  initialVolume: number,
  diagnosticsEnabled?: boolean,
) => ReferenceDroneEngine;
