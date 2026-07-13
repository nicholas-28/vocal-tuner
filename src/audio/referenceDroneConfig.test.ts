import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REFERENCE_DRONE_CONFIG,
  isValidReferenceDroneConfig,
  mapReferenceDroneVolumeToGain,
  normalizeReferenceDroneVolume,
} from './referenceDroneConfig';

describe('reference drone configuration', () => {
  it('defines a conservative finite sine envelope', () => {
    expect(isValidReferenceDroneConfig(DEFAULT_REFERENCE_DRONE_CONFIG)).toBe(
      true,
    );
    expect(DEFAULT_REFERENCE_DRONE_CONFIG).toMatchObject({
      oscillatorType: 'sine',
      attackSeconds: 0.05,
      releaseSeconds: 0.12,
      transitionSeconds: 0.07,
      volumeSmoothingSeconds: 0.03,
      defaultVolume: 0.25,
      maximumMasterGain: 0.16,
    });
  });

  it('maps clamped UI volume linearly to the capped master gain', () => {
    expect(mapReferenceDroneVolumeToGain(0)).toBe(0);
    expect(mapReferenceDroneVolumeToGain(0.25)).toBe(0.04);
    expect(mapReferenceDroneVolumeToGain(1)).toBe(0.16);
    expect(mapReferenceDroneVolumeToGain(-1)).toBe(0);
    expect(mapReferenceDroneVolumeToGain(2)).toBe(0.16);
    expect(normalizeReferenceDroneVolume(Number.NaN)).toBe(0.25);
    expect(normalizeReferenceDroneVolume(Number.POSITIVE_INFINITY)).toBe(0.25);
    expect(mapReferenceDroneVolumeToGain(0.75)).toBeGreaterThan(
      mapReferenceDroneVolumeToGain(0.5),
    );
  });

  it('rejects unsafe or non-finite configuration', () => {
    expect(
      isValidReferenceDroneConfig({
        ...DEFAULT_REFERENCE_DRONE_CONFIG,
        maximumMasterGain: 1,
      }),
    ).toBe(false);
    expect(
      isValidReferenceDroneConfig({
        ...DEFAULT_REFERENCE_DRONE_CONFIG,
        attackSeconds: Number.NaN,
      }),
    ).toBe(false);
  });
});
