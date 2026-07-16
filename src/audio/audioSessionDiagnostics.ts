import type {
  AudioSessionDiagnosticSnapshot,
  AudioSessionDiagnosticState,
  AudioSessionDiagnosticTimeline,
  AudioSessionPreparationResult,
  AudioSessionPreparationType,
  MicrophoneAudioDiagnosticEvent,
  PhaseAudibilityResult,
  PhaseAudibilityResults,
} from '../types/audioDiagnostics';
import type { ReferenceDroneDiagnostics } from '../types/referenceDrone';

const MAX_AUDIO_SESSION_SNAPSHOTS = 40;
const AUDIO_SESSION_CANDIDATES = Object.freeze([
  'auto',
  'playback',
  'play-and-record',
] as const);

type MutableAudioSession = {
  type?: unknown;
  state?: unknown;
};

const initialPhaseResults: PhaseAudibilityResults = Object.freeze({
  beforeMicrophone: 'not-tested',
  afterMicrophoneStart: 'not-tested',
  afterMicrophoneStop: 'not-tested',
});

export function createAudioSessionDiagnosticTimeline(): AudioSessionDiagnosticTimeline {
  const startedAt = nowMs();
  let sequence = 0;
  let priorAudioSessionType: string | null = null;
  let drone: ReferenceDroneDiagnostics | null = null;
  let microphone: MicrophoneAudioDiagnosticEvent = {
    label: 'page load',
    microphoneState: 'idle',
    contextState: 'unavailable',
    sampleRate: null,
    destinationChannelCount: null,
    destinationConnected: false,
    activeTrackCount: 0,
    trackReadyState: 'none',
  };
  let currentPhysicalAnnotation: PhaseAudibilityResult = 'not-tested';
  let state: AudioSessionDiagnosticState = Object.freeze({
    snapshots: Object.freeze([]),
    phaseAudibility: initialPhaseResults,
    preparation: Object.freeze({
      available: Boolean(getAudioSession()),
      candidateTypes: AUDIO_SESSION_CANDIDATES,
      requestedType: null,
      priorType: null,
      resultingType: readAudioSession().type,
      resultingState: readAudioSession().state,
      result: 'not-requested',
      errorMessage: null,
    }),
  });
  const listeners = new Set<() => void>();

  const publish = (next: AudioSessionDiagnosticState) => {
    state = Object.freeze(next);
    for (const listener of listeners) listener();
  };

  const capture = (label: string) => {
    const session = readAudioSession();
    const snapshot: AudioSessionDiagnosticSnapshot = Object.freeze({
      sequence: ++sequence,
      relativeTimeMs: Math.max(0, nowMs() - startedAt),
      label,
      audioSessionAvailable: session.available,
      audioSessionType: session.type,
      audioSessionState: session.state,
      droneContextGeneration: drone?.contextGenerationId ?? null,
      droneContextState: drone?.contextState ?? 'unavailable',
      microphoneContextState: microphone.contextState,
      droneSampleRate: drone?.contextSampleRate ?? null,
      microphoneSampleRate: microphone.sampleRate,
      destinationChannelCount: drone?.destinationChannelCount ?? null,
      visibilityState:
        typeof document === 'undefined'
          ? 'unavailable'
          : document.visibilityState,
      pageHasFocus:
        typeof document === 'undefined' ||
        typeof document.hasFocus !== 'function'
          ? null
          : document.hasFocus(),
      activeMicrophoneTrackCount: microphone.activeTrackCount,
      microphoneTrackReadyState: microphone.trackReadyState,
      outputRms: drone?.persistentSignal.rms ?? null,
      outputPeak: drone?.persistentSignal.peak ?? null,
      dronePhysicalAnnotation: currentPhysicalAnnotation,
    });
    publish({
      ...state,
      snapshots: Object.freeze(
        [...state.snapshots, snapshot].slice(-MAX_AUDIO_SESSION_SNAPSHOTS),
      ),
    });
  };

  const captureDrone = (
    label: string,
    diagnostics: ReferenceDroneDiagnostics,
  ) => {
    drone = diagnostics;
    capture(label);
  };

  const updateDrone = (diagnostics: ReferenceDroneDiagnostics) => {
    drone = diagnostics;
  };

  const captureMicrophone = (event: MicrophoneAudioDiagnosticEvent) => {
    microphone = event;
    capture(event.label);
  };

  const prepare = (
    requestedType: AudioSessionPreparationType,
  ): AudioSessionPreparationResult => {
    const audioSession = getAudioSession();
    const before = readAudioSession();
    if (!audioSession || typeof audioSession.type !== 'string') {
      const result: AudioSessionPreparationResult = 'unavailable';
      publish({
        ...state,
        preparation: Object.freeze({
          ...state.preparation,
          available: false,
          requestedType,
          result,
          errorMessage: null,
        }),
      });
      capture(`audio session ${requestedType} unavailable`);
      return result;
    }
    if (priorAudioSessionType === null) priorAudioSessionType = before.type;
    let result: AudioSessionPreparationResult = 'failed';
    let errorMessage: string | null = null;
    try {
      audioSession.type = requestedType;
      result = audioSession.type === requestedType ? 'succeeded' : 'rejected';
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : 'AudioSession assignment failed.';
    }
    const after = readAudioSession();
    publish({
      ...state,
      preparation: Object.freeze({
        available: true,
        candidateTypes: AUDIO_SESSION_CANDIDATES,
        requestedType,
        priorType: priorAudioSessionType,
        resultingType: after.type,
        resultingState: after.state,
        result,
        errorMessage,
      }),
    });
    capture(`audio session prepared: ${requestedType}`);
    return result;
  };

  const restore = (): AudioSessionPreparationResult => {
    const audioSession = getAudioSession();
    if (!audioSession || priorAudioSessionType === null) {
      capture('audio session restore not available');
      return 'unavailable';
    }
    const restoreType = priorAudioSessionType;
    let result: AudioSessionPreparationResult = 'failed';
    let errorMessage: string | null = null;
    try {
      audioSession.type = restoreType;
      result = audioSession.type === restoreType ? 'restored' : 'rejected';
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : 'AudioSession restore failed.';
    }
    const after = readAudioSession();
    publish({
      ...state,
      preparation: Object.freeze({
        ...state.preparation,
        priorType: result === 'restored' ? null : restoreType,
        resultingType: after.type,
        resultingState: after.state,
        result,
        errorMessage,
      }),
    });
    capture('audio session restored');
    if (result === 'restored') priorAudioSessionType = null;
    return result;
  };

  const setPhaseAudibility = (
    phase: keyof PhaseAudibilityResults,
    result: PhaseAudibilityResult,
  ) => {
    currentPhysicalAnnotation = result;
    publish({
      ...state,
      phaseAudibility: Object.freeze({
        ...state.phaseAudibility,
        [phase]: result,
      }),
    });
    capture(`manual audibility: ${phase}=${result}`);
  };

  capture('page load');

  return {
    capture,
    captureDrone,
    updateDrone,
    captureMicrophone,
    prepare,
    restore,
    setPhaseAudibility,
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function getAudioSession(): MutableAudioSession | null {
  if (typeof navigator === 'undefined') return null;
  return (
    (navigator as Navigator & { audioSession?: MutableAudioSession })
      .audioSession ?? null
  );
}

function readAudioSession() {
  const audioSession = getAudioSession();
  return {
    available: Boolean(audioSession),
    type: typeof audioSession?.type === 'string' ? audioSession.type : null,
    state: typeof audioSession?.state === 'string' ? audioSession.state : null,
  };
}

function nowMs(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
