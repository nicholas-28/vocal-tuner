import type { PitchHistorySummary } from '../types/pitchHistory';
import { PitchGridCanvas } from './PitchGridCanvas';

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
          <span>Semitone grid</span>
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
      <PitchGridCanvas />
    </section>
  );
}
