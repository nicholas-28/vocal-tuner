import { describe, expect, it } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import { createPitchSource } from './pitchSource';
import {
  createShortWindowPitchEvidence,
  projectEvidenceToTarget,
} from './shortWindowPitchEvidence';

const TARGET_MIDI = 57; // A3

function setup() {
  let now = 0;
  const producer = createPitchSource(() => now);
  producer.beginSession(1);
  const evidence = createShortWindowPitchEvidence(producer.source);
  return {
    producer,
    evidence,
    publish(timestampMs: number, cents: number | 'silence' | 'rejected') {
      now = timestampMs;
      const voiced = typeof cents === 'number';
      producer.publish(
        createPitchDetection({
          timestampMs,
          frequencyHz: voiced ? 220 * 2 ** (cents / 1200) : null,
          rejectionReason: voiced
            ? 'detected'
            : cents === 'silence'
              ? 'silence'
              : 'low-confidence',
        }),
        1,
      );
    },
  };
}

function trajectory(
  pitch: (
    index: number,
    timestampMs: number,
  ) => number | 'silence' | 'rejected',
) {
  const fixture = setup();
  for (let index = 0; index <= 15; index += 1) {
    const timestampMs = (index * 500) / 15;
    fixture.publish(timestampMs, pitch(index, timestampMs));
  }
  return fixture.evidence.getSnapshot(500);
}

const target = (snapshot: ReturnType<typeof trajectory>) =>
  projectEvidenceToTarget(snapshot, TARGET_MIDI)!;

describe('ShortWindowPitchEvidence', () => {
  it('describes perfectly steady centered pitch', () => {
    const snapshot = trajectory(() => 0);
    expect(snapshot.windowSufficiency).toBe('sufficient');
    expect(snapshot.voicedDurationMs).toBeCloseTo(500);
    expect(snapshot.voicedCoverage).toBeCloseTo(1);
    expect(snapshot.spreadCents).toBeCloseTo(0);
    expect(target(snapshot).centerOffsetCents).toBeCloseTo(0);
  });

  it('keeps steady +20 cents sharp distinct from centered voice', () => {
    const snapshot = trajectory(() => 20);
    expect(target(snapshot).centerOffsetCents).toBeCloseTo(20);
    expect(snapshot.spreadCents).toBeCloseTo(0);
    expect(snapshot.windowSufficiency).toBe('sufficient');
  });

  it('separates centered natural vibrato from stable flat pitch', () => {
    const vibrato = trajectory(
      (_, ms) => 20 * Math.sin((2 * Math.PI * 5 * ms) / 1000),
    );
    const flat = trajectory(() => -20);
    expect(Math.abs(target(vibrato).centerOffsetCents!)).toBeLessThan(5);
    expect(vibrato.spreadCents).toBeGreaterThan(10);
    expect(target(flat).centerOffsetCents).toBeCloseTo(-20);
    expect(flat.spreadCents).toBeCloseTo(0);
  });

  it('reports vibrato centered 18 cents flat without calling it steady', () => {
    const snapshot = trajectory(
      (_, ms) => -18 + 20 * Math.sin((2 * Math.PI * 5 * ms) / 1000),
    );
    expect(target(snapshot).centerOffsetCents).toBeLessThan(-12);
    expect(snapshot.spreadCents).toBeGreaterThan(10);
  });

  it('does not turn a fast crossing into a low-spread hold', () => {
    const snapshot = trajectory((index) => -80 + (160 * index) / 15);
    expect(Math.abs(target(snapshot).centerOffsetCents!)).toBeLessThan(15);
    expect(snapshot.spreadCents).toBeGreaterThan(40);
    expect(target(snapshot).latestOffsetCents).toBeGreaterThan(70);
  });

  it('shows approach and settle through independent center, spread and latest', () => {
    const snapshot = trajectory((_, ms) =>
      ms < 200 ? -50 * (1 - ms / 200) : 0,
    );
    expect(Math.abs(target(snapshot).centerOffsetCents!)).toBeLessThan(5);
    expect(snapshot.spreadCents).toBeGreaterThan(5);
    expect(target(snapshot).latestOffsetCents).toBeCloseTo(0);
  });

  it('keeps a stable hold fixed across repeated reads', () => {
    const fixture = setup();
    for (let index = 0; index <= 15; index += 1)
      fixture.publish((index * 500) / 15, 2);
    const first = fixture.evidence.getSnapshot(500);
    const second = fixture.evidence.getSnapshot(500);
    expect(second).toEqual(first);
    expect(first.voicedDurationMs).toBeCloseTo(500);
    expect(target(first).centerOffsetCents).toBeCloseTo(2);
  });

  it('keeps silence explicit with no invented center', () => {
    const snapshot = trajectory(() => 'silence');
    expect(snapshot.windowSufficiency).toBe('insufficient-samples');
    expect(snapshot.latestState).toBe('unvoiced');
    expect(snapshot.voicedDurationMs).toBe(0);
    expect(snapshot.unvoicedDurationMs).toBeCloseTo(500);
    expect(snapshot.centerFractionalMidi).toBeNull();
    expect(snapshot.spreadCents).toBeNull();
  });

  it('accounts intermittent silence as missing voice coverage', () => {
    const snapshot = trajectory((_, ms) =>
      ms >= 200 && ms < 300 ? 'silence' : 0,
    );
    expect(snapshot.unvoicedDurationMs).toBeGreaterThan(60);
    expect(snapshot.voicedCoverage).toBeLessThan(0.85);
    expect(snapshot.centerFractionalMidi).not.toBeNull();
  });

  it('excludes rejected observations and marks stale source evidence', () => {
    const snapshot = trajectory((_, ms) =>
      ms >= 200 && ms < 300 ? 'rejected' : 0,
    );
    expect(snapshot.uncertainDurationMs).toBeGreaterThan(60);
    expect(snapshot.voicedCoverage).toBeLessThan(0.85);
    const fixture = setup();
    fixture.publish(100, 0);
    fixture.publish(200, 0);
    expect(fixture.evidence.getSnapshot(500).latestState).toBe('stale');
    fixture.producer.invalidate('stale');
    expect(fixture.evidence.getSnapshot(500)).toMatchObject({
      latestState: 'stale',
      windowSufficiency: 'insufficient-samples',
      centerFractionalMidi: null,
    });
  });

  it('resists a single detector outlier while exposing its latest value', () => {
    const snapshot = trajectory((index) => (index === 8 ? 100 : 0));
    expect(target(snapshot).centerOffsetCents).toBeCloseTo(0);
    expect(snapshot.spreadCents).toBeCloseTo(0);
    const latestOutlier = trajectory((index) => (index === 15 ? 100 : 0));
    expect(target(latestOutlier).centerOffsetCents).toBeCloseTo(0);
    expect(target(latestOutlier).latestOffsetCents).toBeCloseTo(100);
  });

  it('weights unequal observation intervals rather than frame count', () => {
    const fixture = setup();
    fixture.publish(0, -20);
    fixture.publish(40, -20);
    fixture.publish(80, -20);
    fixture.publish(120, -20);
    fixture.publish(160, -20);
    fixture.publish(200, 20);
    fixture.publish(300, 20);
    fixture.publish(400, 20);
    fixture.publish(500, 20);
    const snapshot = fixture.evidence.getSnapshot(500);
    expect(snapshot.freshSampleCount).toBe(9);
    expect(snapshot.voicedDurationMs).toBeCloseTo(500);
    expect(target(snapshot).centerOffsetCents).toBeCloseTo(20);
    expect(snapshot.spreadCents).toBeGreaterThan(15);
  });

  it('reports a note transition as broad pitch evidence', () => {
    const snapshot = trajectory((_, ms) => (ms < 250 ? 0 : 100));
    expect(snapshot.spreadCents).toBeGreaterThan(40);
    expect(target(snapshot).latestOffsetCents).toBeCloseTo(100);
  });

  it('does not certify an incomplete startup window', () => {
    const fixture = setup();
    fixture.publish(0, 0);
    fixture.publish(33, 0);
    fixture.publish(66, 0);
    fixture.publish(99, 0);
    const snapshot = fixture.evidence.getSnapshot(100);
    expect(snapshot.windowSufficiency).toBe('insufficient-samples');
    expect(snapshot.unobservedDurationMs).toBeGreaterThan(0);
  });

  it('caps scheduler gaps and resets on a new session or disposal', () => {
    const fixture = setup();
    fixture.publish(0, 0);
    fixture.publish(400, 0);
    fixture.publish(500, 0);
    const snapshot = fixture.evidence.getSnapshot(500);
    expect(snapshot.voicedDurationMs).toBeCloseTo(200);
    expect(snapshot.unobservedDurationMs).toBeCloseTo(300);
    fixture.producer.beginSession(2);
    expect(fixture.evidence.getSnapshot(500).centerFractionalMidi).toBeNull();
    fixture.evidence.dispose();
    fixture.evidence.dispose();
    expect(fixture.evidence.getSnapshot(500).latestState).toBe('inactive');
  });

  it.each([0, 'silence', 'rejected'] as const)(
    'credits at most 100 ms to a pre-stall %s observation on recovery',
    (pitch) => {
      const fixture = setup();
      fixture.publish(1000, pitch);
      expect(fixture.evidence.getSnapshot(1251)).toMatchObject({
        latestState: 'stale',
        voicedDurationMs: 0,
        unvoicedDurationMs: 0,
        uncertainDurationMs: 0,
        unobservedDurationMs: 500,
      });
      fixture.publish(1300, pitch);
      const snapshot = fixture.evidence.getSnapshot(1310);
      expect(snapshot.voicedDurationMs).toBe(pitch === 0 ? 100 : 0);
      expect(snapshot.unvoicedDurationMs).toBe(pitch === 'silence' ? 100 : 0);
      expect(snapshot.uncertainDurationMs).toBe(pitch === 'rejected' ? 100 : 0);
      expect(snapshot.unobservedDurationMs).toBe(400);
    },
  );

  it('does not let a single pre-stall pitch dominate the recovered moving center', () => {
    const fixture = setup();
    fixture.publish(1000, -80);
    for (let index = 0; index <= 6; index += 1)
      fixture.publish(1300 + (index * 100) / 3, -20 + index * 10);
    const snapshot = fixture.evidence.getSnapshot(1510);
    // 90 ms before the stall (clipped at 1010) plus 200 ms after recovery.
    expect(snapshot.voicedDurationMs).toBeCloseTo(290);
    expect(snapshot.unobservedDurationMs).toBeCloseTo(210);
    expect(target(snapshot).centerOffsetCents).toBeCloseTo(-10);
    expect(target(snapshot).latestOffsetCents).toBeCloseTo(40);
    // A 250 ms cap would give the -80-cent frame 240 of 440 ms: a false center.
  });

  it.each([
    ['silence', 'unvoiced'],
    ['rejected', 'uncertain'],
  ] as const)(
    'keeps a strongly voiced window sufficient after latest %s',
    (pitch, latestState) => {
      const fixture = setup();
      for (let index = 0; index <= 14; index += 1)
        fixture.publish(1000 + index * 30, 2);
      fixture.publish(1450, pitch);
      // Production readers normally run after the newest source observation.
      const snapshot = fixture.evidence.getSnapshot(1500);
      expect(snapshot).toMatchObject({
        windowSufficiency: 'sufficient',
        latestState,
        latestFractionalMidi: null,
        voicedDurationMs: 450,
        voicedCoverage: 0.9,
        unvoicedDurationMs: 0,
        uncertainDurationMs: 0,
        unobservedDurationMs: 50,
      });
      expect(target(snapshot).centerOffsetCents).toBeCloseTo(2);
      expect(target(snapshot).latestOffsetCents).toBeNull();
    },
  );

  it('backfills a late consumer from the source without replaying a sample', () => {
    let now = 0;
    const producer = createPitchSource(() => now);
    producer.beginSession(1);
    for (let index = 0; index <= 15; index += 1) {
      now = (index * 500) / 15;
      producer.publish(
        createPitchDetection({ timestampMs: now, frequencyHz: 220 }),
        1,
      );
    }
    const evidence = createShortWindowPitchEvidence(producer.source);
    const snapshot = evidence.getSnapshot(500);
    expect(snapshot.freshSampleCount).toBe(16);
    expect(snapshot.voicedDurationMs).toBeCloseTo(500);
    expect(snapshot.windowSufficiency).toBe('sufficient');
    evidence.dispose();
  });

  it('projects targets without changing raw voice measurements', () => {
    const snapshot = trajectory(() => 20);
    expect(
      projectEvidenceToTarget(snapshot, TARGET_MIDI + 1)?.centerOffsetCents,
    ).toBeCloseTo(-80);
    expect(projectEvidenceToTarget(snapshot, 57.5)).toBeNull();
    expect(target(snapshot).centerOffsetCents).toBeCloseTo(20);
  });

  it('accounts window time exactly and credits no time to an open observation', () => {
    let seed = 7;
    const random = () => {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    for (let trial = 0; trial < 200; trial += 1) {
      const fixture = setup();
      const timestamps: number[] = [];
      for (let timestampMs = random() * 100; timestampMs < 1500;) {
        const roll = random();
        fixture.publish(
          timestampMs,
          roll < 0.6
            ? (random() - 0.5) * 200
            : roll < 0.8
              ? 'silence'
              : 'rejected',
        );
        timestamps.push(timestampMs);
        const gap = random();
        timestampMs +=
          gap < 0.7
            ? 20 + random() * 30
            : gap < 0.9
              ? 1 + random() * 5
              : 100 + random() * 500;
      }
      const nowMs = timestamps[timestamps.length - 1] + 1 + random() * 300;
      const snapshot = fixture.evidence.getSnapshot(nowMs);
      // Independent oracle: closed intervals, clipped to the window and 100 ms credit cap.
      let observedMs = 0;
      for (let index = 0; index + 1 < timestamps.length; index += 1) {
        if (timestamps[index] > nowMs) break;
        observedMs += Math.max(
          0,
          Math.min(nowMs, timestamps[index + 1], timestamps[index] + 100) -
            Math.max(snapshot.windowStartMs, timestamps[index]),
        );
      }
      const classifiedMs =
        snapshot.voicedDurationMs +
        snapshot.unvoicedDurationMs +
        snapshot.uncertainDurationMs;
      expect(classifiedMs).toBeCloseTo(observedMs, 9);
      expect(classifiedMs).toBeLessThanOrEqual(
        snapshot.windowDurationMs + 1e-9,
      );
      expect(classifiedMs + snapshot.unobservedDurationMs).toBeCloseTo(
        snapshot.windowDurationMs,
        9,
      );
    }
  });

  it('never grows evidence on idle reads and goes stale after the source age limit', () => {
    const fixture = setup();
    for (let index = 0; index <= 15; index += 1)
      fixture.publish((index * 500) / 15, 0);
    let previousVoicedMs = Infinity;
    for (const nowMs of [533, 600, 700, 749, 750]) {
      const snapshot = fixture.evidence.getSnapshot(nowMs);
      expect(snapshot.voicedDurationMs).toBeLessThanOrEqual(previousVoicedMs);
      expect(snapshot.unobservedDurationMs).toBeCloseTo(nowMs - 500);
      expect(snapshot.latestFractionalMidi).toBe(TARGET_MIDI);
      expect(snapshot.latestState).toBe('voiced');
      previousVoicedMs = snapshot.voicedDurationMs;
    }
    expect(fixture.evidence.getSnapshot(751)).toMatchObject({
      latestState: 'stale',
      windowSufficiency: 'insufficient-duration',
      latestFractionalMidi: null,
      voicedDurationMs: 249,
      centerFractionalMidi: TARGET_MIDI,
    });
  });

  it('keeps center and spread stable across observation cadences', () => {
    const cadences: number[][] = [30, 24, 20, 15].map((hz) =>
      Array.from(
        { length: Math.floor(500 / (1000 / hz)) + 1 },
        (_, index) => (index * 1000) / hz,
      ),
    );
    cadences.push(cadences[0].map((ms, index) => ms + ((index * 7) % 15) - 7));
    const measure = (
      pitch: (ms: number) => number,
    ): { center: number; spread: number; windowSufficiency: string }[] =>
      cadences.map((timestamps) => {
        const fixture = setup();
        for (const ms of timestamps) fixture.publish(1000 + ms, pitch(ms));
        const snapshot = fixture.evidence.getSnapshot(1533);
        return {
          center: target(snapshot).centerOffsetCents!,
          spread: snapshot.spreadCents!,
          windowSufficiency: snapshot.windowSufficiency,
        };
      });
    for (const result of measure(() => 20)) {
      expect(result).toMatchObject({
        windowSufficiency: 'sufficient',
        spread: 0,
      });
      expect(result.center).toBeCloseTo(20);
    }
    for (const result of measure((ms) => -20 + (40 * ms) / 500)) {
      expect(Math.abs(result.center)).toBeLessThan(5);
      expect(result.spread).toBeGreaterThan(12);
      expect(result.spread).toBeLessThan(18);
    }
    for (const result of measure(
      (ms) => 20 * Math.sin((2 * Math.PI * 5 * ms) / 1000),
    )) {
      // Phase strobing at commensurate cadences biases the median by up to ±10 c.
      expect(Math.abs(result.center)).toBeLessThanOrEqual(10);
      expect(result.spread).toBeGreaterThan(15);
      expect(result.spread).toBeLessThan(21);
    }
  });

  it('reports octave errors as evidence instead of correcting them', () => {
    const brief = trajectory((index) => (index >= 8 && index <= 10 ? 1200 : 0));
    expect(target(brief).centerOffsetCents).toBeCloseTo(0);
    expect(brief.spreadCents).toBeGreaterThanOrEqual(500);
    const sustained = trajectory(() => 1200);
    expect(target(sustained).centerOffsetCents).toBeCloseTo(1200);
    expect(sustained.spreadCents).toBeCloseTo(0);
    expect(target(sustained).latestOffsetCents).toBeCloseTo(1200);
  });
});
