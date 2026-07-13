import { formatCents, formatFrequency } from '../music/pitchDisplay';
import { DEFAULT_TUNING_A4_HZ } from '../music/tuning';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import { CentsMeter } from './CentsMeter';

type TunerReadoutProps = {
  pitch: MusicalPitch | null;
  continuityStatus?: PitchContinuityStatus;
  lastAcceptedAgeMs?: number | null;
  measurementTimestampMs?: number | null;
};

export function TunerReadout({
  pitch,
  continuityStatus = pitch ? 'voiced' : 'unvoiced',
  lastAcceptedAgeMs = null,
  measurementTimestampMs = null,
}: TunerReadoutProps) {
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
      <CentsMeter
        rawCents={pitch?.cents ?? null}
        noteMidi={pitch?.midiNote ?? null}
        timestampMs={measurementTimestampMs}
        continuityStatus={continuityStatus}
      />
      <p className="tuning-reference">A4 = {DEFAULT_TUNING_A4_HZ} Hz</p>
    </section>
  );
}
