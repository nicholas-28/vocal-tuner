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
}>;
