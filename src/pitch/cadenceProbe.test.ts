import { expect, it } from 'vitest';
import { createCadenceProbe } from './cadenceProbe';

it('measures rolling rate, median, tail, bounded count, stale status, and session reset', () => {
  const probe = createCadenceProbe();
  expect(probe.getSummary(0).hz).toBeNull();
  for (let i = 0; i < 1000; i++) probe.record((i * 1000) / 30);
  const now = (999 * 1000) / 30;
  const summary = probe.getSummary(now);
  expect(summary.count).toBe(128);
  expect(summary.hz).toBeCloseTo(30, 8);
  expect(summary.medianMs).toBeCloseTo(1000 / 30, 8);
  expect(summary.p95Ms).toBeCloseTo(1000 / 30, 8);
  for (const invalid of [NaN, Infinity, 0, now]) probe.record(invalid);
  expect(probe.getSummary(now)).toEqual(summary);
  expect(probe.getSummary(now + 251).hz).toBeNull();
  probe.reset();
  expect(probe.getSummary(now)).toMatchObject({
    count: 0,
    hz: null,
    medianMs: null,
    p95Ms: null,
  });
});
it('reports irregular intervals instead of reciprocating the latest one', () => {
  const probe = createCadenceProbe();
  [0, 30, 60, 120].forEach(probe.record);
  expect(probe.getSummary(120)).toEqual({
    count: 4,
    hz: 25,
    medianMs: 30,
    p95Ms: 60,
  });
});
