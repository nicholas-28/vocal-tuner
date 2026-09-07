import { describe, expect, it } from 'vitest';
import { midiNoteToFrequency } from '../music/noteFrequency';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import {
  calculateTargetRelativeCents,
  classifyTargetDirection,
  classifyTargetDistance,
  comparePitchToTarget,
  createTargetNote,
  mapTargetCentsToMeter,
} from './targetPitchComparison';

function pitchAtMidi(midi: number) {
  return frequencyToMusicalPitch(midiNoteToFrequency(midi, 440))!;
}

describe('target pitch comparison', () => {
  it.each([
    [69, 69, 0],
    [69.01, 69, 1],
    [68.99, 69, -1],
    [70, 69, 100],
    [68, 69, -100],
    [81, 69, 1200],
    [57, 69, -1200],
  ])('calculates MIDI %s against %s as %s cents', (pitch, target, cents) => {
    expect(calculateTargetRelativeCents(pitch, target)).toBeCloseTo(cents, 8);
    const comparison = comparePitchToTarget(
      target,
      pitchAtMidi(pitch),
      'voiced',
    );
    expect(comparison.status).toBe('measured');
    if (comparison.status === 'measured')
      expect(comparison.measurement.targetRelativeCents).toBeCloseTo(cents, 8);
  });

  it('creates the persistent target identity from a valid MIDI note', () => {
    expect(createTargetNote(69)).toEqual({
      midiNote: 69,
      label: 'A4',
      frequencyHz: 440,
    });
    expect(createTargetNote(69.5)).toBeNull();
  });

  it.each([
    [-10, 'on-target'],
    [10, 'on-target'],
    [-10.001, 'below'],
    [10.001, 'above'],
  ] as const)('classifies direction at %s cents as %s', (cents, direction) => {
    expect(classifyTargetDirection(cents)).toBe(direction);
  });

  it.each([
    [10, 'on-target'],
    [10.001, 'close'],
    [25, 'close'],
    [25.001, 'far'],
    [99.999, 'far'],
    [100, 'different-note'],
    [-100, 'different-note'],
  ] as const)('classifies distance at %s cents as %s', (cents, band) => {
    expect(classifyTargetDistance(cents)).toBe(band);
  });

  it.each([
    [-51, 0, 'left'],
    [-50, 0, null],
    [0, 50, null],
    [50, 100, null],
    [51, 100, 'right'],
    [1200, 100, 'right'],
  ] as const)(
    'maps %s cents to %s%% with %s overflow',
    (cents, percent, side) => {
      expect(mapTargetCentsToMeter(cents)).toEqual({
        meterPercent: percent,
        offScaleDirection: side,
      });
    },
  );

  it('does not wrap the selected-target result to the nearest note', () => {
    expect(comparePitchToTarget(69, pitchAtMidi(70), 'voiced')).toMatchObject({
      measurement: {
        targetRelativeCents: 100,
        direction: 'above',
        distanceBand: 'different-note',
        offScaleDirection: 'right',
      },
    });
    expect(comparePitchToTarget(69, pitchAtMidi(68), 'voiced')).toMatchObject({
      measurement: {
        targetRelativeCents: -100,
        direction: 'below',
        distanceBand: 'different-note',
        offScaleDirection: 'left',
      },
    });
  });

  it('distinguishes inactive, no-pitch, uncertain, and measured states', () => {
    const pitch = pitchAtMidi(69.2);
    expect(comparePitchToTarget(null, pitch, 'voiced')).toEqual({
      status: 'inactive',
      target: null,
    });
    expect(comparePitchToTarget(69, null, 'unvoiced')).toMatchObject({
      status: 'no-pitch',
    });
    const uncertain = comparePitchToTarget(69, pitch, 'uncertain');
    expect(uncertain.status).toBe('uncertain');
    if (uncertain.status === 'uncertain')
      expect(uncertain.lastMeasured.targetRelativeCents).toBeCloseTo(20, 8);
    const measured = comparePitchToTarget(69, pitch, 'voiced');
    expect(measured.status).toBe('measured');
    if (measured.status === 'measured')
      expect(measured.measurement.targetRelativeCents).toBeCloseTo(20, 8);
  });

  it('rejects invalid inputs without mutating a detected pitch', () => {
    const pitch = pitchAtMidi(69);
    const snapshot = { ...pitch };
    expect(calculateTargetRelativeCents(Number.NaN, 69)).toBeNull();
    expect(
      calculateTargetRelativeCents(69, Number.POSITIVE_INFINITY),
    ).toBeNull();
    expect(mapTargetCentsToMeter(Number.NaN)).toBeNull();
    expect(comparePitchToTarget(69.5, pitch, 'voiced')).toMatchObject({
      status: 'inactive',
    });
    expect(pitch).toEqual(snapshot);
  });
});
