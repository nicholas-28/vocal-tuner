import { isFreshPitchSample, type PitchSample } from '../pitch/pitchSource';
import { smoothVisualCents } from './visualResponse';

export type LiveCentsDisplay = {
  cents: number;
  noteMidi: number;
  generation: number;
  frameAtMs: number;
} | null;

/** No continuity-held pitch is accepted here, including during ambiguity. */
export function transitionLiveCentsDisplay(
  current: LiveCentsDisplay,
  sample: PitchSample | null,
  nowMs: number,
  reducedMotion: boolean,
): LiveCentsDisplay {
  if (
    !isFreshPitchSample(sample, nowMs) ||
    sample?.voicing !== 'voiced' ||
    sample.raw?.rejectionReason !== 'detected' ||
    sample.cents === null ||
    !Number.isFinite(sample.cents) ||
    sample.nearestMidi === null
  )
    return null;
  const reset =
    current === null ||
    current.noteMidi !== sample.nearestMidi ||
    current.generation !== sample.sessionGeneration ||
    reducedMotion;
  return {
    cents: reset
      ? sample.cents
      : smoothVisualCents(
          current.cents,
          sample.cents,
          Math.max(0, nowMs - current.frameAtMs),
        ),
    noteMidi: sample.nearestMidi,
    generation: sample.sessionGeneration,
    frameAtMs: nowMs,
  };
}
