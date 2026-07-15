export type PracticeTimelineEventType =
  | 'on-target'
  | 'off-target'
  | 'uncertain'
  | 'no-pitch'
  | 'unobserved'
  | 'paused';

export type PracticeTimelineEvent = Readonly<{
  startTimestamp: number;
  endTimestamp: number;
  type: PracticeTimelineEventType;
}>;

export type PracticeTimelineSegment = Readonly<{
  event: PracticeTimelineEvent;
  durationMs: number;
  percentage: number;
  startPercentage: number;
}>;
