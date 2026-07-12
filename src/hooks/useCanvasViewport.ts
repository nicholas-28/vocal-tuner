import { useLayoutEffect, useRef, useState } from 'react';
import { normalizeDevicePixelRatio } from '../visualization/pitchGridViewport';

export type CanvasViewportSize = {
  widthCssPx: number;
  heightCssPx: number;
  devicePixelRatio: number;
};

const INITIAL_SIZE: CanvasViewportSize = {
  widthCssPx: 0,
  heightCssPx: 0,
  devicePixelRatio: 1,
};

export function useCanvasViewport<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [size, setSize] = useState<CanvasViewportSize>(INITIAL_SIZE);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const update = (width: number, height: number) => {
      const next = {
        widthCssPx: Number.isFinite(width) && width > 0 ? width : 0,
        heightCssPx: Number.isFinite(height) && height > 0 ? height : 0,
        devicePixelRatio: normalizeDevicePixelRatio(window.devicePixelRatio),
      };
      setSize((current) =>
        current.widthCssPx === next.widthCssPx &&
        current.heightCssPx === next.heightCssPx &&
        current.devicePixelRatio === next.devicePixelRatio
          ? current
          : next,
      );
    };

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(([entry]) => {
        if (entry) update(entry.contentRect.width, entry.contentRect.height);
      });
      observer.observe(element);
      const measureDprChange = () => {
        const rect = element.getBoundingClientRect();
        update(rect.width, rect.height);
      };
      window.addEventListener('resize', measureDprChange);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', measureDprChange);
      };
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      update(rect.width, rect.height);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return { elementRef, size };
}
