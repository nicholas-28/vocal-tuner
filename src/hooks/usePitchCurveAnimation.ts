import { useEffect, useLayoutEffect, useRef } from 'react';

type PitchCurveAnimationOptions = {
  active: boolean;
  fallbackReferenceTimeMs: number | null;
  draw: (referenceTimeMs: number) => void;
};

export function usePitchCurveAnimation({
  active,
  fallbackReferenceTimeMs,
  draw,
}: PitchCurveAnimationOptions): void {
  const drawRef = useRef(draw);
  const frozenReferenceTimeRef = useRef<number | null>(null);
  drawRef.current = draw;

  useLayoutEffect(() => {
    let referenceTimeMs = active
      ? performance.now()
      : (frozenReferenceTimeRef.current ?? fallbackReferenceTimeMs);
    if (referenceTimeMs !== null && Number.isFinite(referenceTimeMs)) {
      if (active) {
        referenceTimeMs = Math.max(
          frozenReferenceTimeRef.current ?? 0,
          referenceTimeMs,
        );
        frozenReferenceTimeRef.current = referenceTimeMs;
      }
      drawRef.current(referenceTimeMs);
    }
  }, [active, fallbackReferenceTimeMs, draw]);

  useEffect(() => {
    if (!active) return;
    let animationFrameId: number | null = null;
    let mounted = true;
    const frame = (timestampMs: number) => {
      if (!mounted) return;
      const referenceTimeMs = Math.max(
        frozenReferenceTimeRef.current ?? 0,
        timestampMs,
      );
      frozenReferenceTimeRef.current = referenceTimeMs;
      drawRef.current(referenceTimeMs);
      animationFrameId = requestAnimationFrame(frame);
    };
    animationFrameId = requestAnimationFrame(frame);
    return () => {
      mounted = false;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    };
  }, [active]);
}
