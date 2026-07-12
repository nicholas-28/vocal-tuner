import { useEffect, useLayoutEffect, useRef } from 'react';

type PitchCurveAnimationOptions = {
  active: boolean;
  fallbackReferenceTimeMs: number | null;
  inactiveReferenceTimeMs?: number | null;
  resetKey?: number;
  toReferenceTime?: (sourceTimestampMs: number) => number | null;
  draw: (referenceTimeMs: number) => void;
};

export function usePitchCurveAnimation({
  active,
  fallbackReferenceTimeMs,
  inactiveReferenceTimeMs = null,
  resetKey = 0,
  toReferenceTime = identityTimestamp,
  draw,
}: PitchCurveAnimationOptions): void {
  const drawRef = useRef(draw);
  const toReferenceTimeRef = useRef(toReferenceTime);
  const frozenReferenceTimeRef = useRef<number | null>(null);
  const resetKeyRef = useRef(resetKey);
  drawRef.current = draw;
  toReferenceTimeRef.current = toReferenceTime;
  if (resetKeyRef.current !== resetKey) {
    resetKeyRef.current = resetKey;
    frozenReferenceTimeRef.current = null;
  }

  useLayoutEffect(() => {
    if (
      !active &&
      inactiveReferenceTimeMs !== null &&
      Number.isFinite(inactiveReferenceTimeMs)
    ) {
      frozenReferenceTimeRef.current = Math.max(
        frozenReferenceTimeRef.current ?? 0,
        inactiveReferenceTimeMs,
      );
    }
    let referenceTimeMs = active
      ? toReferenceTimeRef.current(performance.now())
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
  }, [active, fallbackReferenceTimeMs, inactiveReferenceTimeMs, draw]);

  useEffect(() => {
    if (!active) return;
    let animationFrameId: number | null = null;
    let mounted = true;
    const frame = (timestampMs: number) => {
      if (!mounted) return;
      const mappedTimestampMs = toReferenceTimeRef.current(timestampMs);
      if (mappedTimestampMs === null || !Number.isFinite(mappedTimestampMs)) {
        animationFrameId = requestAnimationFrame(frame);
        return;
      }
      const referenceTimeMs = Math.max(
        frozenReferenceTimeRef.current ?? 0,
        mappedTimestampMs,
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

function identityTimestamp(sourceTimestampMs: number): number | null {
  return Number.isFinite(sourceTimestampMs) ? sourceTimestampMs : null;
}
