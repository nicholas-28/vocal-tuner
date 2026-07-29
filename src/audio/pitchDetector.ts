import type {
  PitchDetectorSettings,
  PitchRejectionReason,
  RawPitchDetection,
} from '../types/pitch';

export const pitchDetectorConfig = {
  minimumFrequencyHz: 65,
  maximumFrequencyHz: 1200,
  minimumRms: 0.005,
  minimumConfidence: 0.7,
  yinThreshold: 0.35,
} as const;

type DetectorConfig = {
  minimumFrequencyHz: number;
  maximumFrequencyHz: number;
  minimumRms: number;
  minimumConfidence: number;
  yinThreshold: number;
};

type PitchDetectorOptions = Partial<DetectorConfig> & {
  now?: () => number;
  differenceBuffer?: Float64Array;
  centeredBuffer?: Float32Array;
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
  const settings = createSettings(sampleRate, samples.length, config);
  let signalPassed = rms >= config.minimumRms;
  let selectedLag: number | null = null;
  let rawCandidateFrequencyHz: number | null = null;
  let minimumYinValue: number | null = null;
  let selectedYinValue: number | null = null;
  let rawConfidence = 0;
  let confidence = 0;
  let frequencyHz: number | null = null;
  let rejectionReason: PitchRejectionReason = signalPassed
    ? 'no-candidate'
    : 'silence';

  if (signalPassed && Number.isFinite(sampleRate) && sampleRate > 0) {
    const minimumLag = Math.max(
      2,
      Math.floor(sampleRate / config.maximumFrequencyHz),
    );
    const maximumLag = Math.min(
      Math.ceil(sampleRate / config.minimumFrequencyHz),
      Math.floor(samples.length / 2),
    );

    if (minimumLag < maximumLag) {
      const centered = getCenteredSamples(samples, options.centeredBuffer);
      const difference = getDifferenceBuffer(
        maximumLag,
        options.differenceBuffer,
      );
      calculateDifference(centered, difference, maximumLag);
      normalizeDifference(difference, maximumLag);

      const thresholdCandidate = findThresholdCandidate(
        difference,
        minimumLag,
        maximumLag,
        config.yinThreshold,
      );
      const bestAllowedCandidate = findMinimumIndex(
        difference,
        minimumLag,
        maximumLag,
      );
      const candidate = chooseCandidate(
        difference,
        thresholdCandidate,
        bestAllowedCandidate,
      );
      minimumYinValue =
        bestAllowedCandidate === null ? null : difference[bestAllowedCandidate];

      if (candidate !== null) {
        selectedLag = candidate;
        selectedYinValue = difference[candidate];
        rawConfidence = clamp01(1 - selectedYinValue);
        const refinedLag = parabolicInterpolation(difference, candidate);
        const candidateFrequency = sampleRate / refinedLag;
        rawCandidateFrequencyHz = Number.isFinite(candidateFrequency)
          ? candidateFrequency
          : null;

        if (rawCandidateFrequencyHz === null || refinedLag <= 0) {
          rejectionReason = 'invalid-frequency';
        } else if (
          rawCandidateFrequencyHz < config.minimumFrequencyHz ||
          rawCandidateFrequencyHz > config.maximumFrequencyHz
        ) {
          rejectionReason = 'out-of-range';
        } else if (selectedYinValue > config.yinThreshold) {
          rejectionReason = 'yin-threshold';
        } else if (rawConfidence < config.minimumConfidence) {
          rejectionReason = 'low-confidence';
        } else {
          frequencyHz = rawCandidateFrequencyHz;
          confidence = rawConfidence;
          rejectionReason = 'detected';
        }
      }
    }
  } else if (signalPassed) {
    signalPassed = false;
    rejectionReason = 'detector-error';
  }

  return {
    timestampMs,
    frequencyHz,
    confidence,
    rms: Number.isFinite(rms) ? rms : 0,
    signalPassed,
    selectedLag,
    rawCandidateFrequencyHz,
    minimumYinValue,
    selectedYinValue,
    rawConfidence,
    rejectionReason,
    analysisDurationMs: Math.max(0, now() - startedAt),
    settings,
  };
}

export function calculateRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sumSquares = 0;
  for (const sample of samples) sumSquares += sample * sample;
  return Math.sqrt(sumSquares / samples.length);
}

function getCenteredSamples(samples: Float32Array, reusable?: Float32Array) {
  const centered =
    reusable && reusable.length >= samples.length
      ? reusable
      : new Float32Array(samples.length);
  let mean = 0;
  for (const sample of samples) mean += sample;
  mean /= samples.length;
  for (let index = 0; index < samples.length; index += 1) {
    centered[index] = samples[index] - mean;
  }
  return centered;
}

function getDifferenceBuffer(maximumLag: number, reusable?: Float64Array) {
  const difference =
    reusable && reusable.length >= maximumLag + 1
      ? reusable
      : new Float64Array(maximumLag + 1);
  difference.fill(0, 0, maximumLag + 1);
  return difference;
}

function calculateDifference(
  samples: Float32Array,
  difference: Float64Array,
  maximumLag: number,
) {
  for (let lag = 1; lag <= maximumLag; lag += 1) {
    let sum = 0;
    for (let index = 0; index < samples.length - lag; index += 1) {
      const delta = samples[index] - samples[index + lag];
      sum += delta * delta;
    }
    difference[lag] = sum;
  }
}

function normalizeDifference(difference: Float64Array, maximumLag: number) {
  let runningSum = 0;
  difference[0] = 1;
  for (let lag = 1; lag <= maximumLag; lag += 1) {
    runningSum += difference[lag];
    difference[lag] =
      runningSum === 0 ? 1 : (difference[lag] * lag) / runningSum;
  }
}

function findThresholdCandidate(
  difference: Float64Array,
  minimumLag: number,
  maximumLag: number,
  threshold: number,
): number | null {
  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    if (difference[lag] < threshold) {
      while (lag + 1 <= maximumLag && difference[lag + 1] < difference[lag])
        lag += 1;
      return lag;
    }
  }
  return null;
}

function findMinimumIndex(
  values: Float64Array,
  start: number,
  end: number,
): number | null {
  let minimumIndex: number | null = null;
  let minimumValue = Number.POSITIVE_INFINITY;
  for (let index = start; index <= end; index += 1) {
    if (values[index] < minimumValue) {
      minimumValue = values[index];
      minimumIndex = index;
    }
  }
  return minimumIndex;
}

function chooseCandidate(
  values: Float64Array,
  thresholdCandidate: number | null,
  bestAllowedCandidate: number | null,
): number | null {
  if (thresholdCandidate === null) return bestAllowedCandidate;
  if (bestAllowedCandidate === null) return thresholdCandidate;

  // A strong upper harmonic can create an early half-period crossing. Prefer the
  // full-period candidate only when the early candidate is imperfect, the later
  // period is approximately double, and its normalized difference is materially lower.
  const lagRatio = bestAllowedCandidate / thresholdCandidate;
  return values[thresholdCandidate] > 0.1 &&
    lagRatio >= 1.8 &&
    lagRatio <= 2.2 &&
    values[bestAllowedCandidate] < values[thresholdCandidate] * 0.75
    ? bestAllowedCandidate
    : thresholdCandidate;
}

function parabolicInterpolation(values: Float64Array, index: number): number {
  if (index <= 1 || index >= values.length - 1) return index;
  const left = values[index - 1];
  const center = values[index];
  const right = values[index + 1];
  const denominator = 2 * (2 * center - right - left);
  const refined =
    denominator === 0 ? index : index + (right - left) / denominator;
  return Number.isFinite(refined) && refined > 0 ? refined : index;
}

function createSettings(
  sampleRate: number,
  fftSize: number,
  config: DetectorConfig,
): PitchDetectorSettings {
  return {
    sampleRate,
    fftSize,
    windowDurationMs: sampleRate > 0 ? (fftSize / sampleRate) * 1000 : 0,
    minimumFrequencyHz: config.minimumFrequencyHz,
    maximumFrequencyHz: config.maximumFrequencyHz,
    minimumRms: config.minimumRms,
    yinThreshold: config.yinThreshold,
    minimumConfidence: config.minimumConfidence,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}
