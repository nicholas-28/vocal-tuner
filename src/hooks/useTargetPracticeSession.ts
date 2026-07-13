import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createIdlePracticeSession,
  createPracticeObservation,
  derivePracticeControls,
  finishPracticeSession,
  pausePracticeSession,
  previewPracticeSession,
  processPracticeObservation,
  resetPracticeSession,
  resumePracticeSession,
  startPracticeSession,
} from '../practice/practiceSession';
import { PRACTICE_DISPLAY_TICK_MS } from '../practice/practiceSessionConfig';
import {
  calculateTargetRelativeCents,
  createTargetNote,
} from '../target/targetPitchComparison';
import type { MusicalPitch } from '../types/musicalPitch';
import type {
  PracticeObservation,
  PracticeSessionState,
} from '../types/practiceSession';
import type { PitchContinuityStatus } from '../types/pitchContinuity';

type UseTargetPracticeSessionInput = {
  selectedMidi: number | null;
  microphoneActive: boolean;
  detectedPitch: MusicalPitch | null;
  continuityStatus: PitchContinuityStatus;
  observationTimestampMs: number | null;
};

const monotonicNow = () => performance.now();

export function useTargetPracticeSession(
  input: UseTargetPracticeSessionInput,
  now: () => number = monotonicNow,
) {
  const [state, setState] = useState<PracticeSessionState>(
    createIdlePracticeSession,
  );
  const stateRef = useRef(state);
  const nextSessionIdRef = useRef(1);
  const [displayTimestampMs, setDisplayTimestampMs] = useState(0);
  const selectedTarget = useMemo(
    () =>
      input.selectedMidi === null ? null : createTargetNote(input.selectedMidi),
    [input.selectedMidi],
  );

  const publish = useCallback(
    (transition: (current: PracticeSessionState) => PracticeSessionState) => {
      const next = transition(stateRef.current);
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
    },
    [],
  );

  const start = useCallback(() => {
    if (!input.microphoneActive || selectedTarget === null) return;
    const wasIdle = stateRef.current.status === 'idle';
    const sessionId = nextSessionIdRef.current;
    publish((current) =>
      startPracticeSession(current, selectedTarget, now(), sessionId),
    );
    if (wasIdle && stateRef.current.status === 'running')
      nextSessionIdRef.current = sessionId + 1;
  }, [input.microphoneActive, now, publish, selectedTarget]);

  const pause = useCallback(() => {
    publish((current) => pausePracticeSession(current, now(), 'manual'));
  }, [now, publish]);

  const resume = useCallback(() => {
    publish((current) =>
      resumePracticeSession(current, now(), input.microphoneActive),
    );
  }, [input.microphoneActive, now, publish]);

  const finish = useCallback(() => {
    publish((current) => finishPracticeSession(current, now()));
  }, [now, publish]);

  const reset = useCallback(() => {
    publish(resetPracticeSession);
  }, [publish]);

  useEffect(() => {
    if (input.microphoneActive) return;
    publish((current) =>
      pausePracticeSession(current, now(), 'microphone-stopped'),
    );
  }, [input.microphoneActive, now, publish]);

  useEffect(() => {
    if (
      !input.microphoneActive ||
      input.observationTimestampMs === null ||
      stateRef.current.status !== 'running'
    )
      return;
    const observation = deriveObservation(
      stateRef.current.session.target.midiNote,
      input.detectedPitch,
      input.continuityStatus,
    );
    if (observation === null) return;
    publish((current) =>
      processPracticeObservation(
        current,
        observation,
        input.observationTimestampMs as number,
      ),
    );
  }, [
    input.continuityStatus,
    input.detectedPitch,
    input.microphoneActive,
    input.observationTimestampMs,
    publish,
  ]);

  const runningSessionId =
    state.status === 'running' ? state.session.sessionId : null;
  useEffect(() => {
    if (runningSessionId === null) return;
    const sessionId = runningSessionId;
    setDisplayTimestampMs(now());
    const timer = window.setInterval(() => {
      if (
        stateRef.current.status === 'running' &&
        stateRef.current.session.sessionId === sessionId
      )
        setDisplayTimestampMs(now());
    }, PRACTICE_DISPLAY_TICK_MS);
    return () => window.clearInterval(timer);
  }, [now, runningSessionId]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const controls = derivePracticeControls(
    state,
    selectedTarget !== null,
    input.microphoneActive,
  );
  const displaySession = previewPracticeSession(state, displayTimestampMs);
  return {
    state,
    displaySession,
    selectedTarget,
    microphoneActive: input.microphoneActive,
    controls,
    targetSelectionLocked:
      state.status === 'running' || state.status === 'paused',
    start,
    pause,
    resume,
    finish,
    reset,
  };
}

export type TargetPracticeSessionModel = ReturnType<
  typeof useTargetPracticeSession
>;

function deriveObservation(
  lockedTargetMidi: number,
  detectedPitch: MusicalPitch | null,
  continuityStatus: PitchContinuityStatus,
): PracticeObservation | null {
  if (continuityStatus === 'uncertain') return { kind: 'uncertain' };
  if (continuityStatus === 'unvoiced') return { kind: 'no-pitch' };
  if (detectedPitch === null) return null;
  const targetRelativeCents = calculateTargetRelativeCents(
    detectedPitch.fractionalMidi,
    lockedTargetMidi,
  );
  return targetRelativeCents === null
    ? null
    : createPracticeObservation(targetRelativeCents);
}
