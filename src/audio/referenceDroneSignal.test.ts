import { describe, expect, it } from 'vitest';
import {
  createInitialSignalMeasurement,
  measureReferenceDroneSignal,
  REFERENCE_DRONE_SIGNAL_THRESHOLD,
} from './referenceDroneSignal';

const generation = {
  analyserGenerationId: 2,
  contextGenerationId: 3,
  voiceGenerationId: 4,
  analyserConnectedToDestination: true,
};

describe('reference drone signal measurement', () => {
  it('calculates RMS and peak and confirms activity after three measurements', () => {
    const samples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
    let result = createInitialSignalMeasurement();
    result = measureReferenceDroneSignal(samples, result, 10, generation);
    expect(result).toMatchObject({
      classification: 'unknown',
      rms: 0.5,
      peak: 0.5,
    });
    result = measureReferenceDroneSignal(samples, result, 20, generation);
    result = measureReferenceDroneSignal(samples, result, 30, generation);
    expect(result).toMatchObject({
      classification: 'digitally-active',
      consecutiveActiveMeasurements: 3,
      samplesInspected: 12,
      lastDigitallyActiveTimestampMs: 30,
    });
  });

  it('confirms digital silence after three measurements', () => {
    const zeros = new Float32Array(8);
    let result = createInitialSignalMeasurement();
    for (let index = 0; index < 3; index += 1)
      result = measureReferenceDroneSignal(zeros, result, index, generation);
    expect(result).toMatchObject({
      classification: 'digitally-silent',
      rms: 0,
      peak: 0,
      consecutiveSilentMeasurements: 3,
    });
  });

  it('uses the centralized threshold', () => {
    const samples = new Float32Array([REFERENCE_DRONE_SIGNAL_THRESHOLD / 2]);
    const result = measureReferenceDroneSignal(
      samples,
      createInitialSignalMeasurement(),
      1,
      generation,
    );
    expect(result.consecutiveSilentMeasurements).toBe(1);
  });
});
