import { expect, it } from 'vitest';
import { createPitchCurveBreaks } from './pitchCurveBreaks';

it('records rejections only, respects timestamp intervals, and resets sessions', () => {
  const gaps = createPitchCurveBreaks();
  gaps.record(100, false);
  gaps.record(133, true);
  gaps.record(167, false);
  expect(gaps.count).toBe(1);
  expect(gaps.between(100, 167)).toBe(true);
  expect(gaps.between(133, 167)).toBe(false);
  expect(gaps.between(100, 132)).toBe(false);
  gaps.record(NaN, true);
  gaps.record(120, true);
  expect(gaps.count).toBe(1);
  gaps.reset();
  expect(gaps.between(100, 167)).toBe(false);
});
it('bounds rejection metadata and fails closed when capacity is exhausted', () => {
  const gaps = createPitchCurveBreaks();
  for (let i = 0; i < 2000; i++) gaps.record(i, true);
  expect(gaps.count).toBe(1024);
  expect(gaps.between(0, 10)).toBe(true);
  expect(gaps.between(1900, 1999)).toBe(true);
  gaps.record(40_000, false);
  expect(gaps.count).toBe(0);
  expect(gaps.between(39_000, 40_000)).toBe(false);
});
