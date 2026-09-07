import type { TargetNote } from './targetPitch';
import type { PracticeTimelineEvent } from './practiceTimeline';

export type PracticeTarget = Readonly<TargetNote>;

export type PracticeObservation =
  | Readonly<{
      kind: 'on-target' | 'off-target';
      targetRelativeCents: number;
    }>
  | Readonly<{ kind: 'uncertain' | 'no-pitch' | 'unobserved' }>;

export type PracticeMetrics = Readonly<{
  activeElapsedMs: number;
  measurableVoicedMs: number;
  onTargetMs: number;
  offTargetMs: number;
  uncertainMs: number;
  noPitchMs: number;
  unobservedMs: number;
  pauseCount: number;
  /** Time-weighted raw target cents, independent of band occupancy. */
  pitchMeanCents: number;
  /** Sum of squared deviations from the running mean, weighted in ms. */
  pitchM2CentsSquaredMs: number;
}>;

export type ActivePracticeSession = PracticeMetrics &
  Readonly<{
    sessionId: number;
    target: PracticeTarget;
    startedAtMs: number;
    lastProcessedAtMs: number;
    currentObservation: PracticeObservation;
    observationStartedAtMs: number;
    timelineEvents: readonly PracticeTimelineEvent[];
  }>;

export type PracticePauseReason = 'manual' | 'microphone-stopped';

export type PausedPracticeSession = Readonly<{
  session: ActivePracticeSession;
  pausedAtMs: number;
  reason: PracticePauseReason;
}>;

export type PracticeSessionSummary = PracticeMetrics &
  Readonly<{
    sessionId: number;
    target: PracticeTarget;
    startedAtMs: number;
    completedAtMs: number;
    wallElapsedMs: number;
    onTargetShare: number | null;
    timelineEvents: readonly PracticeTimelineEvent[];
  }>;

export type PracticeSessionState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'running'; session: ActivePracticeSession }>
  | Readonly<{ status: 'paused'; paused: PausedPracticeSession }>
  | Readonly<{ status: 'completed'; summary: PracticeSessionSummary }>;

export type PracticeControlAvailability = Readonly<{
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canFinish: boolean;
  canReset: boolean;
}>;
