import { describe, expect, it } from 'vitest';
import { createFrameCadence } from './frameCadence';

function model(hz: number, legacy: boolean, jitter = false) {
  const gate = (interval: number) => {
    if (!legacy) return createFrameCadence(interval);
    let last = -interval;
    return (t: number) => {
      if (t - last < interval) return false;
      last = t;
      return true;
    };
  };
  const analysisDue = gate(1000 / 30);
  const presentationDue = gate(1000 / 15);
  const analysis: number[] = [],
    presentation: number[] = [];
  for (let i = 0; i < hz * 60; i++) {
    const t = (i * 1000) / hz + (jitter ? Math.sin(i * 1.7) * 0.4 : 0);
    if (analysisDue(t)) {
      analysis.push(t);
      if (presentationDue(t)) presentation.push(t);
    }
  }
  const summary = (values: number[]) => {
    const intervals = values
      .slice(1)
      .map((t, i) => t - values[i])
      .sort((a, b) => a - b);
    return {
      count: values.length,
      hz: ((values.length - 1) * 1000) / (values.at(-1)! - values[0]),
      median: intervals[Math.ceil(intervals.length * 0.5) - 1],
      p95: intervals[Math.ceil(intervals.length * 0.95) - 1],
    };
  };
  return { analysis: summary(analysis), presentation: summary(presentation) };
}

describe('60-second synthetic RAF cadence audit', () => {
  it.each([60, 120, 30])(
    'maintains 30/15 Hz on %s Hz RAF without catch-up',
    (hz) => {
      const before = model(hz, true),
        after = model(hz, false);
      expect(before.analysis.hz).toBeLessThan(28);
      expect(before.presentation.hz).toBeLessThan(14);
      expect(after.analysis.count).toBe(1800);
      expect(after.presentation.count).toBe(900);
      expect(after.analysis.hz).toBeCloseTo(30, 8);
      expect(after.presentation.hz).toBeCloseTo(15, 8);
      expect(after.analysis.p95).toBeCloseTo(1000 / 30, 8);
      expect(after.presentation.p95).toBeCloseTo(1000 / 15, 8);
    },
  );
  it.each([60, 120, 30])(
    'preserves average cadence with bounded timestamp jitter at %s Hz',
    (hz) => {
      const result = model(hz, false, true);
      expect(result.analysis.hz).toBeCloseTo(30, 0);
      expect(result.presentation.hz).toBeCloseTo(15, 0);
      expect(result.analysis.count).toBeLessThanOrEqual(1800);
      expect(result.analysis.p95).toBeLessThan(1000 / 30 + 1000 / hz + 1);
    },
  );
  it('skips long missed periods without replay or startup debt', () => {
    const due = createFrameCadence(1000 / 30);
    expect(due(5000)).toBe(true);
    expect(due(5000)).toBe(false);
    expect(due(8000)).toBe(true);
    expect(due(8001)).toBe(false);
    expect(due(NaN)).toBe(false);
  });
});
