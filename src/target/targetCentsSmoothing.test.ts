import { describe, expect, it } from 'vitest';
import type { TargetCentsDisplayInput } from './targetCentsSmoothing';
import { transitionTargetCentsDisplay } from './targetCentsSmoothing';

const input = (
  overrides: Partial<TargetCentsDisplayInput> = {},
): TargetCentsDisplayInput => ({
  targetRelativeCents: 20,
  targetMidi: 69,
  timestampMs: 100,
  continuityStatus: 'voiced',
  reducedMotion: false,
  ...overrides,
});

describe('target cents display smoothing', () => {
  it('shows the first valid measurement directly', () => {
    expect(transitionTargetCentsDisplay(null, input())).toEqual({
      displayCents: 20,
      targetMidi: 69,
      timestampMs: 100,
    });
  });

  it('smooths a step using elapsed time while leaving raw input untouched', () => {
    const raw = input({ targetRelativeCents: 100, timestampMs: 280 });
    const next = transitionTargetCentsDisplay(
      { displayCents: 0, targetMidi: 69, timestampMs: 100 },
      raw,
    );
    expect(next?.displayCents).toBeCloseTo(100 * (1 - Math.exp(-1)), 8);
    expect(raw.targetRelativeCents).toBe(100);
  });

  it('freezes during uncertainty and resets for unvoiced input', () => {
    const current = { displayCents: 15, targetMidi: 69, timestampMs: 100 };
    expect(
      transitionTargetCentsDisplay(
        current,
        input({ continuityStatus: 'uncertain', timestampMs: 200 }),
      ),
    ).toBe(current);
    expect(
      transitionTargetCentsDisplay(
        current,
        input({ continuityStatus: 'unvoiced' }),
      ),
    ).toBeNull();
  });

  it('resets immediately when the selected target changes, even if uncertain', () => {
    expect(
      transitionTargetCentsDisplay(
        { displayCents: 15, targetMidi: 69, timestampMs: 100 },
        input({
          targetRelativeCents: -80,
          targetMidi: 70,
          timestampMs: 200,
          continuityStatus: 'uncertain',
        }),
      ),
    ).toEqual({ displayCents: -80, targetMidi: 70, timestampMs: 200 });
  });

  it('bypasses smoothing for reduced motion', () => {
    expect(
      transitionTargetCentsDisplay(
        { displayCents: 0, targetMidi: 69, timestampMs: 100 },
        input({
          targetRelativeCents: 40,
          timestampMs: 110,
          reducedMotion: true,
        }),
      ),
    ).toEqual({ displayCents: 40, targetMidi: 69, timestampMs: 110 });
  });

  it('ignores invalid and non-forward samples', () => {
    const current = { displayCents: 15, targetMidi: 69, timestampMs: 100 };
    expect(
      transitionTargetCentsDisplay(
        current,
        input({ targetRelativeCents: Number.NaN }),
      ),
    ).toBe(current);
    expect(
      transitionTargetCentsDisplay(current, input({ timestampMs: 100 })),
    ).toBe(current);
    expect(
      transitionTargetCentsDisplay(current, input({ timestampMs: 99 })),
    ).toBe(current);
  });
});
