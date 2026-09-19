import { describe, expect, it, vi } from 'vitest';
import { PITCH_SOURCE_MAX_AGE_MS } from '../pitch/pitchSource';
import { DEFAULT_PITCH_CONTINUITY_CONFIG } from '../pitch/pitchContinuityConfig';
import { smoothVisualCents } from '../tuner/visualResponse';
import { createFastPitchInterpreter } from './fastPitchInterpreter';
import { PAD_RESPONSE_POLICY, PAD_TUNING } from './padConfig';
import { createPitchHarness, runSignal } from './test/pitchHarness';

describe('fast pitch interpretation and harmony acceptance', () => {
  it('requires the configured hysteresis crossing and dwell before accepting a neighboring class', () => {
    const boundary = 50 + PAD_TUNING.pitchClassHysteresisCents;
    const rows = runSignal(
      (t) =>
        t < 500 ? 6000 : t < 1500 ? 6000 + boundary - 10 : 6000 + boundary + 10,
      2500,
    );
    expect(
      rows
        .filter((r) => r.frame.atMs >= 500 && r.frame.atMs < 1500)
        .every((r) => r.frame.pitchClass === 0),
    ).toBe(true);
    const crossed = rows.find((r) => r.frame.harmonyCents! > 6000 + boundary)!;
    const accepted = rows.find((r) => r.frame.pitchClass === 1)!;
    expect(accepted).toBeDefined();
    expect(accepted.frame.atMs - crossed.frame.atMs).toBeGreaterThanOrEqual(
      PAD_TUNING.pitchClassDwellMs,
    );
    // C sharp remains chromatic in the injected C-major key.
    expect(
      rows.filter((r) => r.frame.atMs >= 500).every((r) => !r.harmony.changed),
    ).toBe(true);
  });
  it.each([0, Math.PI / 2, Math.PI])(
    'holds harmony through three seconds of 50-cent, 5 Hz vibrato (phase %s)',
    (phase) => {
      const rows = runSignal(
        (t) => 6900 + 50 * Math.sin((2 * Math.PI * 5 * t) / 1000 + phase),
        3000,
      );
      const established = rows.findIndex((r) => r.harmony.chord !== null);
      expect(established).toBeGreaterThanOrEqual(0);
      expect(
        rows.slice(established + 1).filter((r) => r.harmony.changed),
      ).toHaveLength(0);
      expect(
        rows.slice(established).every((r) => r.frame.pitchClass === 9),
      ).toBe(true);
    },
  );

  it.each([-1200, 1200])(
    'folds three evidence frames at %s cents without shimmer or harmony jumps',
    (shift) => {
      const rows = runSignal(
        (t) => 6900 + (t >= 1000 && t < 1100 ? shift : 0),
        1600,
      );
      const glitch = rows.filter(
        (r) => r.frame.atMs >= 1000 && r.frame.atMs < 1100,
      );
      expect(glitch.filter((r) => r.frame.evidence === 'sample')).toHaveLength(
        3,
      );
      expect(glitch.every((r) => r.frame.octaveFolded)).toBe(true);
      for (const { frame, harmony } of rows.filter(
        (r) => r.frame.atMs >= 1000,
      )) {
        expect(frame.targetCents).toBeCloseTo(6900);
        expect(frame.shimmerCents).toBeCloseTo(6900);
        expect(frame.pitchClass).toBe(9);
        expect(harmony.changed).toBe(false);
      }
    },
  );

  it.each([-1200, 1200])(
    'confirms sustained %s-cent octaves using evidence time, with octave-invariant harmony',
    (shift) => {
      const rows = runSignal((t) => 6900 + (t >= 1000 ? shift : 0), 2000);
      const accepted = rows.find(
        (r) => Math.abs(r.frame.targetCents! - (6900 + shift)) < 0.01,
      )!;
      expect(accepted).toBeDefined();
      expect(accepted.frame.lastVoicedAtMs! - 1000).toBeGreaterThanOrEqual(
        PAD_TUNING.octaveConfirmMs,
      );
      expect(accepted.frame.lastVoicedAtMs! - 1000).toBeLessThan(
        PAD_TUNING.octaveConfirmMs + 1000 / 30,
      );
      expect(accepted.frame.octaveFolded).toBe(false);
      expect(
        rows
          .filter((r) => r.frame.atMs >= 1000)
          .every((r) => r.frame.pitchClass === 9 && !r.harmony.changed),
      ).toBe(true);
      expect(rows.at(-1)!.frame.shimmerCents).toBeCloseTo(6900 + shift, 1);
    },
  );

  it('meets the configured shimmer and required harmony response budgets', () => {
    // G belongs to the initial C chord; B, a major third above G, does not.
    const start = 6700;
    const target = start + PAD_RESPONSE_POLICY.referenceLeapCents;
    const rows = runSignal((t) => (t < 1000 ? start : target), 1700);
    const before =
      rows.find((r) => r.frame.atMs === 1000 - 1000 / 60) ?? rows[59];
    expect(before.harmony.chord?.voiceCents.map((v) => v % 1200)).not.toContain(
      target % 1200,
    );
    const response = rows.find(
      (r) =>
        r.frame.atMs >= 1000 &&
        r.frame.shimmerCents! - start >=
          PAD_RESPONSE_POLICY.referenceLeapCents *
            PAD_RESPONSE_POLICY.shimmerSettleFraction,
    )!;
    expect(response.frame.atMs - 1000).toBeLessThanOrEqual(
      PAD_RESPONSE_POLICY.shimmerSettleBudgetMs,
    );
    const changed = rows.find(
      (r) => r.frame.atMs >= 1000 && r.harmony.changed,
    )!;
    expect(changed).toBeDefined();
    expect(changed.frame.atMs - 1000).toBeLessThanOrEqual(
      PAD_RESPONSE_POLICY.harmonyChangeBudgetMs,
    );
    expect(changed.harmony.chord!.voiceCents.map((v) => v % 1200)).toContain(
      target % 1200,
    );
  });

  it('advances a smooth slide between 30 Hz evidence at 60 Hz without relabeling interpolation', () => {
    const rows = runSignal((t) => 6000 + t * 0.4, 1000);
    let interpolationCount = 0;
    rows.forEach(({ frame }, i) => {
      if (!i) return;
      const previous = rows[i - 1].frame;
      expect(frame.shimmerCents!).toBeGreaterThanOrEqual(
        previous.shimmerCents!,
      );
      expect(frame.shimmerCents!).toBeLessThanOrEqual(frame.targetCents!);
      if (i % 2 === 1) {
        expect(frame.evidence).toBe('interpolated');
        expect(frame.lastVoicedAtMs).toBe(previous.lastVoicedAtMs);
        expect(frame.targetCents).toBe(previous.targetCents);
        if (i > 2)
          expect(frame.shimmerCents!).toBeGreaterThan(previous.shimmerCents!);
        interpolationCount++;
      } else expect(frame.evidence).toBe('sample');
    });
    expect(interpolationCount).toBe(30);
  });

  it('integrates the old target before a new timestamp and uses a plain harmony exponential', () => {
    const h = createPitchHarness();
    h.publish(0, 6000);
    h.update(0);
    h.publish(10, 6400);
    const first = h.update(20).frame;
    expect(first.harmonyCents).toBeCloseTo(
      6400 - 400 * Math.exp(-10 / PAD_TUNING.harmonyTimeConstantMs),
    );
    expect(first.shimmerCents).toBeCloseTo(smoothVisualCents(6000, 6400, 10));
    const second = h.update(30).frame;
    expect(second.harmonyCents).toBeCloseTo(
      6400 - 400 * Math.exp(-20 / PAD_TUNING.harmonyTimeConstantMs),
    );
    expect(second.evidence).toBe('interpolated');
    // A late publication does not retroactively integrate its target.
    h.publish(25, 6500);
    expect(h.update(30).frame.harmonyCents).toBe(second.harmonyCents);
  });

  it.each([15, 30, 60])(
    'uses elapsed time with %s Hz evidence and 120 Hz consumption',
    (hz) => {
      const rows = runSignal((t) => (t < 1000 ? 6700 : 7100), 1600, hz, 120);
      const response = rows.find(
        (r) => r.frame.atMs >= 1000 && r.harmony.changed,
      )!;
      expect(response.frame.atMs - 1000).toBeLessThanOrEqual(
        PAD_RESPONSE_POLICY.harmonyChangeBudgetMs,
      );
    },
  );
});

describe('evidence, clocks, grace, and sessions', () => {
  it('defers a future sample and consumes it exactly once when the clock catches up', () => {
    const h = createPitchHarness();
    h.publish(0, 6000);
    h.update(0);
    h.publish(20, 6400);
    const early = h.update(16).frame;
    expect(early.targetCents).toBeCloseTo(6000);
    expect(early.lastVoicedAtMs).toBe(0);
    expect(early.evidence).toBe('interpolated');
    expect(h.update(19).frame.targetCents).toBeCloseTo(6000);
    expect(h.update(20).frame).toMatchObject({
      evidence: 'sample',
      lastVoicedAtMs: 20,
    });
    expect(h.update(20).frame.evidence).toBe('interpolated');
    expect(h.update(21).frame.evidence).toBe('interpolated');
  });

  it('keeps an initial future sample unconsumed', () => {
    const h = createPitchHarness();
    h.publish(10, 6900);
    expect(h.update(9).frame).toMatchObject({
      phase: 'idle',
      targetCents: null,
      lastVoicedAtMs: null,
    });
    expect(h.update(10).frame).toMatchObject({
      phase: 'voiced',
      evidence: 'sample',
      lastVoicedAtMs: 10,
    });
  });

  it('uses timestamp identity, not object identity, and does not subscribe', () => {
    const h = createPitchHarness();
    const subscribe = vi.fn(h.producer.source.subscribe);
    const interpreter = createFastPitchInterpreter({
      source: {
        ...h.producer.source,
        subscribe,
        getLatest: () => ({ ...h.producer.source.getLatest()! }),
      },
    });
    h.publish(0, 6900);
    expect(interpreter.update(0).evidence).toBe('sample');
    expect(interpreter.update(16).evidence).toBe('interpolated');
    h.publish(33, 6900);
    expect(interpreter.update(33).evidence).toBe('sample');
    expect(subscribe).not.toHaveBeenCalled();
  });

  it.each([
    'silence',
    'uncertain',
    'stale',
    'inactive',
    'no-publication',
  ] as const)(
    'anchors grace to voiced evidence during %s and releases before freshness expires',
    (kind) => {
      const h = createPitchHarness();
      const grace = DEFAULT_PITCH_CONTINUITY_CONFIG.gracePeriodMs;
      h.publish(100, 6900);
      h.update(120);
      if (kind === 'stale' || kind === 'inactive') h.producer.invalidate(kind);
      else if (kind !== 'no-publication')
        h.publish(130, null, kind === 'uncertain');
      const held = h.update(140).frame;
      expect(held.lastVoicedAtMs).toBe(100);
      expect(held.targetCents).toBeCloseTo(6900);
      if (kind !== 'no-publication')
        expect(held).toMatchObject({ phase: 'grace', evidence: 'none' });
      expect(h.update(100 + grace).frame.targetCents).not.toBeNull();
      expect(h.update(101 + grace).frame).toMatchObject({
        phase: 'releasing',
        targetCents: null,
        shimmerCents: null,
        harmonyCents: null,
        pitchClass: null,
        lastVoicedAtMs: 100,
        evidence: 'none',
      });
      expect(grace).toBeLessThan(PITCH_SOURCE_MAX_AGE_MS);
    },
  );

  it('does not revive a target from stale or already expired evidence', () => {
    for (const age of [200, PITCH_SOURCE_MAX_AGE_MS + 1]) {
      const h = createPitchHarness();
      h.publish(0, 6900);
      expect(h.update(age).frame).toMatchObject({
        targetCents: null,
        lastVoicedAtMs: null,
        evidence: 'none',
      });
    }
  });

  it('clears pending dwell during uncertainty and never changes harmony from it', () => {
    const h = createPitchHarness();
    h.publish(0, 6900);
    h.update(0);
    h.publish(50, null, true);
    h.update(50);
    expect(h.update(140).harmony.chord).toBeNull();
    h.publish(150, 6900);
    h.update(150);
    h.publish(250, 6900);
    expect(h.update(250).harmony.chord).toBeNull();
    expect(h.update(270).harmony.chord).not.toBeNull();
  });

  it('cannot confirm an octave by repeatedly consuming the same evidence', () => {
    const h = createPitchHarness({ gracePeriodMs: 1000 });
    h.publish(0, 6900);
    h.update(0);
    h.publish(10, 8100);
    h.update(10);
    for (let t = 20; t <= 400; t += 10)
      expect(h.update(t).frame.targetCents).toBeCloseTo(6900);
  });

  it('resets octave confirmation after an uncertain observation', () => {
    const h = createPitchHarness();
    h.publish(0, 6900);
    h.update(0);
    h.publish(10, 8100);
    h.update(10);
    h.publish(110, 8100);
    h.update(110);
    h.publish(120, null, true);
    h.update(120);
    h.publish(210, 8100);
    h.update(210);
    h.publish(310, 8100);
    expect(h.update(310).frame).toMatchObject({ octaveFolded: true });
    expect(h.update(320).frame.targetCents).toBeCloseTo(6900);
  });

  it('clears all state across generations even when the inactive marker is missed', () => {
    const h = createPitchHarness();
    h.publish(0, 6900);
    h.update(0);
    h.publish(130, 6900);
    const old = h.update(130).harmony.chord!;
    expect(old).not.toBeNull();
    h.publish(140, 8100);
    h.update(140);
    h.newSession();
    h.publish(150, 8100);
    const boundary = h.update(150);
    expect(boundary.frame).toMatchObject({
      phase: 'idle',
      lastVoicedAtMs: null,
      pitchClass: null,
      octaveFolded: false,
    });
    expect(boundary.harmony).toEqual({ chord: null, changed: true });
    expect(h.update(151).frame).toMatchObject({
      evidence: 'sample',
      octaveFolded: false,
      pitchClass: null,
    });
    expect(h.update(152).frame.targetCents).toBeCloseTo(8100);
    h.publish(280, 8100);
    const next = h.update(280).harmony;
    expect(next.changed).toBe(true);
    expect(next.chord).not.toBe(old);
  });

  it('resets after clear and explicit reset, with an observable idle frame', () => {
    const h = createPitchHarness();
    h.publish(0, 6900);
    h.update(0);
    h.update(130);
    h.interpreter.reset();
    expect(h.update(140)).toMatchObject({
      frame: { phase: 'idle' },
      harmony: { chord: null, changed: true },
    });
    h.producer.clear();
    expect(h.update(150).frame).toMatchObject({
      phase: 'idle',
      lastVoicedAtMs: null,
    });
    h.newSession();
    h.publish(160, 6000);
    expect(h.update(160).frame.targetCents).toBeCloseTo(6000);
  });

  it('rejects invalid or regressing consumer clocks without poisoning subsequent updates', () => {
    const h = createPitchHarness();
    h.publish(100, 6900);
    h.update(100);
    for (const time of [NaN, Infinity, -1, 99])
      expect(() => h.update(time)).toThrow(RangeError);
    expect(h.update(101).frame).toMatchObject({
      lastVoicedAtMs: 100,
      evidence: 'interpolated',
    });
  });
});
