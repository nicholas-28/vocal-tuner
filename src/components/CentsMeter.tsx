import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSmoothedCentsDisplay } from '../hooks/useSmoothedCentsDisplay';
import { formatCents } from '../music/pitchDisplay';
import {
  centsToMeterPercent,
  classifyCents,
} from '../tuner/centsDisplaySmoothing';
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
  const classification = classifyCents(rawCents);
  const markerPercent =
    displayCents === null ? null : centsToMeterPercent(displayCents);
  const classificationText =
    continuityStatus === 'unvoiced' || classification === null
      ? 'No pitch'
      : continuityStatus === 'uncertain'
        ? `${classificationLabels[classification]} · briefly uncertain`
        : classificationLabels[classification];
  const accessibleDescription = getAccessibleDescription(
    rawCents,
    classification,
    continuityStatus,
  );

  return (
    <div
      className={`cents-meter cents-meter--${continuityStatus}${classification ? ` cents-meter--${classification}` : ''}`}
      role="meter"
      aria-label="Nearest-note cents meter"
      aria-valuemin={-50}
      aria-valuemax={50}
      aria-valuenow={rawCents ?? undefined}
      aria-valuetext={accessibleDescription}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <p className="cents-meter__classification">{classificationText}</p>
      <div className="cents-meter__scale">
        <div className="cents-meter__track" aria-hidden="true">
          <span className="cents-meter__in-tune-zone" />
          {SCALE_TICKS.map((tick) => (
            <span
              className={`cents-meter__tick${tick === 0 ? ' cents-meter__tick--center' : ''}`}
              key={tick}
              style={{ left: `${centsToMeterPercent(tick)}%` }}
            />
          ))}
          <span
            className="cents-meter__marker"
            data-visible={markerPercent === null ? 'false' : 'true'}
            style={{
              left: `${markerPercent ?? 50}%`,
            }}
          />
        </div>
        <div className="cents-meter__tick-labels" aria-label="Cents scale">
          {SCALE_TICKS.map((tick) => (
            <span key={tick}>{tick > 0 ? `+${tick}` : tick}</span>
          ))}
        </div>
        <div className="cents-meter__direction-labels" aria-hidden="true">
          <span>Flat</span>
          <span>In tune</span>
          <span>Sharp</span>
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
  return continuityStatus === 'uncertain'
    ? `Last measured pitch was ${measurement} and is briefly uncertain.`
    : `Pitch is ${measurement}.`;
}
