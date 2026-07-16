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
import type { MicrophoneState } from '../types/microphone';
import type { RawPitchDetection } from '../types/pitch';
import type { MicrophoneAudioDiagnosticEvent } from '../types/audioDiagnostics';

export type MicrophoneServices = {
  isSupported: () => boolean;
  requestStream: () => Promise<MediaStream>;
  startLevelMonitor: (
    stream: MediaStream,
    onDetection: (detection: RawPitchDetection) => void,
    onError: () => void,
  ) => PitchAnalysisHandle;
};

type MicrophoneAnalysisCallbacks = {
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
  const [state, setState] = useState<MicrophoneState>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const streamRef = useRef<MediaStream | null>(null);
  const monitorRef = useRef<PitchAnalysisHandle | null>(null);
  const endedListenersRef = useRef<
    Array<{ track: MediaStreamTrack; listener: () => void }>
  >([]);
  const operationRef = useRef(0);
  const mountedRef = useRef(true);

  const cleanup = useCallback(async () => {
    operationRef.current += 1;

    for (const { track, listener } of endedListenersRef.current) {
      track.removeEventListener('ended', listener);
    }
    endedListenersRef.current = [];

    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());

    const monitor = monitorRef.current;
    monitorRef.current = null;
    await monitor?.stop();

    callbacksRef.current.onAnalysisReset?.();
    if (mountedRef.current) setInputLevel(0);
  }, []);

  const stop = useCallback(async () => {
    if (state !== 'active') return;
    setState('stopping');
    await cleanup();
    callbacksRef.current.onAudioDiagnosticEvent?.({
      label: 'after microphone Stop',
      microphoneState: 'idle',
      contextState: 'closed',
      sampleRate: null,
      destinationChannelCount: null,
      destinationConnected: false,
      activeTrackCount: 0,
      trackReadyState: 'none',
    });
    if (mountedRef.current) setState('idle');
  }, [cleanup, state]);

  const start = useCallback(async () => {
    if (state === 'requesting' || state === 'active' || state === 'stopping') {
      return;
    }

    await cleanup();
    if (!mountedRef.current) return;

    if (!services.isSupported()) {
      setState('unsupported');
      return;
    }

    const operation = operationRef.current;
    setState('requesting');
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

    try {
      const stream = await services.requestStream();
      if (!mountedRef.current || operation !== operationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const tracks = stream.getTracks();
      callbacksRef.current.onAudioDiagnosticEvent?.({
        label: 'after getUserMedia resolved',
        microphoneState: 'requesting',
        contextState: 'unavailable',
        sampleRate: null,
        destinationChannelCount: null,
        destinationConnected: false,
        activeTrackCount: tracks.filter((track) => track.readyState !== 'ended')
          .length,
        trackReadyState:
          tracks.map((track) => track.readyState || 'unknown').join(', ') ||
          'none',
      });
      const handleEnded = () => {
        void cleanup().then(() => {
          if (mountedRef.current) setState('no-device');
        });
      };

      for (const track of stream.getTracks()) {
        track.addEventListener('ended', handleEnded);
        endedListenersRef.current.push({ track, listener: handleEnded });
      }

      callbacksRef.current.onSessionStarted?.();
      monitorRef.current = services.startLevelMonitor(
        stream,
        (detection) => {
          if (!mountedRef.current || operation !== operationRef.current) return;
          setInputLevel(detection.rms);
          callbacksRef.current.onDetection?.(detection);
        },
        () => callbacksRef.current.onAnalysisError?.(),
      );
      callbacksRef.current.onAudioDiagnosticEvent?.({
        label: 'after microphone AudioContext starts',
        microphoneState: 'active',
        contextState: monitorRef.current.diagnostics.contextState,
        sampleRate: monitorRef.current.diagnostics.sampleRate,
        destinationChannelCount:
          monitorRef.current.diagnostics.destinationChannelCount,
        destinationConnected:
          monitorRef.current.diagnostics.destinationConnected,
        activeTrackCount: tracks.filter((track) => track.readyState !== 'ended')
          .length,
        trackReadyState:
          tracks.map((track) => track.readyState || 'unknown').join(', ') ||
          'none',
      });
      setState('active');
    } catch (error) {
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
      await cleanup();
      if (import.meta.env.DEV) console.error('Microphone start failed', error);
      if (mountedRef.current) setState(mapMicrophoneError(error));
    }
  }, [cleanup, services, state]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void cleanup();
    };
  }, [cleanup]);

  return { state, inputLevel, start, stop };
}
