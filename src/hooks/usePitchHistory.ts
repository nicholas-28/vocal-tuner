import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appendPitchHistory,
  clearPitchHistory,
  createPitchHistory,
  summarizePitchHistory,
} from '../history/pitchHistory';
import {
  consumeResumeBoundary,
  createRecordingCaptureState,
  isHistoryIngestionAllowed,
  pausePitchHistoryCapture,
  resumePitchHistoryCapture,
  sourceToEffectiveHistoryTimestamp,
} from '../history/pitchHistoryCapture';
import {
  DEFAULT_HISTORY_DURATION_MS,
  isValidHistoryDuration,
} from '../history/pitchHistoryConfig';
import type { RawPitchDetection } from '../types/pitch';
import type { PitchContinuityDecision } from '../types/pitchContinuity';
import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';
import { acceptedDetectionToMusicalPitch } from './useMusicalPitch';

export function usePitchHistory(
  durationMs = DEFAULT_HISTORY_DURATION_MS,
  now: () => number = () => performance.now(),
) {
  const validDurationMs = isValidHistoryDuration(durationMs)
    ? durationMs
    : DEFAULT_HISTORY_DURATION_MS;
  const [history, setHistory] = useState(createPitchHistory);
  const historyRef = useRef(history);
  const [captureState, setCaptureState] = useState<PitchHistoryCaptureState>(
    createRecordingCaptureState,
  );
  const captureStateRef = useRef(captureState);
  const [sessionVersion, setSessionVersion] = useState(0);
  const sessionVersionRef = useRef(0);
  const sessionActiveRef = useRef(false);
  const mountedRef = useRef(true);

  const startSession = useCallback(() => {
    const emptyHistory = createPitchHistory();
    const nextCaptureState = createRecordingCaptureState();
    sessionActiveRef.current = true;
    historyRef.current = emptyHistory;
    captureStateRef.current = nextCaptureState;
    sessionVersionRef.current += 1;
    if (mountedRef.current) {
      setHistory(emptyHistory);
      setCaptureState(nextCaptureState);
      setSessionVersion(sessionVersionRef.current);
    }
  }, []);

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    const nextCaptureState = createRecordingCaptureState();
    captureStateRef.current = nextCaptureState;
    if (mountedRef.current) setCaptureState(nextCaptureState);
  }, []);

  const pause = useCallback(() => {
    if (!mountedRef.current || !sessionActiveRef.current) return;
    const next = pausePitchHistoryCapture(captureStateRef.current, now());
    if (next === captureStateRef.current) return;
    captureStateRef.current = next;
    setCaptureState(next);
  }, [now]);

  const resume = useCallback(() => {
    if (!mountedRef.current || !sessionActiveRef.current) return;
    const next = resumePitchHistoryCapture(captureStateRef.current, now());
    if (next === captureStateRef.current) return;
    captureStateRef.current = next;
    setCaptureState(next);
  }, [now]);

  const onDetection = useCallback(
    (detection: RawPitchDetection) => {
      const currentCaptureState = captureStateRef.current;
      if (
        !mountedRef.current ||
        !sessionActiveRef.current ||
        !isHistoryIngestionAllowed(currentCaptureState)
      )
        return;
      const effectiveTimestampMs = sourceToEffectiveHistoryTimestamp(
        currentCaptureState,
        detection.timestampMs,
      );
      if (effectiveTimestampMs === null) return;

      const pitch = acceptedDetectionToMusicalPitch(detection);
      let nextHistory = historyRef.current;
      const latestTimestampMs = nextHistory.points.at(-1)?.timestampMs ?? null;
      if (
        latestTimestampMs !== null &&
        effectiveTimestampMs <= latestTimestampMs
      )
        return;

      if (
        currentCaptureState.resumeBoundaryEffectiveMs !== null &&
        nextHistory.points.length > 0 &&
        pitch !== null
      ) {
        let boundaryTimestampMs = currentCaptureState.resumeBoundaryEffectiveMs;
        if (
          latestTimestampMs !== null &&
          (boundaryTimestampMs <= latestTimestampMs ||
            boundaryTimestampMs >= effectiveTimestampMs)
        ) {
          boundaryTimestampMs =
            latestTimestampMs + (effectiveTimestampMs - latestTimestampMs) / 2;
        }
        nextHistory = appendPitchHistory(
          nextHistory,
          {
            timestampMs: boundaryTimestampMs,
            pitch: null,
            confidence: 0,
          },
          validDurationMs,
        );
      }

      nextHistory = appendPitchHistory(
        nextHistory,
        {
          timestampMs: effectiveTimestampMs,
          pitch,
          confidence: detection.confidence,
        },
        validDurationMs,
      );
      historyRef.current = nextHistory;
      setHistory(nextHistory);

      const nextCaptureState = consumeResumeBoundary(currentCaptureState);
      if (nextCaptureState !== currentCaptureState) {
        captureStateRef.current = nextCaptureState;
        setCaptureState(nextCaptureState);
      }
    },
    [validDurationMs],
  );

  const onContinuityDecision = useCallback(
    (decision: PitchContinuityDecision) => {
      if (decision.kind === 'hold' || decision.kind === 'no-change') return;
      const currentCaptureState = captureStateRef.current;
      if (
        !mountedRef.current ||
        !sessionActiveRef.current ||
        !isHistoryIngestionAllowed(currentCaptureState)
      )
        return;

      const sourceTimestampMs =
        decision.kind === 'gap'
          ? decision.timestampMs
          : decision.detection.timestampMs;
      const effectiveTimestampMs = sourceToEffectiveHistoryTimestamp(
        currentCaptureState,
        sourceTimestampMs,
      );
      if (effectiveTimestampMs === null) return;

      let nextHistory = historyRef.current;
      let latestTimestampMs = nextHistory.points.at(-1)?.timestampMs ?? null;
      const appendGap = (timestampMs: number) => {
        if (latestTimestampMs !== null && timestampMs <= latestTimestampMs)
          return;
        nextHistory = appendPitchHistory(
          nextHistory,
          { timestampMs, pitch: null, confidence: 0 },
          validDurationMs,
        );
        latestTimestampMs = timestampMs;
      };

      if (decision.kind === 'gap') {
        appendGap(effectiveTimestampMs);
      } else {
        if (currentCaptureState.resumeBoundaryEffectiveMs !== null) {
          let boundary = currentCaptureState.resumeBoundaryEffectiveMs;
          if (
            latestTimestampMs !== null &&
            (boundary <= latestTimestampMs || boundary >= effectiveTimestampMs)
          )
            boundary =
              latestTimestampMs +
              (effectiveTimestampMs - latestTimestampMs) / 2;
          appendGap(boundary);
        }
        if (decision.gapBeforeTimestampMs !== null) {
          const gapTimestamp = sourceToEffectiveHistoryTimestamp(
            currentCaptureState,
            decision.gapBeforeTimestampMs,
          );
          if (gapTimestamp !== null) appendGap(gapTimestamp);
        }
        if (
          latestTimestampMs === null ||
          effectiveTimestampMs > latestTimestampMs
        ) {
          nextHistory = appendPitchHistory(
            nextHistory,
            {
              timestampMs: effectiveTimestampMs,
              pitch: acceptedDetectionToMusicalPitch(decision.detection),
              confidence: decision.detection.confidence,
            },
            validDurationMs,
          );
        }
      }

      historyRef.current = nextHistory;
      setHistory(nextHistory);
      const nextCaptureState = consumeResumeBoundary(currentCaptureState);
      if (nextCaptureState !== currentCaptureState) {
        captureStateRef.current = nextCaptureState;
        setCaptureState(nextCaptureState);
      }
    },
    [validDurationMs],
  );

  const clear = useCallback(() => {
    if (!mountedRef.current) return;
    const emptyHistory = clearPitchHistory();
    historyRef.current = emptyHistory;
    setHistory(emptyHistory);
  }, []);

  const toEffectiveTimestamp = useCallback((sourceTimestampMs: number) => {
    return sourceToEffectiveHistoryTimestamp(
      captureStateRef.current,
      sourceTimestampMs,
    );
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
    captureState,
    sessionVersion,
    durationMs: validDurationMs,
    startSession,
    stopSession,
    pause,
    resume,
    onDetection,
    onContinuityDecision,
    clear,
    toEffectiveTimestamp,
  };
}
