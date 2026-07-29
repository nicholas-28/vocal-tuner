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

function harmonicWave(
  frequencyHz: number,
  amplitudes = [1, 0.5, 0.25],
  noiseAmplitude = 0,
) {
  let seed = 246813579;
  return Float32Array.from({ length: sampleCount }, (_, index) => {
    let value = 0;
    amplitudes.forEach((amplitude, harmonicIndex) => {
      value +=
        amplitude *
        Math.sin(
          (2 * Math.PI * frequencyHz * (harmonicIndex + 1) * index) /
            sampleRate,
        );
    });
    seed = (1664525 * seed + 1013904223) >>> 0;
    return value * 0.2 + (seed / 0xffffffff - 0.5) * noiseAmplitude;
  });
}

function modulatedWave(frequencyHz: number) {
  let phase = 0;
  return Float32Array.from({ length: sampleCount }, (_, index) => {
    const time = index / sampleRate;
    const instantaneousFrequency =
      frequencyHz * 2 ** ((20 * Math.sin(2 * Math.PI * 5 * time)) / 1200);
    phase += (2 * Math.PI * instantaneousFrequency) / sampleRate;
    const amplitude =
      Math.min(1, index / 500) *
      (0.65 + 0.15 * Math.sin(2 * Math.PI * 3 * time));
    return 0.4 * amplitude * Math.sin(phase);
  });
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

  it('rejects frequencies below the configured range', () => {
    expect(detectPitchYin(sineWave(40), sampleRate, 0).frequencyHz).toBeNull();
  });

  it('reports a sub-multiple for periodic signals above the range ceiling', () => {
    // The bounded search starts at minimumLag, so it can never reach the
    // true ~32-sample period of a 1500 Hz tone (minimumLag is 40 at 48 kHz
    // with a 1200 Hz ceiling). A periodic signal has a valid, near-zero
    // normalized-difference minimum at every integer multiple of its true
    // period, so the search instead locks onto the first such multiple
    // that falls inside the configured lag range — here, twice the true
    // period, an apparent 750 Hz — and reports it as a confident, in-range
    // detection. This is an accepted limitation of the bounded search, not
    // a bug: see "Known limitations" in docs/PITCH_DETECTION_SPIKE.md.
    const high = detectPitchYin(sineWave(1500), sampleRate, 0);
    expect(high.rejectionReason).toBe('detected');
    expect(high.frequencyHz).toBeCloseTo(750, 0);
    expect(high.rawCandidateFrequencyHz).toBeCloseTo(750, 0);
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
    expect(result.rejectionReason).toBe('yin-threshold');
    expect(result.rawCandidateFrequencyHz).not.toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    for (const value of Object.values(result)) {
      if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('reports no candidate when the buffer cannot represent the lag range', () => {
    const result = detectPitchYin(
      Float32Array.from([0.1, -0.1]),
      sampleRate,
      0,
    );
    expect(result.rejectionReason).toBe('no-candidate');
    expect(result.rawCandidateFrequencyHz).toBeNull();
  });

  it.each([110, 220, 261.63, 440])(
    'detects a vocal-like harmonic signal at %s Hz',
    (frequencyHz) => {
      const result = detectPitchYin(harmonicWave(frequencyHz), sampleRate, 0);
      expect(result.frequencyHz).toBeCloseTo(frequencyHz, 0);
      expect(result.rejectionReason).toBe('detected');
    },
  );

  it('finds a weak fundamental when the second harmonic is stronger', () => {
    const result = detectPitchYin(
      harmonicWave(220, [0.3, 1, 0.2]),
      sampleRate,
      0,
    );
    expect(result.frequencyHz).toBeCloseTo(220, 0);
  });

  it('handles harmonic noise, DC offset, and amplitude changes', () => {
    const noisy = detectPitchYin(
      harmonicWave(220, undefined, 0.015),
      sampleRate,
      0,
    );
    const offsetSignal = harmonicWave(261.63);
    for (let index = 0; index < offsetSignal.length; index += 1) {
      offsetSignal[index] += 0.04;
    }
    const offset = detectPitchYin(offsetSignal, sampleRate, 0);
    const modulated = detectPitchYin(modulatedWave(220), sampleRate, 0);

    expect(noisy.frequencyHz).toBeCloseTo(220, 0);
    expect(offset.frequencyHz).toBeCloseTo(261.63, 0);
    expect(offset.rms).toBeGreaterThan(0.04);
    expect(modulated.frequencyHz).toBeGreaterThan(215);
    expect(modulated.frequencyHz).toBeLessThan(225);
  });

  it('detects an attack followed by sustain and mild vibrato', () => {
    const result = detectPitchYin(modulatedWave(440), sampleRate, 0);
    expect(result.frequencyHz).not.toBeNull();
    expect(result.frequencyHz).toBeGreaterThan(430);
    expect(result.frequencyHz).toBeLessThan(450);
  });

  it('rejects deterministic breath-like high-passed noise', () => {
    let seed = 987654321;
    let previous = 0;
    const breath = Float32Array.from({ length: sampleCount }, () => {
      seed = (1103515245 * seed + 12345) >>> 0;
      const noise = (seed / 0xffffffff - 0.5) * 0.08;
      const highPassed = noise - previous * 0.96;
      previous = noise;
      return highPassed;
    });
    const result = detectPitchYin(breath, sampleRate, 0);
    expect(result.frequencyHz).toBeNull();
    expect(result.rejectionReason).not.toBe('detected');
  });

  it('exposes raw candidates and precise rejection stages before filtering', () => {
    const confidenceRejected = detectPitchYin(sineWave(220), sampleRate, 0, {
      minimumConfidence: 1.01,
    });
    expect(confidenceRejected.frequencyHz).toBeNull();
    expect(confidenceRejected.rawCandidateFrequencyHz).toBeCloseTo(220, 0);
    expect(confidenceRejected.rawConfidence).toBeGreaterThan(0);
    expect(confidenceRejected.rejectionReason).toBe('low-confidence');

    const yinRejected = detectPitchYin(harmonicWave(220), sampleRate, 0, {
      yinThreshold: 0,
    });
    expect(yinRejected.rawCandidateFrequencyHz).toBeCloseTo(220, 0);
    expect(yinRejected.rejectionReason).toBe('yin-threshold');
  });

  it('uses named RMS boundaries while preserving raw input', () => {
    const quiet = detectPitchYin(sineWave(220, 0.004), sampleRate, 0);
    const audible = detectPitchYin(sineWave(220, 0.008), sampleRate, 0);
    expect(quiet.rejectionReason).toBe('silence');
    expect(quiet.signalPassed).toBe(false);
    expect(audible.rejectionReason).toBe('detected');
  });

  it('holds the fundamental through an onset burst of band-limited noise above 2 kHz', () => {
    // A short resonant burst centered at 2500 Hz (well above maximumFrequencyHz)
    // dips the normalized difference below yinThreshold at a lag under the
    // minimumLag bound (40 at 48 kHz / 1200 Hz), simulating a sibilant or
    // breath onset riding on a steady 110 Hz voiced tone.
    const burstWidth = 60;
    const centerHz = 2500;
    const q = 15;
    const burstAmplitude = 65;
    const w0 = (2 * Math.PI * centerHz) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const b0 = alpha;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    let seed = 1;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    const burst = new Float64Array(burstWidth + 100);
    for (let index = 0; index < burst.length; index += 1) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const x0 = seed / 0xffffffff - 0.5;
      const y0 = (b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      burst[index] = y0;
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    const signal = Float32Array.from({ length: sampleCount }, (_, index) => {
      const fundamental = 0.5 * Math.sin((2 * Math.PI * 110 * index) / sampleRate);
      const noiseValue = index < burstWidth ? burst[100 + index] : 0;
      return fundamental + burstAmplitude * noiseValue;
    });

    const result = detectPitchYin(signal, sampleRate, 0);

    expect(result.rejectionReason).toBe('detected');
    expect(result.frequencyHz).not.toBeNull();
    expect(Math.abs((result.frequencyHz ?? 0) - 110)).toBeLessThan(1);
  });
});
