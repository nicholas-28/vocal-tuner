import type {
  AudioSessionDiagnosticSnapshot,
  AudioSessionDiagnosticState,
  AudioSessionDiagnosticTimeline,
  MicrophoneAudioDiagnosticEvent,
} from '../types/audioDiagnostics';
import type { ReferenceDroneDiagnostics } from '../types/referenceDrone';

const MAX_AUDIO_SESSION_SNAPSHOTS = 40;
export function createAudioSessionDiagnosticTimeline(): AudioSessionDiagnosticTimeline {
  const startedAt = nowMs();
  let sequence = 0;
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
  let state: AudioSessionDiagnosticState = Object.freeze({
    snapshots: Object.freeze([]),
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

  capture('page load');

  return {
    capture,
    captureDrone,
    updateDrone,
    captureMicrophone,
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function getAudioSession(): { type?: unknown; state?: unknown } | null {
  if (typeof navigator === 'undefined') return null;
  return (
    (
      navigator as Navigator & {
        audioSession?: { type?: unknown; state?: unknown };
      }
    ).audioSession ?? null
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
