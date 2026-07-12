import { describe, expect, it } from 'vitest';
import { detectPitchYin } from './pitchDetector';

const sampleRate = 48_000;
const sampleCount = 4096;

function sineWave(frequencyHz: number, amplitude = 0.5, phase = 0) {
  return Float32Array.from(
    { length: sampleCount },
    (_, index) =>
      amplitude *
      Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate + phase),
  );
}

describe('YIN pitch detector', () => {
  it.each([110, 220, 261.63, 440, 880])(
    'detects a %s Hz sine wave',
    (frequencyHz) => {
      const result = detectPitchYin(sineWave(frequencyHz), sampleRate, 100, {
        now: () => 5,
      });

      expect(result.frequencyHz).not.toBeNull();
      expect(result.frequencyHz).toBeCloseTo(frequencyHz, 0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.timestampMs).toBe(100);
      expect(result.analysisDurationMs).toBe(0);
    },
  );

  it('returns no pitch for silence and very low amplitude', () => {
    expect(
      detectPitchYin(new Float32Array(sampleCount), sampleRate, 0).frequencyHz,
    ).toBeNull();
    expect(
      detectPitchYin(sineWave(220, 0.001), sampleRate, 0).frequencyHz,
    ).toBeNull();
  });

  it('rejects frequencies outside the configured range', () => {
    expect(detectPitchYin(sineWave(40), sampleRate, 0).frequencyHz).toBeNull();
    expect(
      detectPitchYin(sineWave(1500), sampleRate, 0).frequencyHz,
    ).toBeNull();
  });

  it('is stable across amplitude and phase changes without mutating input', () => {
    const input = sineWave(440, 0.15, Math.PI / 3);
    const original = input.slice();
    const quieter = detectPitchYin(input, sampleRate, 0);
    const louder = detectPitchYin(sineWave(440, 0.8), sampleRate, 0);

    expect(quieter.frequencyHz).toBeCloseTo(440, 0);
    expect(louder.frequencyHz).toBeCloseTo(440, 0);
    expect(quieter.frequencyHz).toBeCloseTo(louder.frequencyHz ?? 0, 1);
    expect(input).toEqual(original);
  });

  it('does not report random noise as a confident stable pitch', () => {
    let seed = 123456789;
    const noise = Float32Array.from({ length: sampleCount }, () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return (seed / 0xffffffff - 0.5) * 0.5;
    });
    const result = detectPitchYin(noise, sampleRate, 0);

    expect(result.frequencyHz).toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    for (const value of Object.values(result)) {
      if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    }
  });
});
