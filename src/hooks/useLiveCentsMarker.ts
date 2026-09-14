import { useEffect, useRef } from 'react';
import type { PitchSource } from '../pitch/pitchSource';
import {
  transitionLiveCentsDisplay,
  type LiveCentsDisplay,
} from '../tuner/liveCentsDisplay';
import { getCentsTensionGeometry } from '../tuner/centsTensionGeometry';

/** Owns only SVG geometry. Text/product state remain on the presentation path. */
export function useLiveCentsMarker(
  source: PitchSource | undefined,
  reducedMotion: boolean,
) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!source) return;
    let state: LiveCentsDisplay = null;
    let frame: number | null = null;
    const draw = () => {
      frame = null;
      state = transitionLiveCentsDisplay(
        state,
        source.getLatest(),
        performance.now(),
        reducedMotion,
      );
      const geometry = getCentsTensionGeometry(state?.cents ?? null);
      const element = ref.current;
      if (element) {
        element.dataset.visible = geometry ? 'true' : 'false';
        element.dataset.direction = geometry?.direction ?? 'center';
        if (geometry)
          element.dataset.endpoint = String(geometry.endpointPercent);
        else delete element.dataset.endpoint;
        element.querySelector('path')?.setAttribute('d', geometry?.path ?? '');
      }
      if (state) frame = requestAnimationFrame(draw);
    };
    const update = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      draw();
    };
    const unsubscribe = source.subscribe(update);
    update();
    return () => {
      unsubscribe();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [source, reducedMotion]);
  return ref;
}
