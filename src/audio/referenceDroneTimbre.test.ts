import { describe, expect, it } from 'vitest';
import {
  createReferenceDroneTimbre,
  REFERENCE_DRONE_LOW_TIMBRE_MAX_MIDI,
  REFERENCE_DRONE_MIDDLE_TIMBRE_MAX_MIDI,
} from './referenceDroneTimbre';

describe('reference drone harmonic timbre', () => {
  it('keeps the fundamental exact and every partial at an integer multiple', () => {
    const a4 = createReferenceDroneTimbre(69, 440);
    expect(a4.partials[0]?.frequencyHz).toBe(440);
    expect(a4.partials.map((partial) => partial.frequencyHz)).toEqual([
      440, 880, 1320,
    ]);

    const c4 = createReferenceDroneTimbre(60, 261.6255653005986);
    expect(c4.partials[0]?.frequencyHz).toBeCloseTo(261.6255653005986, 10);
    for (const partial of c4.partials)
      expect(partial.frequencyHz).toBeCloseTo(
        261.6255653005986 * partial.harmonic,
        10,
      );
  });

  it('uses stronger low-note support and documented range boundaries', () => {
    const low = createReferenceDroneTimbre(
      REFERENCE_DRONE_LOW_TIMBRE_MAX_MIDI,
      123.47,
    );
    const middle = createReferenceDroneTimbre(
      REFERENCE_DRONE_LOW_TIMBRE_MAX_MIDI + 1,
      130.81,
    );
    const high = createReferenceDroneTimbre(
      REFERENCE_DRONE_MIDDLE_TIMBRE_MAX_MIDI + 1,
      277.18,
    );
    expect(low.profileId).toBe('low-harmonic-support');
    expect(middle.profileId).toBe('middle-harmonic-support');
    expect(high.profileId).toBe('light-harmonic-support');
    expect(low.partials[1]?.relativeAmplitude).toBeGreaterThan(
      middle.partials[1]?.relativeAmplitude ?? 0,
    );
    expect(middle.partials[1]?.relativeAmplitude).toBeGreaterThan(
      high.partials[1]?.relativeAmplitude ?? 0,
    );
  });

  it('normalizes the worst-case partial sum to preserve master headroom', () => {
    for (const midiNote of [36, 48, 60, 84]) {
      const timbre = createReferenceDroneTimbre(midiNote, 440);
      expect(timbre.normalizedAmplitudeSum).toBeCloseTo(1, 7);
      expect(
        timbre.partials.reduce(
          (sum, partial) => sum + partial.normalizedAmplitude,
          0,
        ),
      ).toBeCloseTo(1, 7);
      expect(
        Math.max(...timbre.partials.map((p) => p.normalizedAmplitude)),
      ).toBe(timbre.partials[0]?.normalizedAmplitude);
    }
  });
});
