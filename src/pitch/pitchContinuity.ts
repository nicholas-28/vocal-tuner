import { frequencyToFractionalMidi } from '../music/frequencyToMidi';
import { DEFAULT_TUNING_A4_HZ } from '../music/tuning';
import type { PitchRejectionReason, RawPitchDetection } from '../types/pitch';
import type {
  PitchContinuityConfig,
  PitchContinuityDecision,
  PitchContinuityFailureReason,
  PitchContinuityState,
  PitchContinuityStatistics,
  PitchContinuityTransition,
} from '../types/pitchContinuity';
import {
  DEFAULT_PITCH_CONTINUITY_CONFIG,
  isValidPitchContinuityConfig,
} from './pitchContinuityConfig';

const FAILURE_REASONS: readonly PitchContinuityFailureReason[] = [
  'silence',
  'no-candidate',
  'yin-threshold',
  'low-confidence',
  'invalid-frequency',
  'out-of-range',
  'detector-error',
  'invalid-frame',
  'timestamp-regression',
  'microphone-ended',
  'continuity-timeout',
];

export function createPitchContinuityStatistics(): PitchContinuityStatistics {
  return {
    totalDetectorPublications: 0,
    rawAcceptedFrames: 0,
    rawRejectedFrames: 0,
    stabilizedPitchPublications: 0,
    briefUncertainties: 0,
    uncertaintiesRecovered: 0,
    confirmedGaps: 0,
    totalUncertaintyDurationMs: 0,
    maximumUncertaintyDurationMs: 0,
    rejectionCounts: Object.fromEntries(
      FAILURE_REASONS.map((reason) => [reason, 0]),
    ) as Record<PitchContinuityFailureReason, number>,
  };
}

export function createPitchContinuityState(): PitchContinuityState {
  return {
    status: 'unvoiced',
    lastAcceptedPitch: null,
    lastAcceptedAtMs: null,
    uncertainSinceMs: null,
    lastPublicationAtMs: null,
    lastDecisionKind: null,
    lastRawRejectionReason: null,
    lastGapReason: null,
    previousAcceptedFrequencyHz: null,
    rawCandidateMidi: null,
    candidateDistanceSemitones: null,
    consecutiveAcceptedCount: 0,
    consecutiveRejectedCount: 0,
    statistics: createPitchContinuityStatistics(),
  };
}

export function transitionPitchContinuity(
  current: PitchContinuityState,
  detection: RawPitchDetection,
  requestedConfig: PitchContinuityConfig = DEFAULT_PITCH_CONTINUITY_CONFIG,
): PitchContinuityTransition {
  const config = isValidPitchContinuityConfig(requestedConfig)
    ? requestedConfig
    : DEFAULT_PITCH_CONTINUITY_CONFIG;
  const validTimestamp =
    Number.isFinite(detection.timestampMs) &&
    detection.timestampMs >= 0 &&
    (current.lastPublicationAtMs === null ||
      detection.timestampMs > current.lastPublicationAtMs);
  const accepted = isAcceptedDetection(detection);
  const rawFailureReason = accepted
    ? null
    : getFailureReason(detection.rejectionReason);
  let statistics = recordRawPublication(
    current.statistics,
    accepted,
    rawFailureReason,
  );

  if (!validTimestamp) {
    statistics = incrementRejection(statistics, 'timestamp-regression');
    return {
      state: {
        ...current,
        lastDecisionKind: 'no-change',
        lastRawRejectionReason: detection.rejectionReason,
        statistics,
      },
      decision: { kind: 'no-change', reason: 'timestamp-regression' },
    };
  }

  const rawCandidateMidi = getCandidateMidi(detection);
  const previousMidi = current.lastAcceptedPitch
    ? getAcceptedMidi(current.lastAcceptedPitch)
    : null;
  const candidateDistanceSemitones =
    rawCandidateMidi === null || previousMidi === null
      ? null
      : Math.abs(rawCandidateMidi - previousMidi);
  const common = {
    lastPublicationAtMs: detection.timestampMs,
    lastRawRejectionReason: accepted ? null : detection.rejectionReason,
    rawCandidateMidi,
    candidateDistanceSemitones,
    statistics,
  };

  if (current.status === 'unvoiced') {
    if (!accepted) {
      const reason = rawFailureReason ?? 'invalid-frame';
      return {
        state: {
          ...current,
          ...common,
          lastDecisionKind: 'no-change',
          consecutiveAcceptedCount: 0,
          consecutiveRejectedCount: current.consecutiveRejectedCount + 1,
        },
        decision: { kind: 'no-change', reason },
      };
    }
    statistics = incrementStatistic(statistics, 'stabilizedPitchPublications');
    const decision: PitchContinuityDecision = {
      kind: 'pitch',
      detection,
      source: 'raw',
      gapBeforeTimestampMs: null,
      gapReason: null,
    };
    return {
      state: {
        ...current,
        ...common,
        status: 'voiced',
        lastAcceptedPitch: detection,
        lastAcceptedAtMs: detection.timestampMs,
        uncertainSinceMs: null,
        lastDecisionKind: decision.kind,
        previousAcceptedFrequencyHz: detection.frequencyHz,
        consecutiveAcceptedCount: current.consecutiveAcceptedCount + 1,
        consecutiveRejectedCount: 0,
        statistics,
      },
      decision,
    };
  }

  if (current.status === 'voiced') {
    if (accepted) {
      statistics = incrementStatistic(
        statistics,
        'stabilizedPitchPublications',
      );
      const decision: PitchContinuityDecision = {
        kind: 'pitch',
        detection,
        source: 'raw',
        gapBeforeTimestampMs: null,
        gapReason: null,
      };
      return {
        state: {
          ...current,
          ...common,
          lastAcceptedPitch: detection,
          lastAcceptedAtMs: detection.timestampMs,
          lastDecisionKind: decision.kind,
          previousAcceptedFrequencyHz: detection.frequencyHz,
          consecutiveAcceptedCount: current.consecutiveAcceptedCount + 1,
          consecutiveRejectedCount: 0,
          statistics,
        },
        decision,
      };
    }
    const reason = rawFailureReason ?? 'invalid-frame';
    statistics = incrementStatistic(statistics, 'briefUncertainties');
    return {
      state: {
        ...current,
        ...common,
        status: 'uncertain',
        uncertainSinceMs: detection.timestampMs,
        lastRejectionReason: reason,
        lastDecisionKind: 'hold',
        consecutiveAcceptedCount: 0,
        consecutiveRejectedCount: 1,
        statistics,
      },
      decision: { kind: 'hold', reason, durationMs: 0 },
    };
  }

  const uncertaintyDurationMs =
    detection.timestampMs - current.uncertainSinceMs;
  statistics = {
    ...statistics,
    maximumUncertaintyDurationMs: Math.max(
      statistics.maximumUncertaintyDurationMs,
      uncertaintyDurationMs,
    ),
  };
  if (accepted && uncertaintyDurationMs <= config.gracePeriodMs) {
    statistics = incrementStatistic(statistics, 'uncertaintiesRecovered');
    statistics = incrementStatistic(statistics, 'stabilizedPitchPublications');
    statistics = addUncertaintyDuration(statistics, uncertaintyDurationMs);
    const decision: PitchContinuityDecision = {
      kind: 'pitch',
      detection,
      source: 'raw',
      gapBeforeTimestampMs: null,
      gapReason: null,
    };
    return {
      state: {
        ...current,
        ...common,
        status: 'voiced',
        lastAcceptedPitch: detection,
        lastAcceptedAtMs: detection.timestampMs,
        uncertainSinceMs: null,
        lastDecisionKind: decision.kind,
        previousAcceptedFrequencyHz: detection.frequencyHz,
        consecutiveAcceptedCount: 1,
        consecutiveRejectedCount: 0,
        statistics,
      },
      decision,
    };
  }

  if (accepted) {
    statistics = incrementStatistic(statistics, 'confirmedGaps');
    statistics = incrementStatistic(statistics, 'stabilizedPitchPublications');
    statistics = addUncertaintyDuration(statistics, uncertaintyDurationMs);
    const decision: PitchContinuityDecision = {
      kind: 'pitch',
      detection,
      source: 'raw',
      gapBeforeTimestampMs: current.uncertainSinceMs,
      gapReason: 'continuity-timeout',
    };
    return {
      state: {
        ...current,
        ...common,
        status: 'voiced',
        lastAcceptedPitch: detection,
        lastAcceptedAtMs: detection.timestampMs,
        uncertainSinceMs: null,
        lastDecisionKind: decision.kind,
        lastGapReason: 'continuity-timeout',
        previousAcceptedFrequencyHz: detection.frequencyHz,
        consecutiveAcceptedCount: 1,
        consecutiveRejectedCount: 0,
        statistics,
      },
      decision,
    };
  }

  const reason = rawFailureReason ?? current.lastRejectionReason;
  if (uncertaintyDurationMs <= config.gracePeriodMs) {
    return {
      state: {
        ...current,
        ...common,
        lastRejectionReason: reason,
        lastDecisionKind: 'hold',
        consecutiveAcceptedCount: 0,
        consecutiveRejectedCount: current.consecutiveRejectedCount + 1,
        statistics,
      },
      decision: {
        kind: 'hold',
        reason,
        durationMs: uncertaintyDurationMs,
      },
    };
  }

  statistics = incrementStatistic(statistics, 'confirmedGaps');
  statistics = incrementRejection(statistics, 'continuity-timeout');
  statistics = addUncertaintyDuration(statistics, uncertaintyDurationMs);
  return {
    state: {
      ...current,
      ...common,
      status: 'unvoiced',
      lastAcceptedPitch: null,
      lastAcceptedAtMs: null,
      uncertainSinceMs: null,
      lastDecisionKind: 'gap',
      lastGapReason: 'continuity-timeout',
      previousAcceptedFrequencyHz: current.lastAcceptedPitch.frequencyHz,
      consecutiveAcceptedCount: 0,
      consecutiveRejectedCount: current.consecutiveRejectedCount + 1,
      statistics,
    },
    decision: {
      kind: 'gap',
      reason: 'continuity-timeout',
      timestampMs: current.uncertainSinceMs,
    },
  };
}

function isAcceptedDetection(detection: RawPitchDetection): boolean {
  return (
    detection.rejectionReason === 'detected' &&
    typeof detection.frequencyHz === 'number' &&
    Number.isFinite(detection.frequencyHz) &&
    detection.frequencyHz > 0
  );
}

function getFailureReason(
  rejectionReason: PitchRejectionReason,
): PitchContinuityFailureReason | null {
  return rejectionReason === 'detected' ? 'invalid-frame' : rejectionReason;
}

function getCandidateMidi(detection: RawPitchDetection): number | null {
  return detection.rawCandidateFrequencyHz === null
    ? null
    : frequencyToFractionalMidi(
        detection.rawCandidateFrequencyHz,
        DEFAULT_TUNING_A4_HZ,
      );
}

function getAcceptedMidi(detection: RawPitchDetection): number | null {
  return detection.frequencyHz === null
    ? null
    : frequencyToFractionalMidi(detection.frequencyHz, DEFAULT_TUNING_A4_HZ);
}

function recordRawPublication(
  statistics: PitchContinuityStatistics,
  accepted: boolean,
  failureReason: PitchContinuityFailureReason | null,
): PitchContinuityStatistics {
  let next = {
    ...statistics,
    totalDetectorPublications: statistics.totalDetectorPublications + 1,
    rawAcceptedFrames: statistics.rawAcceptedFrames + (accepted ? 1 : 0),
    rawRejectedFrames: statistics.rawRejectedFrames + (accepted ? 0 : 1),
  };
  if (!accepted && failureReason)
    next = incrementRejection(next, failureReason);
  return next;
}

function incrementStatistic(
  statistics: PitchContinuityStatistics,
  key:
    | 'stabilizedPitchPublications'
    | 'briefUncertainties'
    | 'uncertaintiesRecovered'
    | 'confirmedGaps',
): PitchContinuityStatistics {
  return { ...statistics, [key]: statistics[key] + 1 };
}

function incrementRejection(
  statistics: PitchContinuityStatistics,
  reason: PitchContinuityFailureReason,
): PitchContinuityStatistics {
  return {
    ...statistics,
    rejectionCounts: {
      ...statistics.rejectionCounts,
      [reason]: statistics.rejectionCounts[reason] + 1,
    },
  };
}

function addUncertaintyDuration(
  statistics: PitchContinuityStatistics,
  durationMs: number,
): PitchContinuityStatistics {
  return {
    ...statistics,
    totalUncertaintyDurationMs:
      statistics.totalUncertaintyDurationMs + durationMs,
    maximumUncertaintyDurationMs: Math.max(
      statistics.maximumUncertaintyDurationMs,
      durationMs,
    ),
  };
}
