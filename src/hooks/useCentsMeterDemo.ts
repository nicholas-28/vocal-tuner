import { useEffect, useState } from 'react';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';

type CentsMeterDemoState = {
  pitch: MusicalPitch | null;
  status: PitchContinuityStatus;
  timestampMs: number | null;
};

type CentsMeterDemoDetail = {
  frequencyHz: number | null;
  status: PitchContinuityStatus;
  timestampMs: number | null;
};

const DEMO_EVENT = 'vocal-tuner:cents-meter-demo';

export function useCentsMeterDemo(): CentsMeterDemoState | null {
  const [state, setState] = useState<CentsMeterDemoState | null>(null);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('centsMeterDemo'))
      return;
    setState({ pitch: null, status: 'unvoiced', timestampMs: null });
    const onDemo = (event: Event) => {
      const detail = (event as CustomEvent<CentsMeterDemoDetail>).detail;
      if (!detail || !isContinuityStatus(detail.status)) return;
      const timestampMs =
        detail.timestampMs !== null &&
        Number.isFinite(detail.timestampMs) &&
        detail.timestampMs >= 0
          ? detail.timestampMs
          : null;
      const pitch = frequencyToMusicalPitch(detail.frequencyHz);
      setState({
        pitch: detail.status === 'unvoiced' ? null : pitch,
        status: pitch === null ? 'unvoiced' : detail.status,
        timestampMs,
      });
    };
    window.addEventListener(DEMO_EVENT, onDemo);
    return () => window.removeEventListener(DEMO_EVENT, onDemo);
  }, []);

  return state;
}

function isContinuityStatus(value: unknown): value is PitchContinuityStatus {
  return value === 'unvoiced' || value === 'voiced' || value === 'uncertain';
}
