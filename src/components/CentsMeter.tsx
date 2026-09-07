import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSmoothedCentsDisplay } from '../hooks/useSmoothedCentsDisplay';
import { formatCents } from '../music/pitchDisplay';
import {
  centsToMeterPercent,
  classifyCents,
} from '../tuner/centsDisplaySmoothing';
import { MAXIMUM_CENTS, MINIMUM_CENTS } from '../tuner/centsDisplayConfig';
import { getCentsTensionGeometry } from '../tuner/centsTensionGeometry';
import type { PitchContinuityStatus } from '../types/pitchContinuity';

type CentsMeterProps = {
  rawCents: number | null;
  noteMidi: number | null;
  timestampMs: number | null;
  continuityStatus: PitchContinuityStatus;
};

const SCALE_TICKS = [-50, -25, 0, 25, 50] as const;

const classificationLabels = {
  flat: 'Flat',
  'in-tune': 'In tune',
  sharp: 'Sharp',
} as const;

export function CentsMeter({
  rawCents,
  noteMidi,
  timestampMs,
  continuityStatus,
}: CentsMeterProps) {
  const reducedMotion = useReducedMotion();
  const displayCents = useSmoothedCentsDisplay({
    rawCents,
    noteMidi,
    timestampMs,
    continuityStatus,
    reducedMotion,
  });
  // Continuity owns held observations. Never expose a leftover smoothed value
  // as evidence when the current presentation observation is absent/invalid.
  const hasMeasurement =
    continuityStatus !== 'unvoiced' &&
    rawCents !== null &&
    Number.isFinite(rawCents) &&
    noteMidi !== null &&
    Number.isInteger(noteMidi) &&
    timestampMs !== null &&
    Number.isFinite(timestampMs) &&
    timestampMs >= 0;
  const measuredCents = hasMeasurement ? rawCents : null;
  const classification = classifyCents(measuredCents);
  const geometry = getCentsTensionGeometry(
    hasMeasurement ? displayCents : null,
  );
  const beyondScale =
    measuredCents !== null &&
    (measuredCents < MINIMUM_CENTS || measuredCents > MAXIMUM_CENTS);
  const classificationText =
    continuityStatus === 'unvoiced' || classification === null
      ? 'No pitch'
      : continuityStatus === 'uncertain'
        ? `${classificationLabels[classification]} · briefly uncertain`
        : `${classificationLabels[classification]}${beyondScale ? ' · beyond scale' : ''}`;
  const accessibleDescription = getAccessibleDescription(
    measuredCents,
    classification,
    continuityStatus,
  );

  return (
    <div
      className={`cents-meter cents-meter--${continuityStatus}${classification ? ` cents-meter--${classification}` : ''}`}
      role="meter"
      aria-label="Nearest-note cents meter"
      aria-valuemin={MINIMUM_CENTS}
      aria-valuemax={MAXIMUM_CENTS}
      aria-valuenow={
        measuredCents === null
          ? undefined
          : Math.max(MINIMUM_CENTS, Math.min(MAXIMUM_CENTS, measuredCents))
      }
      aria-valuetext={accessibleDescription}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <p className="cents-meter__classification">{classificationText}</p>
      <div className="cents-meter__scale">
        <div className="cents-meter__track" aria-hidden="true">
          <span className="cents-meter__in-tune-zone" />
          {SCALE_TICKS.map((tick) => (
            <span
              className="cents-meter__tick"
              key={tick}
              style={{ left: `${centsToMeterPercent(tick)}%` }}
            />
          ))}
          <svg
            className="cents-meter__tension"
            viewBox="0 0 100 48"
            preserveAspectRatio="none"
            data-visible={geometry === null ? 'false' : 'true'}
            data-direction={geometry?.direction ?? 'center'}
            data-endpoint={geometry?.endpointPercent}
          >
            <path d={geometry?.path ?? ''} />
          </svg>
          <span className="cents-meter__center" />
        </div>
        <div className="cents-meter__tick-labels" aria-label="Cents scale">
          {SCALE_TICKS.map((tick) => (
            <span key={tick} style={{ left: `${centsToMeterPercent(tick)}%` }}>
              {tick > 0 ? `+${tick}` : tick}
            </span>
          ))}
        </div>
        <div className="cents-meter__direction-labels" aria-hidden="true">
          <span>← Flat</span>
          <span>Nearest note</span>
          <span>Sharp →</span>
        </div>
      </div>
      <span className="visually-hidden">{accessibleDescription}</span>
    </div>
  );
}

function getAccessibleDescription(
  rawCents: number | null,
  classification: ReturnType<typeof classifyCents>,
  continuityStatus: PitchContinuityStatus,
): string {
  if (
    continuityStatus === 'unvoiced' ||
    rawCents === null ||
    classification === null
  )
    return 'No pitch detected.';
  const measurement =
    classification === 'in-tune'
      ? `${formatCents(rawCents)}, in tune with the nearest note`
      : `${formatCents(rawCents)} ${classificationLabels[classification].toLowerCase()} of the nearest note`;
  const overflow =
    rawCents < MINIMUM_CENTS || rawCents > MAXIMUM_CENTS
      ? ' Beyond the displayed ±50-cent scale.'
      : '';
  return continuityStatus === 'uncertain'
    ? `Last measured pitch was ${measurement} and is briefly uncertain.${overflow}`
    : `Pitch is ${measurement}.${overflow}`;
}
