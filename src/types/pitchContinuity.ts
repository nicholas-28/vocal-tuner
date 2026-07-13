import type { RawPitchDetection, PitchRejectionReason } from './pitch';

export type PitchContinuityStatus = 'unvoiced' | 'voiced' | 'uncertain';

export type PitchContinuityFailureReason =
  | Exclude<PitchRejectionReason, 'detected'>
  | 'invalid-frame'
  | 'timestamp-regression'
  | 'microphone-ended'
  | 'continuity-timeout';

export type PitchContinuityConfig = {
  gracePeriodMs: number;
};

export type PitchContinuityStatistics = {
  totalDetectorPublications: number;
  rawAcceptedFrames: number;
  rawRejectedFrames: number;
  stabilizedPitchPublications: number;
  briefUncertainties: number;
  uncertaintiesRecovered: number;
  confirmedGaps: number;
  totalUncertaintyDurationMs: number;
  maximumUncertaintyDurationMs: number;
  rejectionCounts: Readonly<Record<PitchContinuityFailureReason, number>>;
};

type PitchContinuityCommonState = {
  lastPublicationAtMs: number | null;
  lastDecisionKind: PitchContinuityDecision['kind'] | null;
  lastRawRejectionReason: PitchRejectionReason | null;
  lastGapReason: PitchContinuityFailureReason | null;
  previousAcceptedFrequencyHz: number | null;
  rawCandidateMidi: number | null;
  candidateDistanceSemitones: number | null;
  consecutiveAcceptedCount: number;
  consecutiveRejectedCount: number;
  statistics: PitchContinuityStatistics;
};

export type PitchContinuityState =
  | (PitchContinuityCommonState & {
      status: 'unvoiced';
      lastAcceptedPitch: null;
      lastAcceptedAtMs: null;
      uncertainSinceMs: null;
    })
  | (PitchContinuityCommonState & {
      status: 'voiced';
      lastAcceptedPitch: RawPitchDetection;
      lastAcceptedAtMs: number;
      uncertainSinceMs: null;
    })
  | (PitchContinuityCommonState & {
      status: 'uncertain';
      lastAcceptedPitch: RawPitchDetection;
      lastAcceptedAtMs: number;
      uncertainSinceMs: number;
      lastRejectionReason: PitchContinuityFailureReason;
    });

export type PitchContinuityDecision =
  | {
      kind: 'pitch';
      detection: RawPitchDetection;
      source: 'raw';
      gapBeforeTimestampMs: number | null;
      gapReason: PitchContinuityFailureReason | null;
    }
  | {
      kind: 'hold';
      reason: PitchContinuityFailureReason;
      durationMs: number;
    }
  | {
      kind: 'gap';
      reason: PitchContinuityFailureReason;
      timestampMs: number;
    }
  | {
      kind: 'no-change';
      reason: PitchContinuityFailureReason;
    };

export type PitchContinuityTransition = {
  state: PitchContinuityState;
  decision: PitchContinuityDecision;
};
