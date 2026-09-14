import { describe, expect, it } from 'vitest';
import { interpolatePitchCurve } from './pitchCurveInterpolation';

function value(a: number, b: number, c: number, d: number, t: number) {
  return (
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t * t * c +
    t ** 3 * d
  );
}
describe('faithful graph interpolation', () => {
  it.each([
    [60, 60, 60, 60], // steady
    [60, 60.2, 59.8, 60.2, 60], // vibrato, extrema retained
    [60, 61, 62, 63], // glissando
    [60, 60, 67, 67], // interval jump
    [60, 65, 59, 63, 61], // irregular movement
  ])('passes through samples without overshoot for %j', (...ys) => {
    const vertices = Object.freeze(
      ys.map((y, i) => Object.freeze({ x: i * i * 17 + i * 50, y })),
    );
    const snapshot = JSON.stringify(vertices);
    const curves = interpolatePitchCurve(vertices);
    expect(curves).toHaveLength(vertices.length - 1);
    curves.forEach((curve, i) => {
      expect(curve.from).toBe(vertices[i]);
      expect(curve.to).toBe(vertices[i + 1]);
      for (let step = 0; step <= 100; step++) {
        const y = value(
          curve.from.y,
          curve.control1.y,
          curve.control2.y,
          curve.to.y,
          step / 100,
        );
        expect(y).toBeGreaterThanOrEqual(
          Math.min(curve.from.y, curve.to.y) - 1e-10,
        );
        expect(y).toBeLessThanOrEqual(
          Math.max(curve.from.y, curve.to.y) + 1e-10,
        );
      }
    });
    expect(JSON.stringify(vertices)).toBe(snapshot);
  });
  it('preserves a straight glide exactly rather than easing each interval', () => {
    for (const curve of interpolatePitchCurve([
      { x: 0, y: 60 },
      { x: 100, y: 61 },
      { x: 200, y: 62 },
    ])) {
      expect(
        value(
          curve.from.y,
          curve.control1.y,
          curve.control2.y,
          curve.to.y,
          0.25,
        ),
      ).toBeCloseTo(curve.from.y + 0.25, 10);
    }
  });
  it('rejects missing, invalid or non-forward vertices', () => {
    expect(interpolatePitchCurve([])).toEqual([]);
    expect(interpolatePitchCurve([{ x: 0, y: 60 }])).toEqual([]);
    expect(
      interpolatePitchCurve([
        { x: 0, y: 60 },
        { x: 0, y: 65 },
      ]),
    ).toEqual([]);
    expect(
      interpolatePitchCurve([
        { x: 0, y: 60 },
        { x: 1, y: NaN },
      ]),
    ).toEqual([]);
  });
});
