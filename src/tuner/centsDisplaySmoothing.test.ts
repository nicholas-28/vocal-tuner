import { describe, expect, it } from 'vitest';
import type { CentsDisplayInput, CentsDisplayState } from '../types/centsMeter';
import {
  centsToMeterPercent,
  classifyCents,
  transitionCentsDisplay,
} from './centsDisplaySmoothing';

const voiced = (
  rawCents: number,
  timestampMs: number,
  noteMidi = 69,
): CentsDisplayInput => ({
  rawCents,
  noteMidi,
  timestampMs,
  continuityStatus: 'voiced',
  reducedMotion: false,
});

describe('cents meter mapping and classification', () => {
  it.each([
    [-75, 0],
    [-50, 0],
    [-25, 25],
    [0, 50],
    [25, 75],
    [50, 100],
    [75, 100],
  ])('maps %s raw cents to %s visual percent', (cents, percent) => {
    expect(centsToMeterPercent(cents)).toBe(percent);
  });

  it.each([Number.NaN, Infinity, -Infinity])(
    'rejects invalid mapping input %s',
    (cents) => expect(centsToMeterPercent(cents)).toBeNull(),
  );

  it.each([
    [-5, 'in-tune'],
    [0, 'in-tune'],
    [5, 'in-tune'],
    [-5.001, 'flat'],
    [5.001, 'sharp'],
  ] as const)('classifies %s cents as %s', (cents, classification) => {
    expect(classifyCents(cents)).toBe(classification);
  });

  it.each([null, Number.NaN, Infinity, -Infinity])(
    'returns no classification for %s',
    (cents) => expect(classifyCents(cents)).toBeNull(),
  );
});

describe('display-only cents smoothing', () => {
  it('initializes immediately, remains stable, and never mutates raw input', () => {
    const input = voiced(12, 100);
    const snapshot = { ...input };
    const initial = transitionCentsDisplay(null, input);
    expect(initial?.displayCents).toBe(12);
    expect(transitionCentsDisplay(initial, voiced(12, 167))).toMatchObject({
      displayCents: 12,
    });
    expect(input).toEqual(snapshot);
  });

  it('smooths a step without overshoot and advances farther with elapsed time', () => {
    const initial = transitionCentsDisplay(null, voiced(0, 0));
    const short = transitionCentsDisplay(initial, voiced(30, 75));
    const long = transitionCentsDisplay(initial, voiced(30, 300));
    expect(short!.displayCents).toBeGreaterThan(0);
    expect(long!.displayCents).toBeGreaterThan(short!.displayCents);
    expect(long!.displayCents).toBeLessThan(30);
    expect(long!.displayCents).toBeCloseTo(25.94, 2);
  });

  it('is refresh-rate independent for equivalent elapsed time', () => {
    const initial = transitionCentsDisplay(null, voiced(0, 0));
    let frequent = initial;
    for (const timestampMs of [50, 100, 150])
      frequent = transitionCentsDisplay(frequent, voiced(30, timestampMs));
    const sparse = transitionCentsDisplay(initial, voiced(30, 150));
    expect(frequent!.displayCents).toBeCloseTo(sparse!.displayCents, 10);
  });

  it('resets at ascending and descending nearest-note boundaries', () => {
    const b3 = transitionCentsDisplay(null, voiced(49, 100, 59));
    const c4 = transitionCentsDisplay(b3, voiced(-49, 167, 60));
    expect(c4?.displayCents).toBe(-49);
    const backToB3 = transitionCentsDisplay(c4, voiced(49, 234, 59));
    expect(backToB3?.displayCents).toBe(49);
    expect(
      transitionCentsDisplay(c4, voiced(-30, 234, 60))!.displayCents,
    ).toBeLessThan(-30);
  });

  it('freezes uncertainty, resets no pitch, and initializes cleanly afterward', () => {
    const stable = transitionCentsDisplay(null, voiced(10, 100));
    const uncertain = transitionCentsDisplay(stable, {
      ...voiced(-40, 167),
      continuityStatus: 'uncertain',
    });
    expect(uncertain).toBe(stable);
    const noPitch = transitionCentsDisplay(uncertain, {
      rawCents: null,
      noteMidi: null,
      timestampMs: 300,
      continuityStatus: 'unvoiced',
      reducedMotion: false,
    });
    expect(noPitch).toBeNull();
    expect(transitionCentsDisplay(noPitch, voiced(-20, 10))?.displayCents).toBe(
      -20,
    );
  });

  it('safely ignores invalid, duplicate, and backwards measurements', () => {
    const stable = transitionCentsDisplay(null, voiced(10, 100));
    const cases = [
      voiced(Number.NaN, 167),
      voiced(20, 100),
      voiced(20, 99),
      { ...voiced(20, 167), noteMidi: null },
    ];
    cases.forEach((input) =>
      expect(transitionCentsDisplay(stable, input)).toBe(stable),
    );
  });

  it('updates directly for reduced motion and falls back from invalid config', () => {
    const stable: CentsDisplayState = {
      displayCents: 0,
      noteMidi: 69,
      timestampMs: 0,
    };
    expect(
      transitionCentsDisplay(stable, {
        ...voiced(30, 67),
        reducedMotion: true,
      })?.displayCents,
    ).toBe(30);
    expect(
      transitionCentsDisplay(stable, voiced(30, 150), {
        timeConstantMs: Number.NaN,
        inTuneToleranceCents: 5,
      })?.displayCents,
    ).toBeCloseTo(18.96, 2);
  });
});
