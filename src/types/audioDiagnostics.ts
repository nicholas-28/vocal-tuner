export type ManualAudibilityResult = 'not-recorded' | 'yes' | 'no';

export type AudioDiagnosticManualResults = Readonly<{
  persistentDrone: ManualAudibilityResult;
  directWebAudio: ManualAudibilityResult;
  constantGainWebAudio: ManualAudibilityResult;
  nativeAudio: ManualAudibilityResult;
  recreatedContext: ManualAudibilityResult;
}>;

export type NativeAudioDiagnosticState = Readonly<{
  status: 'idle' | 'play-requested' | 'playing' | 'succeeded' | 'failed';
  playResult: 'not-requested' | 'pending' | 'resolved' | 'rejected';
  playingEventReceived: boolean;
  timeUpdateReceived: boolean;
  currentTime: number;
  endedEventReceived: boolean;
  paused: boolean;
  errorCode: number | null;
  errorMessage: string | null;
  events: readonly string[];
}>;

export type AudioDiagnosticReportContext = Readonly<{
  manualResults: AudioDiagnosticManualResults;
  nativeAudio: NativeAudioDiagnosticState;
  audioSessionTimeline?: AudioSessionDiagnosticState;
}>;

export type PhaseAudibilityResult = 'not-tested' | 'audible' | 'silent';

export type PhaseAudibilityResults = Readonly<{
  beforeMicrophone: PhaseAudibilityResult;
  afterMicrophoneStart: PhaseAudibilityResult;
  afterMicrophoneStop: PhaseAudibilityResult;
}>;

export type MicrophoneAudioDiagnosticEvent = Readonly<{
  label: string;
  microphoneState: string;
  contextState: string;
  sampleRate: number | null;
  destinationChannelCount: number | null;
  destinationConnected: boolean;
  activeTrackCount: number;
  trackReadyState: string;
}>;

export type AudioSessionDiagnosticSnapshot = Readonly<{
  sequence: number;
  relativeTimeMs: number;
  label: string;
  audioSessionAvailable: boolean;
  audioSessionType: string | null;
  audioSessionState: string | null;
  droneContextGeneration: number | null;
  droneContextState: string;
  microphoneContextState: string;
  droneSampleRate: number | null;
  microphoneSampleRate: number | null;
  destinationChannelCount: number | null;
  visibilityState: string;
  pageHasFocus: boolean | null;
  activeMicrophoneTrackCount: number;
  microphoneTrackReadyState: string;
  outputRms: number | null;
  outputPeak: number | null;
  dronePhysicalAnnotation: PhaseAudibilityResult;
}>;

export type AudioSessionPreparationType = 'playback' | 'play-and-record';
export type AudioSessionPreparationResult =
  | 'not-requested'
  | 'succeeded'
  | 'restored'
  | 'rejected'
  | 'failed'
  | 'unavailable';

export type AudioSessionDiagnosticState = Readonly<{
  snapshots: readonly AudioSessionDiagnosticSnapshot[];
  phaseAudibility: PhaseAudibilityResults;
  preparation: Readonly<{
    available: boolean;
    candidateTypes: readonly string[];
    requestedType: AudioSessionPreparationType | null;
    priorType: string | null;
    resultingType: string | null;
    resultingState: string | null;
    result: AudioSessionPreparationResult;
    errorMessage: string | null;
  }>;
}>;

export type AudioSessionDiagnosticTimeline = Readonly<{
  capture: (label: string) => void;
  captureDrone: (
    label: string,
    diagnostics: import('./referenceDrone').ReferenceDroneDiagnostics,
  ) => void;
  updateDrone: (
    diagnostics: import('./referenceDrone').ReferenceDroneDiagnostics,
  ) => void;
  captureMicrophone: (event: MicrophoneAudioDiagnosticEvent) => void;
  prepare: (type: AudioSessionPreparationType) => AudioSessionPreparationResult;
  restore: () => AudioSessionPreparationResult;
  setPhaseAudibility: (
    phase: keyof PhaseAudibilityResults,
    result: PhaseAudibilityResult,
  ) => void;
  getSnapshot: () => AudioSessionDiagnosticState;
  subscribe: (listener: () => void) => () => void;
}>;
