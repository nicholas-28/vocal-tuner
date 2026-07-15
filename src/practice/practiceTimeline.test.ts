import { describe, expect, it } from 'vitest';
import type { PracticeTimelineEvent } from '../types/practiceTimeline';
import {
  createPracticeTimeline,
  formatPracticeTimelinePercentage,
  getPracticeTimelineLabel,
  getPracticeTimelineSegmentStyle,
} from './practiceTimeline';

describe('practice timeline', () => {
  it('derives one 100% segment without mutating its immutable event', () => {
    const event: PracticeTimelineEvent = Object.freeze({
      startTimestamp: 100,
      endTimestamp: 1100,
      type: 'on-target',
    });
    const segments = createPracticeTimeline([event], 100, 1100);

    expect(segments).toEqual([
      { event, durationMs: 1000, percentage: 100, startPercentage: 0 },
    ]);
    expect(segments[0]?.event).toBe(event);
    expect(Object.isFrozen(segments)).toBe(true);
    expect(Object.isFrozen(segments[0])).toBe(true);
  });

  it('uses wall-clock duration for mixed event positions and percentages', () => {
    const events: readonly PracticeTimelineEvent[] = [
      { startTimestamp: 0, endTimestamp: 250, type: 'on-target' },
      { startTimestamp: 250, endTimestamp: 500, type: 'off-target' },
      { startTimestamp: 500, endTimestamp: 700, type: 'uncertain' },
      { startTimestamp: 700, endTimestamp: 800, type: 'no-pitch' },
      { startTimestamp: 800, endTimestamp: 900, type: 'unobserved' },
      { startTimestamp: 900, endTimestamp: 1000, type: 'paused' },
    ];

    expect(createPracticeTimeline(events, 0, 1000)).toEqual([
      { event: events[0], durationMs: 250, percentage: 25, startPercentage: 0 },
      {
        event: events[1],
        durationMs: 250,
        percentage: 25,
        startPercentage: 25,
      },
      {
        event: events[2],
        durationMs: 200,
        percentage: 20,
        startPercentage: 50,
      },
      {
        event: events[3],
        durationMs: 100,
        percentage: 10,
        startPercentage: 70,
      },
      {
        event: events[4],
        durationMs: 100,
        percentage: 10,
        startPercentage: 80,
      },
      {
        event: events[5],
        durationMs: 100,
        percentage: 10,
        startPercentage: 90,
      },
    ]);
  });

  it('keeps a very small event truthful while requesting a 1px visual minimum', () => {
    const [segment] = createPracticeTimeline(
      [{ startTimestamp: 500, endTimestamp: 500.1, type: 'uncertain' }],
      0,
      1000,
    );

    expect(segment?.percentage).toBeCloseTo(0.01, 8);
    const style = segment && getPracticeTimelineSegmentStyle(segment);
    expect(style?.left).toBe('50%');
    expect(style?.width).toMatch(/^max\(1px, 0\.01\d*%\)$/);
  });

  it('formats labels and rounded session percentages', () => {
    expect(getPracticeTimelineLabel('no-pitch')).toBe('No pitch');
    expect(formatPracticeTimelinePercentage(24.4)).toBe('24%');
    expect(formatPracticeTimelinePercentage(24.6)).toBe('25%');
  });

  it('rejects invalid total durations and zero-length events', () => {
    expect(createPracticeTimeline([], 10, 10)).toEqual([]);
    expect(
      createPracticeTimeline(
        [{ startTimestamp: 5, endTimestamp: 5, type: 'paused' }],
        0,
        10,
      ),
    ).toEqual([]);
  });
});
