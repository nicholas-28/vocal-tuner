import { expect, it } from 'vitest';
import { classifyPitchAccuracy } from '../calibration/pitchCalibration';
import { transitionAccuracyLabel } from './labelHysteresis';

it.each([-25, -10, -5, 5, 10, 25])(
  'reduces flicker at %s without moving calibration thresholds',
  (boundary) => {
    let label = transitionAccuracyLabel(null, boundary);
    const initial = label;
    const rawLabels = new Set();
    for (let i = 0; i < 30; i++) {
      const cents = boundary + (i % 2 ? 0.8 : -0.8);
      rawLabels.add(classifyPitchAccuracy(cents));
      label = transitionAccuracyLabel(label, cents);
      expect(label).toBe(initial);
    }
    expect(rawLabels.size).toBe(2);
    const outward = Math.sign(boundary) * (Math.abs(boundary) + 2.1);
    expect(transitionAccuracyLabel(label, outward)).not.toBe(initial);
    expect(
      transitionAccuracyLabel(
        transitionAccuracyLabel(label, outward),
        Math.sign(boundary) * (Math.abs(boundary) - 2.1),
      ),
    ).toBe(initial);
  },
);
it('handles big jumps, zero, and unavailable evidence immediately', () => {
  expect(transitionAccuracyLabel('outside', 0)).toBe('dead-center');
  expect(transitionAccuracyLabel('dead-center', 40)).toBe('outside');
  expect(transitionAccuracyLabel('close', null)).toBeNull();
  expect(transitionAccuracyLabel('close', NaN)).toBeNull();
});
