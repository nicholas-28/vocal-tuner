import { useCallback, useEffect, useRef, useState } from 'react';
import { createNativeA4WavBlob } from '../audio/nativeAudioDiagnostic';
import type { NativeAudioDiagnosticState } from '../types/audioDiagnostics';

export const INITIAL_NATIVE_AUDIO_DIAGNOSTIC_STATE: NativeAudioDiagnosticState =
  Object.freeze({
    status: 'idle',
    playResult: 'not-requested',
    playingEventReceived: false,
    timeUpdateReceived: false,
    currentTime: 0,
    endedEventReceived: false,
    paused: true,
    errorCode: null,
    errorMessage: null,
    events: [],
  });

export function useNativeAudioDiagnostic() {
  const [state, setState] = useState(INITIAL_NATIVE_AUDIO_DIAGNOSTIC_STATE);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const removeListenersRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    removeListenersRef.current?.();
    removeListenersRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const appendEvent = useCallback((event: string) => {
    setState((current) => ({
      ...current,
      events: Object.freeze([...current.events, event].slice(-20)),
    }));
  }, []);

  const playFromUserGesture = useCallback(() => {
    cleanup();
    const url = URL.createObjectURL(createNativeA4WavBlob());
    const audio = new Audio(url);
    urlRef.current = url;
    audioRef.current = audio;
    audio.preload = 'auto';
    setState({
      ...INITIAL_NATIVE_AUDIO_DIAGNOSTIC_STATE,
      status: 'play-requested',
      playResult: 'pending',
      events: Object.freeze(['play requested']),
    });
    const handlePlaying = () => {
      appendEvent('playing');
      setState((current) => ({
        ...current,
        status: 'playing',
        playingEventReceived: true,
        paused: audio.paused,
      }));
    };
    const handleTimeUpdate = () => {
      setState((current) => ({
        ...current,
        timeUpdateReceived: true,
        currentTime: audio.currentTime,
        paused: audio.paused,
      }));
    };
    const handleEnded = () => {
      appendEvent('ended');
      setState((current) => ({
        ...current,
        status: 'succeeded',
        endedEventReceived: true,
        currentTime: audio.currentTime,
        paused: audio.paused,
      }));
      cleanup();
    };
    const handleError = () => {
      const code = audio.error?.code ?? null;
      const message = audio.error?.message || 'Native audio playback failed.';
      appendEvent(`error:${code ?? 'unknown'}`);
      setState((current) => ({
        ...current,
        status: 'failed',
        paused: audio.paused,
        errorCode: code,
        errorMessage: message,
      }));
      cleanup();
    };
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    removeListenersRef.current = () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
    const playPromise = audio.play();
    void playPromise.then(
      () => {
        appendEvent('play resolved');
        setState((current) => ({ ...current, playResult: 'resolved' }));
      },
      (error: unknown) => {
        appendEvent('play rejected');
        setState((current) => ({
          ...current,
          status: 'failed',
          playResult: 'rejected',
          paused: audio.paused,
          errorMessage:
            error instanceof Error ? error.message : 'Native play rejected.',
        }));
        cleanup();
      },
    );
  }, [appendEvent, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { state, playFromUserGesture };
}
