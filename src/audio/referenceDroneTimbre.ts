import type {
  ReferenceDronePartialDiagnostics,
  ReferenceDroneTimbreProfileId,
} from '../types/referenceDrone';

type TimbreDefinition = Readonly<{
  id: ReferenceDroneTimbreProfileId;
  relativeAmplitudes: readonly number[];
}>;

const LOW_TIMBRE: TimbreDefinition = Object.freeze({
  id: 'low-harmonic-support',
  relativeAmplitudes: Object.freeze([1, 0.3, 0.15, 0.06]),
});
const MIDDLE_TIMBRE: TimbreDefinition = Object.freeze({
  id: 'middle-harmonic-support',
  relativeAmplitudes: Object.freeze([1, 0.24, 0.1, 0.04]),
});
const HIGH_TIMBRE: TimbreDefinition = Object.freeze({
  id: 'light-harmonic-support',
  relativeAmplitudes: Object.freeze([1, 0.12, 0.04]),
});

export const REFERENCE_DRONE_LOW_TIMBRE_MAX_MIDI = 47;
export const REFERENCE_DRONE_MIDDLE_TIMBRE_MAX_MIDI = 60;

export type ReferenceDroneTimbre = Readonly<{
  profileId: ReferenceDroneTimbreProfileId;
  partials: readonly ReferenceDronePartialDiagnostics[];
  periodicWaveReal: Float32Array;
  periodicWaveImag: Float32Array;
  normalizedAmplitudeSum: number;
}>;

export function createReferenceDroneTimbre(
  midiNote: number,
  fundamentalFrequencyHz: number,
): ReferenceDroneTimbre {
  const definition = selectDefinition(midiNote);
  const total = definition.relativeAmplitudes.reduce(
    (sum, amplitude) => sum + amplitude,
    0,
  );
  const real = new Float32Array(definition.relativeAmplitudes.length + 1);
  const imaginary = new Float32Array(real.length);
  const partials = definition.relativeAmplitudes.map(
    (relativeAmplitude, index) => {
      const harmonic = index + 1;
      const normalizedAmplitude = relativeAmplitude / total;
      imaginary[harmonic] = normalizedAmplitude;
      return Object.freeze({
        harmonic,
        frequencyHz: fundamentalFrequencyHz * harmonic,
        relativeAmplitude,
        normalizedAmplitude,
      });
    },
  );
  return Object.freeze({
    profileId: definition.id,
    partials: Object.freeze(partials),
    periodicWaveReal: real,
    periodicWaveImag: imaginary,
    normalizedAmplitudeSum: partials.reduce(
      (sum, partial) => sum + partial.normalizedAmplitude,
      0,
    ),
  });
}

function selectDefinition(midiNote: number): TimbreDefinition {
  if (midiNote <= REFERENCE_DRONE_LOW_TIMBRE_MAX_MIDI) return LOW_TIMBRE;
  if (midiNote <= REFERENCE_DRONE_MIDDLE_TIMBRE_MAX_MIDI) return MIDDLE_TIMBRE;
  return HIGH_TIMBRE;
}
