import type {
  ReferenceDroneSignalClassification,
  ReferenceDroneSignalMeasurement,
} from '../types/referenceDrone';

export const REFERENCE_DRONE_SIGNAL_THRESHOLD = 1e-4;
export const REFERENCE_DRONE_SIGNAL_CONFIRMATION_SAMPLES = 3;
export const REFERENCE_DRONE_SIGNAL_INTERVAL_MS = 125;
export const REFERENCE_DRONE_ANALYSER_FFT_SIZE = 1024;

export function createInitialSignalMeasurement(): ReferenceDroneSignalMeasurement {
  return Object.freeze({
    classification: 'unknown',
    rms: null,
    peak: null,
    latestSampledTimestampMs: null,
    samplesInspected: 0,
    consecutiveActiveMeasurements: 0,
    consecutiveSilentMeasurements: 0,
    lastDigitallyActiveTimestampMs: null,
    analyserGenerationId: null,
    contextGenerationId: null,
    voiceGenerationId: null,
    analyserConnectedToDestination: false,
  });
}

export function measureReferenceDroneSignal(
  samples: Float32Array,
  previous: ReferenceDroneSignalMeasurement,
  timestampMs: number,
  generation: Readonly<{
    analyserGenerationId: number;
    contextGenerationId: number;
    voiceGenerationId: number | null;
    analyserConnectedToDestination: boolean;
  }>,
): ReferenceDroneSignalMeasurement {
  let sumSquares = 0;
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const candidate = samples[index] ?? 0;
    const sample = Number.isFinite(candidate) ? candidate : 0;
    sumSquares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  const rms = samples.length === 0 ? 0 : Math.sqrt(sumSquares / samples.length);
  const active =
    rms >= REFERENCE_DRONE_SIGNAL_THRESHOLD ||
    peak >= REFERENCE_DRONE_SIGNAL_THRESHOLD;
  const consecutiveActiveMeasurements = active
    ? previous.consecutiveActiveMeasurements + 1
    : 0;
  const consecutiveSilentMeasurements = active
    ? 0
    : previous.consecutiveSilentMeasurements + 1;
  let classification: ReferenceDroneSignalClassification = 'unknown';
  if (
    consecutiveActiveMeasurements >= REFERENCE_DRONE_SIGNAL_CONFIRMATION_SAMPLES
  )
    classification = 'digitally-active';
  else if (
    consecutiveSilentMeasurements >= REFERENCE_DRONE_SIGNAL_CONFIRMATION_SAMPLES
  )
    classification = 'digitally-silent';

  return Object.freeze({
    classification,
    rms,
    peak,
    latestSampledTimestampMs: timestampMs,
    samplesInspected: previous.samplesInspected + samples.length,
    consecutiveActiveMeasurements,
    consecutiveSilentMeasurements,
    lastDigitallyActiveTimestampMs: active
      ? timestampMs
      : previous.lastDigitallyActiveTimestampMs,
    ...generation,
  });
}
