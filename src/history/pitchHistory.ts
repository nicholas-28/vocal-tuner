import type { MusicalPitch } from '../types/musicalPitch';
import type {
  PitchHistory,
  PitchHistoryPoint,
  PitchHistorySummary,
} from '../types/pitchHistory';
import {
  DEFAULT_HISTORY_DURATION_MS,
  MEANINGFUL_PITCH_CHANGE_MIDI,
  MINIMUM_HISTORY_INTERVAL_MS,
  isValidHistoryDuration,
} from './pitchHistoryConfig';

export type PitchHistoryInput = {
  timestampMs: number;
  pitch: MusicalPitch | null;
  confidence: number;
};

export function createPitchHistory(): PitchHistory {
  return { points: [] };
}

export function appendPitchHistory(
  history: PitchHistory,
  input: PitchHistoryInput,
  durationMs = DEFAULT_HISTORY_DURATION_MS,
): PitchHistory {
  if (
    !isValidTimestamp(input.timestampMs) ||
    !isValidHistoryDuration(durationMs)
  ) {
    return history;
  }

  const newestTimestamp = getNewestTimestamp(history);
  if (newestTimestamp !== null && input.timestampMs <= newestTimestamp) {
    return history;
  }

  const trimmed = trimPitchHistory(history, input.timestampMs - durationMs);
  const lastPoint = trimmed.points.at(-1);

  if (input.pitch === null) {
    if (lastPoint?.kind === 'gap') return trimmed;
    return addPoint(trimmed, createGapPoint(input.timestampMs));
  }

  if (!isValidMusicalPitch(input.pitch)) return trimmed;

  if (
    lastPoint?.kind === 'pitch' &&
    input.timestampMs - lastPoint.timestampMs < MINIMUM_HISTORY_INTERVAL_MS &&
    Math.abs(input.pitch.fractionalMidi - (lastPoint.midi ?? 0)) <
      MEANINGFUL_PITCH_CHANGE_MIDI
  ) {
    return trimmed;
  }

  return addPoint(
    trimmed,
    Object.freeze({
      timestampMs: input.timestampMs,
      midi: input.pitch.fractionalMidi,
      frequencyHz: input.pitch.frequencyHz,
      confidence: normalizeConfidence(input.confidence),
      kind: 'pitch' as const,
    }),
  );
}

export function trimPitchHistory(
  history: PitchHistory,
  cutoffTimestampMs: number,
): PitchHistory {
  if (!Number.isFinite(cutoffTimestampMs) || history.points.length === 0) {
    return history;
  }

  const firstRetainedIndex = history.points.findIndex(
    (point) => point.timestampMs >= cutoffTimestampMs,
  );
  if (firstRetainedIndex === 0) return history;
  if (firstRetainedIndex === -1) return createPitchHistory();
  if (history.points[firstRetainedIndex].timestampMs === cutoffTimestampMs) {
    return { points: history.points.slice(firstRetainedIndex) };
  }

  const boundarySource = history.points[firstRetainedIndex - 1];
  const boundaryPoint = Object.freeze({
    ...boundarySource,
    timestampMs: cutoffTimestampMs,
  });
  return {
    points: [boundaryPoint, ...history.points.slice(firstRetainedIndex)],
  };
}

export function clearPitchHistory(): PitchHistory {
  return createPitchHistory();
}

export function getOldestTimestamp(history: PitchHistory): number | null {
  return history.points[0]?.timestampMs ?? null;
}

export function getNewestTimestamp(history: PitchHistory): number | null {
  return history.points.at(-1)?.timestampMs ?? null;
}

export function getRetainedDurationMs(history: PitchHistory): number {
  const oldest = getOldestTimestamp(history);
  const newest = getNewestTimestamp(history);
  return oldest === null || newest === null ? 0 : newest - oldest;
}

export function summarizePitchHistory(
  history: PitchHistory,
): PitchHistorySummary {
  let pitchPoints = 0;
  let gapPoints = 0;
  for (const point of history.points) {
    if (point.kind === 'pitch') pitchPoints += 1;
    else gapPoints += 1;
  }
  return {
    totalPoints: history.points.length,
    pitchPoints,
    gapPoints,
    retainedDurationMs: getRetainedDurationMs(history),
    oldestTimestampMs: getOldestTimestamp(history),
    newestTimestampMs: getNewestTimestamp(history),
    latestKind: history.points.at(-1)?.kind ?? null,
  };
}

function addPoint(
  history: PitchHistory,
  point: PitchHistoryPoint,
): PitchHistory {
  return { points: [...history.points, point] };
}

function createGapPoint(timestampMs: number): PitchHistoryPoint {
  return Object.freeze({
    timestampMs,
    midi: null,
    frequencyHz: null,
    confidence: 0,
    kind: 'gap',
  });
}

function isValidTimestamp(timestampMs: number): boolean {
  return Number.isFinite(timestampMs) && timestampMs >= 0;
}

function isValidMusicalPitch(pitch: MusicalPitch): boolean {
  return (
    Number.isFinite(pitch.fractionalMidi) &&
    Number.isFinite(pitch.frequencyHz) &&
    pitch.frequencyHz > 0
  );
}

function normalizeConfidence(confidence: number): number {
  return Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0;
}
