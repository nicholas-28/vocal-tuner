import type { RawPitchDetection } from '../types/pitch';

export const pitchDetectorConfig = {
  minimumFrequencyHz: 65,
  maximumFrequencyHz: 1200,
  minimumRms: 0.01,
  minimumConfidence: 0.85,
  yinThreshold: 0.15,
} as const;

type PitchDetectorOptions = Partial<typeof pitchDetectorConfig> & {
  now?: () => number;
  differenceBuffer?: Float64Array;
};

export function detectPitchYin(
  samples: Float32Array,
  sampleRate: number,
  timestampMs: number,
  options: PitchDetectorOptions = {},
): RawPitchDetection {
  const config = { ...pitchDetectorConfig, ...options };
  const now = options.now ?? performance.now.bind(performance);
  const startedAt = now();
  const rms = calculateRms(samples);
  let frequencyHz: number | null = null;
  let confidence = 0;

  if (
    rms >= config.minimumRms &&
    Number.isFinite(sampleRate) &&
    sampleRate > 0
  ) {
    const minimumLag = Math.max(
      2,
      Math.floor(sampleRate / config.maximumFrequencyHz),
    );
    const maximumLag = Math.min(
      Math.floor(sampleRate / config.minimumFrequencyHz),
      Math.floor(samples.length / 2),
    );

    if (minimumLag < maximumLag) {
      const difference =
        options.differenceBuffer &&
        options.differenceBuffer.length >= maximumLag + 1
          ? options.differenceBuffer
          : new Float64Array(maximumLag + 1);
      difference.fill(0, 0, maximumLag + 1);
      for (let lag = 1; lag <= maximumLag; lag += 1) {
        let sum = 0;
        for (let index = 0; index < samples.length - lag; index += 1) {
          const delta = samples[index] - samples[index + lag];
          sum += delta * delta;
        }
        difference[lag] = sum;
      }

      let runningSum = 0;
      difference[0] = 1;
      for (let lag = 1; lag <= maximumLag; lag += 1) {
        runningSum += difference[lag];
        difference[lag] =
          runningSum === 0 ? 1 : (difference[lag] * lag) / runningSum;
      }

      let candidateLag = -1;
      for (let lag = 2; lag <= maximumLag; lag += 1) {
        if (difference[lag] < config.yinThreshold) {
          while (lag + 1 <= maximumLag && difference[lag + 1] < difference[lag])
            lag += 1;
          candidateLag = lag;
          break;
        }
      }

      if (candidateLag >= minimumLag) {
        confidence = clamp01(1 - difference[candidateLag]);
        const refinedLag = parabolicInterpolation(difference, candidateLag);
        const candidateFrequency = sampleRate / refinedLag;
        if (
          confidence >= config.minimumConfidence &&
          candidateFrequency >= config.minimumFrequencyHz &&
          candidateFrequency <= config.maximumFrequencyHz &&
          Number.isFinite(candidateFrequency)
        ) {
          frequencyHz = candidateFrequency;
        }
      }
    }
  }

  return {
    timestampMs,
    frequencyHz,
    confidence: clamp01(confidence),
    rms: Number.isFinite(rms) ? rms : 0,
    analysisDurationMs: Math.max(0, now() - startedAt),
  };
}

export function calculateRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sumSquares = 0;
  for (const sample of samples) sumSquares += sample * sample;
  return Math.sqrt(sumSquares / samples.length);
}

function parabolicInterpolation(values: Float64Array, index: number): number {
  if (index <= 1 || index >= values.length - 1) return index;
  const left = values[index - 1];
  const center = values[index];
  const right = values[index + 1];
  const denominator = 2 * (2 * center - right - left);
  return denominator === 0 ? index : index + (right - left) / denominator;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}
