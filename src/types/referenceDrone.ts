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
  'unavailable' | 'suspended' | 'running' | 'interrupted' | 'closed';

export type ReferenceDroneVoiceState =
  'none' | 'created' | 'started' | 'releasing' | 'ended';

export type ReferenceDroneDiagnostics = {
  contextState: ReferenceDroneContextState;
  engineState: ReferenceDroneStatus | 'idle' | 'disposed';
  voiceState: ReferenceDroneVoiceState;
  oscillatorStarted: boolean;
  graphConnected: boolean;
  destinationConnected: boolean;
  midiNote: number | null;
  frequencyHz: number | null;
  oscillatorType: OscillatorType;
  voiceGainTarget: number | null;
  masterGain: number | null;
  effectiveGain: number | null;
  lastCommand: string | null;
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
  play: (note: ReferenceDroneNote) => Promise<ReferenceDroneCommandResult>;
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
) => ReferenceDroneEngine;
