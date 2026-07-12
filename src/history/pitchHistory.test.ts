import { describe, expect, it } from 'vitest';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import {
  appendPitchHistory,
  clearPitchHistory,
  createPitchHistory,
  getNewestTimestamp,
  getOldestTimestamp,
  getRetainedDurationMs,
  summarizePitchHistory,
  trimPitchHistory,
} from './pitchHistory';
import {
  DEFAULT_HISTORY_DURATION_MS,
  isValidHistoryDuration,
} from './pitchHistoryConfig';

const pitch220 = frequencyToMusicalPitch(220)!;
const pitch440 = frequencyToMusicalPitch(440)!;

function appendPitch(
  history = createPitchHistory(),
  timestampMs = 0,
  pitch = pitch220,
) {
  return appendPitchHistory(history, {
    timestampMs,
    pitch,
    confidence: 0.9,
  });
}

describe('pitch history buffer', () => {
  it('creates empty history and appends immutable ordered pitch points', () => {
    const empty = createPitchHistory();
    const first = appendPitch(empty, 100);
    const second = appendPitch(first, 200, pitch440);

    expect(empty.points).toEqual([]);
    expect(first.points).toHaveLength(1);
    expect(second.points.map((point) => point.timestampMs)).toEqual([100, 200]);
    expect(second.points[0]).toMatchObject({
      kind: 'pitch',
      midi: pitch220.fractionalMidi,
      frequencyHz: 220,
      confidence: 0.9,
    });
    expect(Object.isFrozen(second.points[0])).toBe(true);
    expect(getOldestTimestamp(second)).toBe(100);
    expect(getNewestTimestamp(second)).toBe(200);
    expect(getRetainedDurationMs(second)).toBe(100);
  });

  it('normalizes finite confidence and safely replaces invalid confidence', () => {
    const high = appendPitchHistory(createPitchHistory(), {
      timestampMs: 1,
      pitch: pitch220,
      confidence: 2,
    });
    const invalid = appendPitchHistory(createPitchHistory(), {
      timestampMs: 1,
      pitch: pitch220,
      confidence: Number.NaN,
    });
    expect(high.points[0].confidence).toBe(1);
    expect(invalid.points[0].confidence).toBe(0);
  });

  it('preserves pitch to gap to pitch transitions without duplicate silence', () => {
    let history = appendPitch(undefined, 100);
    history = appendPitchHistory(history, {
      timestampMs: 110,
      pitch: null,
      confidence: 0,
    });
    const afterDuplicateGap = appendPitchHistory(history, {
      timestampMs: 5000,
      pitch: null,
      confidence: 0,
    });
    history = appendPitch(afterDuplicateGap, 5100);

    expect(afterDuplicateGap.points).toHaveLength(2);
    expect(history.points.map((point) => point.kind)).toEqual([
      'pitch',
      'gap',
      'pitch',
    ]);
    expect(history.points[1]).toMatchObject({
      timestampMs: 110,
      midi: null,
      frequencyHz: null,
      confidence: 0,
    });
    expect(summarizePitchHistory(history)).toMatchObject({
      totalPoints: 3,
      pitchPoints: 2,
      gapPoints: 1,
      latestKind: 'pitch',
    });
  });

  it('samples fast duplicates but preserves transitions and large pitch movement', () => {
    let history = appendPitch(undefined, 100, pitch220);
    history = appendPitch(history, 120, pitch220);
    expect(history.points).toHaveLength(1);
    history = appendPitch(history, 130, pitch440);
    expect(history.points).toHaveLength(2);
    history = appendPitchHistory(history, {
      timestampMs: 131,
      pitch: null,
      confidence: 0,
    });
    expect(history.points.at(-1)?.kind).toBe('gap');
    history = appendPitch(history, 132, pitch220);
    expect(history.points.at(-1)?.kind).toBe('pitch');
  });

  it('trims by timestamp and creates one exact cutoff boundary', () => {
    let history = appendPitch(undefined, 0);
    history = appendPitch(history, 10_000);
    history = appendPitch(history, 20_000);
    const trimmed = trimPitchHistory(history, 12_000);

    expect(trimmed.points.map((point) => point.timestampMs)).toEqual([
      12_000, 20_000,
    ]);
    expect(getRetainedDurationMs(trimmed)).toBe(8_000);

    const exact = trimPitchHistory(history, 10_000);
    expect(exact.points.map((point) => point.timestampMs)).toEqual([
      10_000, 20_000,
    ]);
  });

  it('handles mixed gaps, large jumps, and bounded long-running history', () => {
    let mixed = appendPitch(undefined, 0);
    mixed = appendPitchHistory(mixed, {
      timestampMs: 5000,
      pitch: null,
      confidence: 0,
    });
    mixed = appendPitch(mixed, 10_000);
    mixed = appendPitch(mixed, 20_000);
    expect(mixed.points[0].timestampMs).toBe(5000);
    expect(getRetainedDurationMs(mixed)).toBe(DEFAULT_HISTORY_DURATION_MS);

    let history = createPitchHistory();
    for (let timestampMs = 0; timestampMs <= 120_000; timestampMs += 70) {
      history = appendPitch(history, timestampMs);
    }
    expect(getRetainedDurationMs(history)).toBeLessThanOrEqual(
      DEFAULT_HISTORY_DURATION_MS,
    );
    expect(history.points.length).toBeLessThanOrEqual(220);

    const jumped = appendPitch(history, 1_000_000);
    expect(jumped.points).toHaveLength(1);
    expect(jumped.points[0].timestampMs).toBe(1_000_000);
  });

  it('ignores invalid, duplicate, and stale timestamps without corrupting order', () => {
    const history = appendPitch(undefined, 100);
    for (const timestampMs of [Number.NaN, Infinity, -1, 100, 99]) {
      expect(appendPitch(history, timestampMs)).toBe(history);
    }
    expect(history.points.map((point) => point.timestampMs)).toEqual([100]);
  });

  it('clears immediately and allows an earlier new-session timeline', () => {
    const history = appendPitch(undefined, 10_000);
    const cleared = clearPitchHistory();
    const restarted = appendPitch(cleared, 50);
    expect(history.points).toHaveLength(1);
    expect(cleared.points).toHaveLength(0);
    expect(restarted.points[0].timestampMs).toBe(50);
  });

  it('validates the configurable retention range', () => {
    expect(isValidHistoryDuration(5000)).toBe(true);
    expect(isValidHistoryDuration(60_000)).toBe(true);
    expect(isValidHistoryDuration(4999)).toBe(false);
    expect(isValidHistoryDuration(60_001)).toBe(false);
    expect(isValidHistoryDuration(Number.NaN)).toBe(false);
  });
});
