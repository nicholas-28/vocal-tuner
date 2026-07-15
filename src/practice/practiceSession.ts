import { classifyTargetDirection } from '../target/targetPitchComparison';
import type {
  ActivePracticeSession,
  PracticeControlAvailability,
  PracticeMetrics,
  PracticeObservation,
  PracticePauseReason,
  PracticeSessionState,
  PracticeSessionSummary,
  PracticeTarget,
} from '../types/practiceSession';
import type {
  PracticeTimelineEvent,
  PracticeTimelineEventType,
} from '../types/practiceTimeline';
import { MAX_ACCOUNTABLE_PRACTICE_INTERVAL_MS } from './practiceSessionConfig';

const EMPTY_METRICS: PracticeMetrics = {
  activeElapsedMs: 0,
  measurableVoicedMs: 0,
  onTargetMs: 0,
  offTargetMs: 0,
  uncertainMs: 0,
  noPitchMs: 0,
  unobservedMs: 0,
  pauseCount: 0,
};

export function createIdlePracticeSession(): PracticeSessionState {
  return { status: 'idle' };
}

export function createPracticeObservation(
  targetRelativeCents: number,
): PracticeObservation | null {
  const direction = classifyTargetDirection(targetRelativeCents);
  if (direction === null) return null;
  return {
    kind: direction === 'on-target' ? 'on-target' : 'off-target',
    targetRelativeCents,
  };
}

export function startPracticeSession(
  state: PracticeSessionState,
  target: PracticeTarget,
  timestampMs: number,
  sessionId: number,
): PracticeSessionState {
  if (
    state.status !== 'idle' ||
    !isValidPracticeTarget(target) ||
    !isValidTimestamp(timestampMs) ||
    !Number.isInteger(sessionId) ||
    sessionId < 1
  )
    return state;
  return {
    status: 'running',
    session: {
      ...EMPTY_METRICS,
      sessionId,
      target: { ...target },
      startedAtMs: timestampMs,
      lastProcessedAtMs: timestampMs,
      currentObservation: { kind: 'unobserved' },
      observationStartedAtMs: timestampMs,
      timelineEvents: Object.freeze([]),
    },
  };
}

export function processPracticeObservation(
  state: PracticeSessionState,
  observation: PracticeObservation,
  timestampMs: number,
): PracticeSessionState {
  if (
    state.status !== 'running' ||
    !isValidPracticeObservation(observation) ||
    !isForwardTimestamp(state.session.lastProcessedAtMs, timestampMs)
  )
    return state;
  const settled = settlePracticeSession(state.session, timestampMs);
  return {
    status: 'running',
    session: {
      ...settled,
      currentObservation: observation,
      observationStartedAtMs: timestampMs,
    },
  };
}

export function pausePracticeSession(
  state: PracticeSessionState,
  timestampMs: number,
  reason: PracticePauseReason = 'manual',
): PracticeSessionState {
  if (
    state.status !== 'running' ||
    !isForwardOrEqualTimestamp(state.session.lastProcessedAtMs, timestampMs)
  )
    return state;
  const settled = settlePracticeSession(state.session, timestampMs);
  return {
    status: 'paused',
    paused: {
      session: { ...settled, pauseCount: settled.pauseCount + 1 },
      pausedAtMs: timestampMs,
      reason,
    },
  };
}

export function resumePracticeSession(
  state: PracticeSessionState,
  timestampMs: number,
  microphoneActive: boolean,
): PracticeSessionState {
  if (
    state.status !== 'paused' ||
    !microphoneActive ||
    !isForwardOrEqualTimestamp(state.paused.pausedAtMs, timestampMs)
  )
    return state;
  return {
    status: 'running',
    session: {
      ...appendTimelineEvent(
        state.paused.session,
        state.paused.pausedAtMs,
        timestampMs,
        'paused',
      ),
      lastProcessedAtMs: timestampMs,
      currentObservation: { kind: 'unobserved' },
      observationStartedAtMs: timestampMs,
    },
  };
}

export function finishPracticeSession(
  state: PracticeSessionState,
  timestampMs: number,
): PracticeSessionState {
  if (state.status === 'running') {
    if (
      !isForwardOrEqualTimestamp(state.session.lastProcessedAtMs, timestampMs)
    )
      return state;
    return {
      status: 'completed',
      summary: createSummary(
        settlePracticeSession(state.session, timestampMs),
        timestampMs,
      ),
    };
  }
  if (
    state.status === 'paused' &&
    isForwardOrEqualTimestamp(state.paused.pausedAtMs, timestampMs)
  ) {
    const session = appendTimelineEvent(
      state.paused.session,
      state.paused.pausedAtMs,
      timestampMs,
      'paused',
    );
    return {
      status: 'completed',
      summary: createSummary(session, timestampMs),
    };
  }
  return state;
}

export function resetPracticeSession(
  state: PracticeSessionState,
): PracticeSessionState {
  return state.status === 'completed' ? createIdlePracticeSession() : state;
}

export function previewPracticeSession(
  state: PracticeSessionState,
  timestampMs: number,
): ActivePracticeSession | null {
  if (state.status === 'running') {
    return isForwardOrEqualTimestamp(
      state.session.lastProcessedAtMs,
      timestampMs,
    )
      ? settlePracticeSession(state.session, timestampMs, false)
      : state.session;
  }
  if (state.status === 'paused') return state.paused.session;
  return null;
}

export function calculateOnTargetShare(
  onTargetMs: number,
  measurableVoicedMs: number,
): number | null {
  if (
    !isValidDuration(onTargetMs) ||
    !isValidDuration(measurableVoicedMs) ||
    measurableVoicedMs === 0
  )
    return null;
  return Math.min(1, Math.max(0, onTargetMs / measurableVoicedMs));
}

export function derivePracticeControls(
  state: PracticeSessionState,
  hasValidTarget: boolean,
  microphoneActive: boolean,
): PracticeControlAvailability {
  return {
    canStart: state.status === 'idle' && hasValidTarget && microphoneActive,
    canPause: state.status === 'running',
    canResume: state.status === 'paused' && microphoneActive,
    canFinish: state.status === 'running' || state.status === 'paused',
    canReset: state.status === 'completed',
  };
}

export function practiceMetricsAreCoherent(metrics: PracticeMetrics): boolean {
  const values = [
    metrics.activeElapsedMs,
    metrics.measurableVoicedMs,
    metrics.onTargetMs,
    metrics.offTargetMs,
    metrics.uncertainMs,
    metrics.noPitchMs,
    metrics.unobservedMs,
    metrics.pauseCount,
  ];
  if (values.some((value) => !isValidDuration(value))) return false;
  const tolerance = 1e-6;
  return (
    Math.abs(
      metrics.measurableVoicedMs - (metrics.onTargetMs + metrics.offTargetMs),
    ) <= tolerance &&
    Math.abs(
      metrics.activeElapsedMs -
        (metrics.measurableVoicedMs +
          metrics.uncertainMs +
          metrics.noPitchMs +
          metrics.unobservedMs),
    ) <= tolerance
  );
}

function settlePracticeSession(
  session: ActivePracticeSession,
  timestampMs: number,
  recordTimeline = true,
): ActivePracticeSession {
  const deltaMs = timestampMs - session.lastProcessedAtMs;
  if (deltaMs <= 0) return session;
  const evidenceEndMs =
    session.currentObservation.kind === 'unobserved'
      ? session.lastProcessedAtMs
      : session.observationStartedAtMs + MAX_ACCOUNTABLE_PRACTICE_INTERVAL_MS;
  const observableMs = Math.max(
    0,
    Math.min(timestampMs, evidenceEndMs) - session.lastProcessedAtMs,
  );
  const unobservedMs = deltaMs - observableMs;
  const observedEndMs = session.lastProcessedAtMs + observableMs;
  const withObservedEvent = recordTimeline
    ? appendTimelineEvent(
        session,
        session.lastProcessedAtMs,
        observedEndMs,
        session.currentObservation.kind,
      )
    : session;
  const withTimeline = recordTimeline
    ? appendTimelineEvent(
        withObservedEvent,
        observedEndMs,
        timestampMs,
        'unobserved',
      )
    : withObservedEvent;
  const metrics = addObservationDuration(withTimeline, observableMs);
  return {
    ...withTimeline,
    ...metrics,
    activeElapsedMs: session.activeElapsedMs + deltaMs,
    unobservedMs: metrics.unobservedMs + unobservedMs,
    lastProcessedAtMs: timestampMs,
  };
}

function addObservationDuration(
  session: ActivePracticeSession,
  durationMs: number,
): PracticeMetrics {
  if (durationMs <= 0) return session;
  switch (session.currentObservation.kind) {
    case 'on-target':
      return {
        ...session,
        measurableVoicedMs: session.measurableVoicedMs + durationMs,
        onTargetMs: session.onTargetMs + durationMs,
      };
    case 'off-target':
      return {
        ...session,
        measurableVoicedMs: session.measurableVoicedMs + durationMs,
        offTargetMs: session.offTargetMs + durationMs,
      };
    case 'uncertain':
      return {
        ...session,
        uncertainMs: session.uncertainMs + durationMs,
      };
    case 'no-pitch':
      return { ...session, noPitchMs: session.noPitchMs + durationMs };
    default:
      return session;
  }
}

function createSummary(
  session: ActivePracticeSession,
  completedAtMs: number,
): PracticeSessionSummary {
  const timelineEvents = Object.freeze(
    session.timelineEvents.map((event) => Object.freeze({ ...event })),
  );
  return Object.freeze({
    sessionId: session.sessionId,
    target: Object.freeze({ ...session.target }),
    startedAtMs: session.startedAtMs,
    completedAtMs,
    wallElapsedMs: completedAtMs - session.startedAtMs,
    activeElapsedMs: session.activeElapsedMs,
    measurableVoicedMs: session.measurableVoicedMs,
    onTargetMs: session.onTargetMs,
    offTargetMs: session.offTargetMs,
    uncertainMs: session.uncertainMs,
    noPitchMs: session.noPitchMs,
    unobservedMs: session.unobservedMs,
    pauseCount: session.pauseCount,
    onTargetShare: calculateOnTargetShare(
      session.onTargetMs,
      session.measurableVoicedMs,
    ),
    timelineEvents,
  });
}

function appendTimelineEvent(
  session: ActivePracticeSession,
  startTimestamp: number,
  endTimestamp: number,
  type: PracticeTimelineEventType,
): ActivePracticeSession {
  if (endTimestamp <= startTimestamp) return session;
  const event: PracticeTimelineEvent = Object.freeze({
    startTimestamp,
    endTimestamp,
    type,
  });
  return {
    ...session,
    timelineEvents: Object.freeze([...session.timelineEvents, event]),
  };
}

function isValidPracticeTarget(target: PracticeTarget): boolean {
  return (
    Number.isInteger(target.midiNote) &&
    target.label.length > 0 &&
    Number.isFinite(target.frequencyHz) &&
    target.frequencyHz > 0
  );
}

function isValidPracticeObservation(observation: PracticeObservation): boolean {
  return (
    (observation.kind !== 'on-target' && observation.kind !== 'off-target') ||
    Number.isFinite(observation.targetRelativeCents)
  );
}

function isValidTimestamp(timestampMs: number): boolean {
  return Number.isFinite(timestampMs) && timestampMs >= 0;
}

function isForwardTimestamp(previousMs: number, timestampMs: number): boolean {
  return isValidTimestamp(timestampMs) && timestampMs > previousMs;
}

function isForwardOrEqualTimestamp(
  previousMs: number,
  timestampMs: number,
): boolean {
  return isValidTimestamp(timestampMs) && timestampMs >= previousMs;
}

function isValidDuration(durationMs: number): boolean {
  return Number.isFinite(durationMs) && durationMs >= 0;
}
