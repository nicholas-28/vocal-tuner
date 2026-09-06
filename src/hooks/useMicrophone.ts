import { useCallback, useEffect, useRef, useState } from 'react';
import {
  mapMicrophoneError,
  requestMicrophoneStream,
  supportsMicrophoneCapture,
} from '../audio/microphone';
import {
  startPitchAnalysis,
  type PitchAnalysisHandle,
} from '../audio/pitchAnalysis';
import type {
  MicrophoneErrorState,
  MicrophoneState,
} from '../types/microphone';
import { createPitchSource } from '../pitch/pitchSource';
import type { RawPitchDetection } from '../types/pitch';
import type { MicrophoneAudioDiagnosticEvent } from '../types/audioDiagnostics';

export type MicrophoneServices = {
  isSupported: () => boolean;
  requestStream: () => Promise<MediaStream>;
  startLevelMonitor: (
    stream: MediaStream,
    onDetection: (detection: RawPitchDetection) => void,
    onError: () => void,
    onObservation?: (detection: RawPitchDetection) => void,
  ) => PitchAnalysisHandle;
};

type MicrophoneAnalysisCallbacks = {
  // Realtime metadata callback: consumers must not schedule React updates here.
  onObservation?: (detection: RawPitchDetection) => void;
  onSessionStarted?: () => void;
  onDetection?: (detection: RawPitchDetection) => void;
  onAnalysisError?: () => void;
  onAnalysisReset?: () => void;
  onAudioDiagnosticEvent?: (event: MicrophoneAudioDiagnosticEvent) => void;
};

const defaultServices: MicrophoneServices = {
  isSupported: supportsMicrophoneCapture,
  requestStream: requestMicrophoneStream,
  startLevelMonitor: startPitchAnalysis,
};

export function useMicrophone(
  services: MicrophoneServices = defaultServices,
  callbacks: MicrophoneAnalysisCallbacks = {},
) {
  const [pitchSourceController] = useState(() => createPitchSource());
  const [state, setState] = useState<MicrophoneState>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  // The ref is the synchronous command lock; React state is presentation only.
  const stateRef = useRef<MicrophoneState>('idle');
  const streamRef = useRef<MediaStream | null>(null);
  const monitorRef = useRef<PitchAnalysisHandle | null>(null);
  const listenersRef = useRef<
    Array<{
      track: MediaStreamTrack;
      type: string;
      listener: () => void;
    }>
  >([]);
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  const cleanupPromiseRef = useRef<Promise<void>>(Promise.resolve());

  const transition = useCallback((next: MicrophoneState) => {
    stateRef.current = next;
    if (mountedRef.current) setState(next);
  }, []);

  const cleanup = useCallback(
    (freshness: 'stale' | 'inactive' = 'inactive') => {
      // Revoke publications and detach ownership before any asynchronous work.
      // Preserve this command's identity even if reset synchronously reenters Stop.
      const operation = ++operationRef.current;
      for (const { track, type, listener } of listenersRef.current)
        track.removeEventListener(type, listener);
      listenersRef.current = [];
      const stream = streamRef.current;
      const monitor = monitorRef.current;
      streamRef.current = null;
      monitorRef.current = null;
      stopTracks(stream);
      let closing: Promise<void>;
      try {
        closing = monitor?.stop() ?? Promise.resolve();
      } catch {
        closing = Promise.reject(new Error('Analysis cleanup failed'));
      }
      const result = Promise.allSettled([
        cleanupPromiseRef.current,
        closing,
      ]).then((results) =>
        results.every((entry) => entry.status === 'fulfilled'),
      );
      cleanupPromiseRef.current = result.then(() => undefined);
      // Source invalidation also runs on unmount, without touching React state.
      pitchSourceController.invalidate(freshness);
      // Invalidation is synchronous, independent of AudioContext.close latency.
      if (mountedRef.current) {
        setInputLevel(0);
        callbacksRef.current.onAnalysisReset?.();
      }
      return { operation, closing: result };
    },
    [pitchSourceController],
  );

  const stop = useCallback(async () => {
    if (stateRef.current === 'idle' || stateRef.current === 'stopping') return;
    transition('stopping');
    const { operation, closing } = cleanup();
    const released = await closing;
    if (!mountedRef.current || operation !== operationRef.current) return;
    callbacksRef.current.onAudioDiagnosticEvent?.({
      label: 'after microphone Stop',
      microphoneState: released ? 'idle' : 'error',
      contextState: released ? 'closed' : 'unknown',
      sampleRate: null,
      destinationChannelCount: null,
      destinationConnected: false,
      activeTrackCount: 0,
      trackReadyState: 'none',
    });
    if (!mountedRef.current || operation !== operationRef.current) return;
    transition(released ? 'idle' : 'error');
  }, [cleanup, transition]);

  const start = useCallback(async () => {
    if (
      !mountedRef.current ||
      ['requesting', 'active', 'stopping'].includes(stateRef.current)
    )
      return;
    // Acquire the generation and command lock before the first await.
    transition('requesting');
    const { operation, closing } = cleanup();
    const ownsOperation = () =>
      mountedRef.current && operation === operationRef.current;
    const fail = (next: MicrophoneErrorState, analysisError = false) => {
      if (!ownsOperation()) return;
      const invalidation = cleanup(analysisError ? 'stale' : 'inactive');
      if (
        !mountedRef.current ||
        invalidation.operation !== operationRef.current
      )
        return;
      transition(next);
      if (analysisError) callbacksRef.current.onAnalysisError?.();
    };
    await closing;
    if (!ownsOperation()) return;

    try {
      const supported = services.isSupported();
      if (!ownsOperation()) return;
      if (!supported) {
        transition('unsupported');
        return;
      }
      callbacksRef.current.onAudioDiagnosticEvent?.({
        label: 'before getUserMedia',
        microphoneState: 'requesting',
        contextState: 'unavailable',
        sampleRate: null,
        destinationChannelCount: null,
        destinationConnected: false,
        activeTrackCount: 0,
        trackReadyState: 'none',
      });
      if (!ownsOperation()) return;
      const stream = await services.requestStream();
      if (!ownsOperation()) {
        stopTracks(stream);
        return;
      }
      streamRef.current = stream;
      const tracks = stream.getTracks();
      if (
        tracks.length === 0 ||
        tracks.some((track) => track.readyState === 'ended' || track.muted)
      ) {
        fail('no-device');
        return;
      }
      callbacksRef.current.onAudioDiagnosticEvent?.({
        label: 'after getUserMedia resolved',
        microphoneState: 'requesting',
        contextState: 'unavailable',
        sampleRate: null,
        destinationChannelCount: null,
        destinationConnected: false,
        activeTrackCount: tracks.length,
        trackReadyState: tracks
          .map((track) => track.readyState || 'unknown')
          .join(', '),
      });
      if (!ownsOperation()) return;
      for (const track of tracks) {
        for (const type of ['ended', 'mute']) {
          const listener = () => fail('no-device', true);
          track.addEventListener(type, listener);
          listenersRef.current.push({ track, type, listener });
        }
      }
      pitchSourceController.beginSession(operation);
      if (!ownsOperation()) return;
      callbacksRef.current.onSessionStarted?.();
      if (!ownsOperation()) return;
      const monitor = services.startLevelMonitor(
        stream,
        (detection) => {
          if (!ownsOperation()) return;
          if (
            tracks.some((track) => track.readyState === 'ended' || track.muted)
          ) {
            fail('no-device', true);
            return;
          }
          // Active means the source has delivered fresh evidence, including silence.
          if (stateRef.current !== 'active') transition('active');
          setInputLevel(detection.rms);
          callbacksRef.current.onDetection?.(detection);
        },
        () => fail('error', true),
        (detection) => {
          if (!ownsOperation()) return;
          if (
            tracks.some((track) => track.readyState === 'ended' || track.muted)
          ) {
            fail('no-device', true);
            return;
          }
          pitchSourceController.publish(detection, operation);
          if (ownsOperation()) callbacksRef.current.onObservation?.(detection);
        },
      );
      // A synchronous construction callback can invalidate the operation before
      // its handle is returned. That handle still needs disposal.
      if (!ownsOperation()) {
        const disposing = monitor.stop();
        cleanupPromiseRef.current = Promise.allSettled([
          cleanupPromiseRef.current,
          disposing,
        ]).then(() => undefined);
        return;
      }
      monitorRef.current = monitor;
      callbacksRef.current.onAudioDiagnosticEvent?.({
        label: 'after microphone AudioContext starts',
        microphoneState: stateRef.current,
        ...monitor.diagnostics,
        activeTrackCount: tracks.length,
        trackReadyState: tracks
          .map((track) => track.readyState || 'unknown')
          .join(', '),
      });
    } catch (error) {
      if (!ownsOperation()) return;
      callbacksRef.current.onAudioDiagnosticEvent?.({
        label: 'getUserMedia or microphone start failed',
        microphoneState: 'error',
        contextState: 'unavailable',
        sampleRate: null,
        destinationChannelCount: null,
        destinationConnected: false,
        activeTrackCount: 0,
        trackReadyState: 'none',
      });
      fail(mapMicrophoneError(error), streamRef.current !== null);
    }
  }, [cleanup, pitchSourceController, services, transition]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void cleanup();
    };
  }, [cleanup]);

  return {
    state,
    inputLevel,
    start,
    stop,
    pitchSource: pitchSourceController.source,
  };
}

function stopTracks(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) {
    try {
      track.stop();
    } catch {
      /* Still attempt every remaining track. */
    }
  }
}
