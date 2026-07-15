import type {
  PracticeTimelineEvent,
  PracticeTimelineEventType,
  PracticeTimelineSegment,
} from '../types/practiceTimeline';

const TIMELINE_LABELS: Readonly<Record<PracticeTimelineEventType, string>> = {
  'on-target': 'On target',
  'off-target': 'Off target',
  uncertain: 'Uncertain',
  'no-pitch': 'No pitch',
  unobserved: 'Unobserved',
  paused: 'Paused',
};

export function createPracticeTimeline(
  events: readonly PracticeTimelineEvent[],
  sessionStartTimestamp: number,
  sessionEndTimestamp: number,
): readonly PracticeTimelineSegment[] {
  const totalDurationMs = sessionEndTimestamp - sessionStartTimestamp;
  if (!Number.isFinite(totalDurationMs) || totalDurationMs <= 0) return [];

  return Object.freeze(
    events.flatMap((event) => {
      const durationMs = event.endTimestamp - event.startTimestamp;
      if (
        !Number.isFinite(event.startTimestamp) ||
        !Number.isFinite(event.endTimestamp) ||
        durationMs <= 0
      )
        return [];
      return [
        Object.freeze({
          event,
          durationMs,
          percentage: (durationMs / totalDurationMs) * 100,
          startPercentage:
            ((event.startTimestamp - sessionStartTimestamp) / totalDurationMs) *
            100,
        }),
      ];
    }),
  );
}

export function formatPracticeTimelinePercentage(percentage: number): string {
  if (!Number.isFinite(percentage) || percentage < 0) return 'Unavailable';
  return `${Math.round(percentage)}%`;
}

export function getPracticeTimelineLabel(
  type: PracticeTimelineEventType,
): string {
  return TIMELINE_LABELS[type];
}

export function getPracticeTimelineSegmentStyle(
  segment: PracticeTimelineSegment,
) {
  return Object.freeze({
    left: `${segment.startPercentage}%`,
    width: `max(1px, ${segment.percentage}%)`,
  });
}
