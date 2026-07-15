import type { PitchHistory, PitchHistorySummary } from '../types/pitchHistory';
import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import type {
  VisiblePitchRange,
  VisiblePitchRangePresetId,
} from '../types/visiblePitchRange';
import { PitchGridCanvas } from './PitchGridCanvas';
import { PitchHistoryControls } from './PitchHistoryControls';
import { PitchRangeControls } from './PitchRangeControls';

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
  visibleRange: VisiblePitchRange;
  selectedRangePresetId: VisiblePitchRangePresetId | null;
  canShiftRangeDown: boolean;
  canShiftRangeUp: boolean;
  currentMidi: number | null;
  onSelectRangePreset: (id: VisiblePitchRangePresetId) => void;
  onShiftRangeDown: () => void;
  onShiftRangeUp: () => void;
  onResetRange: () => void;
  detectedPitch: MusicalPitch | null;
  continuityStatus: PitchContinuityStatus;
  measurementTimestampMs: number | null;
  observationTimestampMs: number | null;
  practiceMicrophoneActive?: boolean;
  showReferenceDroneDiagnostics?: boolean;
  showAudioDiagnostics?: boolean;
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
  visibleRange,
  selectedRangePresetId,
  canShiftRangeDown,
  canShiftRangeUp,
  currentMidi,
  onSelectRangePreset,
  onShiftRangeDown,
  onShiftRangeUp,
  onResetRange,
  detectedPitch,
  continuityStatus,
  measurementTimestampMs,
  observationTimestampMs,
  practiceMicrophoneActive = active,
  showReferenceDroneDiagnostics = false,
  showAudioDiagnostics = false,
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
            aria-label="Pitch history status"
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
      <PitchRangeControls
        range={visibleRange}
        selectedPresetId={selectedRangePresetId}
        canShiftDown={canShiftRangeDown}
        canShiftUp={canShiftRangeUp}
        currentMidi={currentMidi}
        onSelectPreset={onSelectRangePreset}
        onShiftDown={onShiftRangeDown}
        onShiftUp={onShiftRangeUp}
        onReset={onResetRange}
      />
      <PitchGridCanvas
        history={history}
        active={active}
        captureState={captureState}
        sessionVersion={sessionVersion}
        toEffectiveTimestamp={toEffectiveTimestamp}
        visibleDurationMs={durationMs}
        lowMidi={visibleRange.lowMidi}
        highMidi={visibleRange.highMidi}
        detectedPitch={detectedPitch}
        continuityStatus={continuityStatus}
        measurementTimestampMs={measurementTimestampMs}
        observationTimestampMs={observationTimestampMs}
        practiceMicrophoneActive={practiceMicrophoneActive}
        showReferenceDroneDiagnostics={showReferenceDroneDiagnostics}
        showAudioDiagnostics={showAudioDiagnostics}
      />
    </section>
  );
}
