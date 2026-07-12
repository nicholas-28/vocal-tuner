import type { PitchHistory, PitchHistorySummary } from '../types/pitchHistory';
import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';
import { PitchGridCanvas } from './PitchGridCanvas';
import { PitchHistoryControls } from './PitchHistoryControls';

type PitchMonitorProps = {
  summary: PitchHistorySummary;
  history: PitchHistory;
  active: boolean;
  captureState: PitchHistoryCaptureState;
  sessionVersion: number;
  toEffectiveTimestamp: (sourceTimestampMs: number) => number | null;
  durationMs: number;
  onClear: () => void;
  onPause: () => void;
  onResume: () => void;
};

export function PitchMonitor({
  summary,
  history,
  active,
  captureState,
  sessionVersion,
  toEffectiveTimestamp,
  durationMs,
  onClear,
  onPause,
  onResume,
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
          <span
            className="history-capture-status"
            role="status"
            aria-live="polite"
          >
            {active
              ? captureState.status === 'paused'
                ? 'History paused'
                : 'History live'
              : 'History inactive'}
          </span>
        </div>
        <PitchHistoryControls
          captureState={captureState}
          sessionActive={active}
          historyEmpty={summary.totalPoints === 0}
          onPause={onPause}
          onResume={onResume}
          onClear={onClear}
        />
      </div>
      <dl className="history-summary" aria-label="Pitch history summary">
        <div>
          <dt>Capture</dt>
          <dd>{captureState.status}</dd>
        </div>
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
      <PitchGridCanvas
        history={history}
        active={active}
        captureState={captureState}
        sessionVersion={sessionVersion}
        toEffectiveTimestamp={toEffectiveTimestamp}
        visibleDurationMs={durationMs}
      />
    </section>
  );
}
