import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appendPitchHistory,
  clearPitchHistory,
  createPitchHistory,
  summarizePitchHistory,
} from '../history/pitchHistory';
import {
  DEFAULT_HISTORY_DURATION_MS,
  isValidHistoryDuration,
} from '../history/pitchHistoryConfig';
import { acceptedDetectionToMusicalPitch } from './useMusicalPitch';
import type { RawPitchDetection } from '../types/pitch';

export function usePitchHistory(durationMs = DEFAULT_HISTORY_DURATION_MS) {
  const validDurationMs = isValidHistoryDuration(durationMs)
    ? durationMs
    : DEFAULT_HISTORY_DURATION_MS;
  const [history, setHistory] = useState(createPitchHistory);
  const sessionActiveRef = useRef(false);
  const mountedRef = useRef(true);

  const startSession = useCallback(() => {
    sessionActiveRef.current = true;
    if (mountedRef.current) setHistory(createPitchHistory());
  }, []);

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
  }, []);

  const onDetection = useCallback(
    (detection: RawPitchDetection) => {
      if (!mountedRef.current || !sessionActiveRef.current) return;
      const pitch = acceptedDetectionToMusicalPitch(detection);
      setHistory((current) =>
        appendPitchHistory(
          current,
          {
            timestampMs: detection.timestampMs,
            pitch,
            confidence: detection.confidence,
          },
          validDurationMs,
        ),
      );
    },
    [validDurationMs],
  );

  const clear = useCallback(() => {
    if (mountedRef.current) setHistory(clearPitchHistory());
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionActiveRef.current = false;
    };
  }, []);

  const summary = useMemo(() => summarizePitchHistory(history), [history]);
  return {
    history,
    summary,
    durationMs: validDurationMs,
    startSession,
    stopSession,
    onDetection,
    clear,
  };
}
