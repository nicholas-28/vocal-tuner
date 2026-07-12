import type { PitchHistorySummary } from '../types/pitchHistory';

const noteLabels = ['A4', 'G♯4', 'G4', 'F♯4', 'F4', 'E4', 'D♯4'];

type PitchMonitorProps = {
  summary: PitchHistorySummary;
  durationMs: number;
  onClear: () => void;
};

export function PitchMonitor({
  summary,
  durationMs,
  onClear,
}: PitchMonitorProps) {
  const relativeNewestMs =
    summary.oldestTimestampMs === null || summary.newestTimestampMs === null
      ? null
      : summary.newestTimestampMs - summary.oldestTimestampMs;

  return (
    <section className="monitor" aria-label="Pitch monitor">
      <div className="monitor__heading">
        <div>
          <h2>Pitch history</h2>
          <span>Pitch graph will be added in a later issue</span>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={summary.totalPoints === 0}
          onClick={onClear}
        >
          Clear history
        </button>
      </div>
      <dl className="history-summary" aria-label="Pitch history summary">
        <div>
          <dt>Total</dt>
          <dd>{summary.totalPoints}</dd>
        </div>
        <div>
          <dt>Pitch / gaps</dt>
          <dd>
            {summary.pitchPoints} / {summary.gapPoints}
          </dd>
        </div>
        <div>
          <dt>Retained</dt>
          <dd>{(summary.retainedDurationMs / 1000).toFixed(1)} s</dd>
        </div>
        <div>
          <dt>Maximum</dt>
          <dd>{durationMs / 1000} s</dd>
        </div>
        <div>
          <dt>Latest</dt>
          <dd>{summary.latestKind ?? '—'}</dd>
        </div>
        <div>
          <dt>Relative time</dt>
          <dd>
            {relativeNewestMs === null
              ? '—'
              : `0–${relativeNewestMs.toFixed(0)} ms`}
          </dd>
        </div>
      </dl>
      <div className="semitone-grid" aria-label="Empty semitone grid">
        {noteLabels.map((note) => (
          <div className="grid-row" key={note}>
            <span>{note}</span>
          </div>
        ))}
        <div className="playhead" aria-hidden="true" />
      </div>
    </section>
  );
}
