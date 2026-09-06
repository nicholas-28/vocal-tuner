import { expect, it } from 'vitest';
import { createAnalysisDurationProbe } from './analysisDurationProbe';

it('summarizes a bounded rolling window using nearest-rank percentiles', () => {
  const probe = createAnalysisDurationProbe();
  expect(probe.getSummary()).toEqual({
    count: 0,
    p50Ms: null,
    p95Ms: null,
    maximumMs: null,
    above8Ms: 0,
  });
  for (let duration = 1; duration <= 100; duration += 1) probe.record(duration);
  expect(probe.getSummary()).toEqual({
    count: 100,
    p50Ms: 50,
    p95Ms: 95,
    maximumMs: 100,
    above8Ms: 92,
  });
  for (let index = 0; index < 128; index += 1) probe.record(8);
  probe.record(NaN);
  probe.record(Infinity);
  probe.record(-1);
  expect(probe.getSummary()).toEqual({
    count: 128,
    p50Ms: 8,
    p95Ms: 8,
    maximumMs: 8,
    above8Ms: 0,
  });
  probe.reset();
  expect(probe.getSummary().count).toBe(0);
});
