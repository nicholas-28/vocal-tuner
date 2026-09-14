import { describe, expect, it } from 'vitest';
import { smoothVisualCents } from './visualResponse';
import { transitionCentsDisplay } from './centsDisplaySmoothing';
import { transitionTargetCentsDisplay } from '../target/targetCentsSmoothing';

describe('synthetic presentation response', () => {
  it.each([10, 30, -10, -30])(
    'settles a %s-cent correction within two cents by 100 ms, faster than both old filters',
    (start) => {
      const output = smoothVisualCents(start, 0, 100);
      expect(Math.abs(output)).toBeLessThan(2);
      for (const oldTau of [150, 180])
        expect(Math.abs(output)).toBeLessThan(
          Math.abs(start * Math.exp(-100 / oldTau)),
        );
    },
  );
  it('preserves steady input, calms small jitter, and crosses zero promptly', () => {
    expect(smoothVisualCents(7, 7, 100)).toBe(7);
    expect(smoothVisualCents(0, 1, 1000 / 60)).toBeLessThan(0.3);
    expect(smoothVisualCents(-15, 15, 50)).toBeGreaterThan(0);
  });
  it.each([10, 30])(
    'retains 5 Hz vibrato of ±%s cents without overshoot',
    (amplitude) => {
      let display = 0,
        old = 0;
      const outputs: number[] = [],
        oldOutputs: number[] = [];
      for (let i = 0; i < 180; i++) {
        const raw = amplitude * Math.sin((2 * Math.PI * 5 * i) / 60);
        display = smoothVisualCents(display, raw, 1000 / 60);
        old += (1 - Math.exp(-(1000 / 60) / 150)) * (raw - old);
        if (i > 60) {
          outputs.push(display);
          oldOutputs.push(old);
        }
      }
      const peak = Math.max(...outputs);
      expect(peak).toBeGreaterThan(amplitude * 0.65);
      expect(peak).toBeLessThanOrEqual(amplitude);
      expect(peak).toBeGreaterThan(Math.max(...oldOutputs) * 2);
    },
  );
  it('aligns target/main responses without changing raw inputs', () => {
    const main = Object.freeze({
      rawCents: 0,
      noteMidi: 69,
      timestampMs: 100,
      continuityStatus: 'voiced' as const,
      reducedMotion: false,
    });
    const target = Object.freeze({
      targetRelativeCents: 0,
      targetMidi: 69,
      timestampMs: 100,
      continuityStatus: 'voiced' as const,
      reducedMotion: false,
    });
    const a = transitionCentsDisplay(
      { displayCents: -30, noteMidi: 69, timestampMs: 0 },
      main,
    );
    const b = transitionTargetCentsDisplay(
      { displayCents: -30, targetMidi: 69, timestampMs: 0 },
      target,
    );
    expect(a?.displayCents).toBe(b?.displayCents);
    expect(main.rawCents).toBe(0);
    expect(target.targetRelativeCents).toBe(0);
  });
});
