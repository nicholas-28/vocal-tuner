import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => globalThis.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false,
  );

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!mediaQuery) return;
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return reducedMotion;
}
