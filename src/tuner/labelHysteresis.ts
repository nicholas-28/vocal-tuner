import {
  PITCH_CALIBRATION,
  classifyPitchAccuracy,
} from '../calibration/pitchCalibration';

export type AccuracyLabel = NonNullable<
  ReturnType<typeof classifyPitchAccuracy>
>;
export const LABEL_HYSTERESIS_CENTS = 2;
const labels: AccuracyLabel[] = ['dead-center', 'in-tune', 'close', 'outside'];
const boundaries = [
  PITCH_CALIBRATION.deadCenterCents,
  PITCH_CALIBRATION.inTuneCents,
  PITCH_CALIBRATION.closeCents,
];

/** Categorical presentation only; calibration and scoring still use raw thresholds. */
export function transitionAccuracyLabel(
  previous: AccuracyLabel | null,
  cents: number | null,
): AccuracyLabel | null {
  const raw = classifyPitchAccuracy(cents);
  if (raw === null || previous === null) return raw;
  let index = labels.indexOf(previous);
  const distance = Math.abs(cents!);
  while (
    index < boundaries.length &&
    distance > boundaries[index] + LABEL_HYSTERESIS_CENTS
  )
    index++;
  while (index > 0 && distance < boundaries[index - 1] - LABEL_HYSTERESIS_CENTS)
    index--;
  return labels[index];
}
