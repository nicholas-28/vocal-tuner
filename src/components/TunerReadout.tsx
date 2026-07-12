type TunerReadoutProps = {
  frequencyHz: number | null;
};

export function TunerReadout({ frequencyHz }: TunerReadoutProps) {
  return (
    <section className="readout" aria-label="Current pitch">
      <div className="current-note" aria-label="Current note: unavailable">
        —
      </div>
      <div className="pitch-details">
        <p>{frequencyHz === null ? '— Hz' : `${frequencyHz.toFixed(1)} Hz`}</p>
        <span aria-hidden="true" />
        <p>— cents</p>
      </div>
      <div className="tuning-indicator" aria-label="Tuning indicator">
        <span className="tuning-indicator__line" aria-hidden="true" />
        <span className="tuning-indicator__center" aria-hidden="true" />
        <span className="tuning-indicator__line" aria-hidden="true" />
      </div>
    </section>
  );
}
