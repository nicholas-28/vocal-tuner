export type PitchHistoryPoint = Readonly<{
  timestampMs: number;
  midi: number | null;
  frequencyHz: number | null;
  confidence: number;
  kind: 'pitch' | 'gap';
}>;

export type PitchHistory = Readonly<{
  points: readonly PitchHistoryPoint[];
}>;

export type PitchHistorySummary = {
  totalPoints: number;
  pitchPoints: number;
  gapPoints: number;
  retainedDurationMs: number;
  oldestTimestampMs: number | null;
  newestTimestampMs: number | null;
  latestKind: PitchHistoryPoint['kind'] | null;
};
