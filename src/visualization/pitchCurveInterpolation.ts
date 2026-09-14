export type CurveVertex = Readonly<{ x: number; y: number }>;
export type CurveBezier = Readonly<{
  from: CurveVertex;
  control1: CurveVertex;
  control2: CurveVertex;
  to: CurveVertex;
}>;

/** Shape-preserving cubic interpolation through every observed vertex, segment by segment.
 * Harmonic tangents vanish at reversals. Controls remain inside each endpoint interval,
 * so the Bezier convex hull cannot invent extrema, even at an abrupt note jump.
 */
export function interpolatePitchCurve(
  vertices: readonly CurveVertex[],
): CurveBezier[] {
  if (
    vertices.length < 2 ||
    vertices.some(
      (p, i) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        (i > 0 && p.x <= vertices[i - 1].x),
    )
  )
    return [];
  const widths = vertices.slice(1).map((p, i) => p.x - vertices[i].x);
  const slopes = widths.map(
    (width, i) => (vertices[i + 1].y - vertices[i].y) / width,
  );
  const tangents = vertices.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === vertices.length - 1) return slopes.at(-1)!;
    const before = slopes[i - 1],
      after = slopes[i];
    if (before * after <= 0) return 0;
    const a = 2 * widths[i] + widths[i - 1],
      b = widths[i] + 2 * widths[i - 1];
    return (a + b) / (a / before + b / after);
  });
  return slopes.map((_, i) => {
    const from = vertices[i],
      to = vertices[i + 1],
      third = widths[i] / 3;
    const clamp = (y: number) =>
      Math.max(Math.min(from.y, to.y), Math.min(Math.max(from.y, to.y), y));
    return {
      from,
      control1: { x: from.x + third, y: clamp(from.y + tangents[i] * third) },
      control2: { x: to.x - third, y: clamp(to.y - tangents[i + 1] * third) },
      to,
    };
  });
}
