import {
  centsToIndicatorPercent,
  formatCents,
  formatFrequency,
} from '../music/pitchDisplay';
import { DEFAULT_TUNING_A4_HZ } from '../music/tuning';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';

type TunerReadoutProps = {
  pitch: MusicalPitch | null;
  continuityStatus?: PitchContinuityStatus;
  lastAcceptedAgeMs?: number | null;
};

export function TunerReadout({
  pitch,
  continuityStatus = pitch ? 'voiced' : 'unvoiced',
  lastAcceptedAgeMs = null,
}: TunerReadoutProps) {
  const indicatorPosition = centsToIndicatorPercent(pitch?.cents ?? null);
  const noteLabel = pitch ? `${pitch.noteName}${pitch.octave}` : '—';
  const centsLabel = formatCents(pitch?.cents ?? null);

  return (
    <section className="readout" aria-label="Current musical pitch">
      <div
        className="current-note"
        aria-label={
          pitch
            ? `Current note: ${noteLabel}${continuityStatus === 'uncertain' ? ', briefly uncertain' : ''}`
            : 'Current note: unavailable'
        }
      >
        {noteLabel}
      </div>
      <p
        className={`readout__continuity readout__continuity--${continuityStatus}`}
      >
        {continuityStatus === 'uncertain'
          ? `Briefly uncertain · last measured ${Math.round(lastAcceptedAgeMs ?? 0)} ms ago`
          : continuityStatus === 'voiced'
            ? 'Stable'
            : 'No pitch'}
      </p>
      <div className="pitch-details">
        <p>{formatFrequency(pitch?.frequencyHz ?? null)}</p>
        <span aria-hidden="true" />
        <p>{centsLabel}</p>
      </div>
      <div
        className="tuning-indicator"
        role="meter"
        aria-label="Cents deviation"
        aria-valuemin={-50}
        aria-valuemax={50}
        aria-valuenow={pitch?.cents ?? 0}
        aria-valuetext={pitch ? centsLabel : 'No pitch'}
      >
        <span className="tuning-indicator__label">Flat</span>
        <span className="tuning-indicator__track" aria-hidden="true">
          <span className="tuning-indicator__center" />
          <span
            className="tuning-indicator__marker"
            style={{ left: `${indicatorPosition}%` }}
          />
        </span>
        <span className="tuning-indicator__label">Sharp</span>
      </div>
      <p className="tuning-reference">A4 = {DEFAULT_TUNING_A4_HZ} Hz</p>
    </section>
  );
}
