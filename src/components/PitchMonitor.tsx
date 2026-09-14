import {
  DEFAULT_PITCH_VIEW_WINDOW_MS,
  PITCH_VIEW_WINDOWS_MS,
} from '../visualization/pitchCurveConfig';
import { useState } from 'react';
import type { PitchZoomSpan } from '../visualization/visiblePitchRange';
import type { PitchCurveBreaks } from '../visualization/pitchCurveBreaks';
import type { PitchHistory, PitchHistorySummary } from '../types/pitchHistory';
import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import type { VisiblePitchRange } from '../types/visiblePitchRange';
import { PitchGridCanvas } from './PitchGridCanvas';
import { PitchHistoryControls } from './PitchHistoryControls';
import { PitchRangeControls } from './PitchRangeControls';
import type { AudioSessionDiagnosticTimeline } from '../types/audioDiagnostics';

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
  onZoomRange: (span: PitchZoomSpan) => void;
  onCenterRange: (midi: number) => void;
  curveBreaks?: PitchCurveBreaks;
  currentMidi: number | null;
  onResetRange: () => void;
  detectedPitch: MusicalPitch | null;
  continuityStatus: PitchContinuityStatus;
  measurementTimestampMs: number | null;
  observationTimestampMs: number | null;
  practiceMicrophoneActive?: boolean;
  showReferenceDroneDiagnostics?: boolean;
  showAudioDiagnostics?: boolean;
  presentationSilence?: boolean;
  audioSessionTimeline?: AudioSessionDiagnosticTimeline | null;
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
  onZoomRange,
  onCenterRange,
  curveBreaks,
  currentMidi,
  onResetRange,
  detectedPitch,
  continuityStatus,
  measurementTimestampMs,
  observationTimestampMs,
  practiceMicrophoneActive = active,
  showReferenceDroneDiagnostics = false,
  showAudioDiagnostics = false,
  presentationSilence = false,
  audioSessionTimeline = null,
}: PitchMonitorProps) {
  const [windowMs, setWindowMs] = useState<number>(
    DEFAULT_PITCH_VIEW_WINDOW_MS,
  );
  const [tall, setTall] = useState(false);
  const visibleDurationMs = Math.min(windowMs, durationMs);
  const relativeNewestMs =
    summary.oldestTimestampMs === null || summary.newestTimestampMs === null
      ? null
      : summary.newestTimestampMs - summary.oldestTimestampMs;

  return (
    <section
      className={`monitor${tall ? ' monitor--tall' : ''}`}
      aria-label="Pitch monitor"
    >
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
      <div className="graph-view-controls">
        <label>
          Time window
          <select
            aria-label="Time window"
            value={visibleDurationMs}
            onChange={(event) => setWindowMs(Number(event.target.value))}
          >
            {PITCH_VIEW_WINDOWS_MS.filter((ms) => ms <= durationMs).map(
              (ms) => (
                <option value={ms} key={ms}>
                  {ms / 1000} s
                </option>
              ),
            )}
          </select>
        </label>
        <button
          type="button"
          className="secondary-button"
          aria-pressed={tall}
          onClick={() => setTall((value) => !value)}
        >
          Taller graph
        </button>
      </div>
      <PitchRangeControls
        range={visibleRange}
        onZoom={onZoomRange}
        onCenter={onCenterRange}
        currentMidi={currentMidi}
        onReset={onResetRange}
      />
      <PitchGridCanvas
        curveBreaks={curveBreaks}
        presentationSilence={presentationSilence}
        history={history}
        active={active}
        captureState={captureState}
        sessionVersion={sessionVersion}
        toEffectiveTimestamp={toEffectiveTimestamp}
        visibleDurationMs={visibleDurationMs}
        lowMidi={visibleRange.lowMidi}
        highMidi={visibleRange.highMidi}
        detectedPitch={detectedPitch}
        continuityStatus={continuityStatus}
        measurementTimestampMs={measurementTimestampMs}
        observationTimestampMs={observationTimestampMs}
        practiceMicrophoneActive={practiceMicrophoneActive}
        showReferenceDroneDiagnostics={showReferenceDroneDiagnostics}
        showAudioDiagnostics={showAudioDiagnostics}
        audioSessionTimeline={audioSessionTimeline}
      />
      <details className="history-details">
        <summary>History details</summary>
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
      </details>
    </section>
  );
}
