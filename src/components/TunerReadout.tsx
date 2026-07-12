import {
  centsToIndicatorPercent,
  formatCents,
  formatFrequency,
} from '../music/pitchDisplay';
import { DEFAULT_TUNING_A4_HZ } from '../music/tuning';
import type { MusicalPitch } from '../types/musicalPitch';

type TunerReadoutProps = {
  pitch: MusicalPitch | null;
};

export function TunerReadout({ pitch }: TunerReadoutProps) {
  const indicatorPosition = centsToIndicatorPercent(pitch?.cents ?? null);
  const noteLabel = pitch ? `${pitch.noteName}${pitch.octave}` : '—';
  const centsLabel = formatCents(pitch?.cents ?? null);

  return (
    <section className="readout" aria-label="Current musical pitch">
      <div
        className="current-note"
        aria-label={
          pitch ? `Current note: ${noteLabel}` : 'Current note: unavailable'
        }
      >
        {noteLabel}
      </div>
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
