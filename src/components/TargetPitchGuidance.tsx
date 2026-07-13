import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTargetCentsDisplay } from '../hooks/useTargetCentsDisplay';
import { formatFrequency } from '../music/pitchDisplay';
import {
  comparePitchToTarget,
  mapTargetCentsToMeter,
} from '../target/targetPitchComparison';
import {
  formatTargetDistance,
  getTargetInstruction,
} from '../target/targetDistanceFormatting';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import type { TargetPitchMeasurement } from '../types/targetPitch';

type TargetPitchGuidanceProps = {
  selectedMidi: number | null;
  detectedPitch: MusicalPitch | null;
  continuityStatus: PitchContinuityStatus;
  measurementTimestampMs: number | null;
};

export function TargetPitchGuidance({
  selectedMidi,
  detectedPitch,
  continuityStatus,
  measurementTimestampMs,
}: TargetPitchGuidanceProps) {
  const comparison = comparePitchToTarget(
    selectedMidi,
    detectedPitch,
    continuityStatus,
  );
  const measurement = getMeasurement(comparison);
  const reducedMotion = useReducedMotion();
  const displayCents = useTargetCentsDisplay({
    targetRelativeCents: measurement?.targetRelativeCents ?? null,
    targetMidi: comparison.target?.midiNote ?? null,
    timestampMs: measurementTimestampMs,
    continuityStatus:
      comparison.status === 'inactive' || comparison.status === 'no-pitch'
        ? 'unvoiced'
        : continuityStatus,
    reducedMotion,
  });
  const displayMeter =
    displayCents === null ? null : mapTargetCentsToMeter(displayCents);

  return (
    <section
      className={`target-guidance target-guidance--${comparison.status}${measurement ? ` target-guidance--${measurement.distanceBand}` : ''}`}
      aria-labelledby="target-guidance-heading"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <h3 id="target-guidance-heading">Target guidance</h3>
      {comparison.status === 'inactive' ? (
        <p className="target-guidance__empty">
          Select a reference note to enable target guidance.
        </p>
      ) : (
        <>
          <dl className="target-guidance__notes">
            <div>
              <dt>Selected target</dt>
              <dd>
                {comparison.target.label} ·{' '}
                {formatFrequency(comparison.target.frequencyHz)}
              </dd>
            </div>
            <div>
              <dt>Detected</dt>
              <dd>
                {measurement
                  ? `${measurement.detectedPitch.noteName}${measurement.detectedPitch.octave} · ${formatFrequency(measurement.detectedPitch.frequencyHz)}`
                  : 'No pitch'}
              </dd>
            </div>
          </dl>
          {comparison.status === 'no-pitch' || !measurement ? (
            <p className="target-guidance__empty">No pitch detected.</p>
          ) : (
            <TargetMeasurementContent
              measurement={measurement}
              targetLabel={comparison.target.label}
              uncertain={comparison.status === 'uncertain'}
              markerPercent={displayMeter?.meterPercent ?? null}
            />
          )}
        </>
      )}
    </section>
  );
}

function TargetMeasurementContent({
  measurement,
  targetLabel,
  uncertain,
  markerPercent,
}: {
  measurement: TargetPitchMeasurement;
  targetLabel: string;
  uncertain: boolean;
  markerPercent: number | null;
}) {
  const instruction = getTargetInstruction(measurement.direction);
  const distance =
    formatTargetDistance(measurement.targetRelativeCents, targetLabel) ?? '—';
  const offScale = measurement.offScaleDirection;
  const neighborhood = measurement.withinTargetNeighborhood
    ? 'Target-note neighborhood'
    : measurement.distanceBand === 'different-note'
      ? 'Different note'
      : 'Closer to a neighboring note';
  const accessibleText = `${uncertain ? 'Last measured: ' : ''}${instruction}. ${distance}. ${neighborhood}.${offScale ? ` Off scale ${offScale}.` : ''}${uncertain ? ' Briefly uncertain.' : ''}`;

  return (
    <div className="target-guidance__measurement">
      <p className="target-guidance__instruction">
        {instruction}
        {uncertain && <span> · briefly uncertain</span>}
      </p>
      <p
        className="target-guidance__distance"
        data-target-relative-cents={measurement.targetRelativeCents}
      >
        {distance}
      </p>
      <p className="target-guidance__neighborhood">{neighborhood}</p>
      <div
        className="target-meter"
        role="meter"
        aria-label="Selected-target cents meter"
        aria-valuemin={-50}
        aria-valuemax={50}
        aria-valuenow={Math.max(
          -50,
          Math.min(50, measurement.targetRelativeCents),
        )}
        aria-valuetext={accessibleText}
        data-off-scale={offScale ?? 'false'}
      >
        <span className="target-meter__zone" aria-hidden="true" />
        <span className="target-meter__center" aria-hidden="true" />
        <span
          className="target-meter__marker"
          aria-hidden="true"
          style={{ left: `${markerPercent ?? 50}%` }}
        />
        <span
          className="target-meter__overflow target-meter__overflow--left"
          aria-hidden="true"
        >
          ‹
        </span>
        <span
          className="target-meter__overflow target-meter__overflow--right"
          aria-hidden="true"
        >
          ›
        </span>
      </div>
      <div className="target-meter__labels" aria-hidden="true">
        <span>Below −50</span>
        <span>Target</span>
        <span>Above +50</span>
      </div>
    </div>
  );
}

function getMeasurement(
  comparison: ReturnType<typeof comparePitchToTarget>,
): TargetPitchMeasurement | null {
  if (comparison.status === 'measured') return comparison.measurement;
  if (comparison.status === 'uncertain') return comparison.lastMeasured;
  return null;
}
