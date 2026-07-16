import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import { useCanvasViewport } from '../hooks/useCanvasViewport';
import { usePitchCurveAnimation } from '../hooks/usePitchCurveAnimation';
import { useReferenceDrone } from '../hooks/useReferenceDrone';
import { useReferenceKeyboard } from '../hooks/useReferenceKeyboard';
import { useTargetPracticeSession } from '../hooks/useTargetPracticeSession';
import type { MidiRange } from '../types/pitchGrid';
import type { PitchHistory } from '../types/pitchHistory';
import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';
import type { MusicalPitch } from '../types/musicalPitch';
import type { PitchContinuityStatus } from '../types/pitchContinuity';
import type { AudioSessionDiagnosticTimeline } from '../types/audioDiagnostics';
import type { ReferenceDroneDiagnostics as DroneDiagnostics } from '../types/referenceDrone';
import { drawPitchCurve } from '../visualization/drawPitchCurve';
import { drawPitchGrid } from '../visualization/drawPitchGrid';
import { DEFAULT_PITCH_CURVE_CONFIG } from '../visualization/pitchCurveConfig';
import {
  DEFAULT_PITCH_GRID_LAYOUT,
  DEFAULT_PITCH_GRID_RANGE,
  DEFAULT_PITCH_GRID_STYLE,
  DEFAULT_PRESENT_TIME_X_RATIO,
} from '../visualization/pitchGridConfig';
import { createPitchGridViewport } from '../visualization/pitchGridViewport';
import { sizePitchGridCanvas } from '../visualization/sizePitchGridCanvas';
import { getPitchGridNote } from '../visualization/pitchGridNotes';
import { ReferenceKeyboard } from './ReferenceKeyboard';
import { ReferenceDroneControls } from './ReferenceDroneControls';
import { ReferenceDroneDiagnostics } from './ReferenceDroneDiagnostics';
import { ReferenceDroneStatus } from './ReferenceDroneStatus';
import { ReferenceNoteStatus } from './ReferenceNoteStatus';
import { TargetPitchGuidance } from './TargetPitchGuidance';
import { TargetPracticeSession } from './TargetPracticeSession';

type PitchGridCanvasProps = Partial<MidiRange> & {
  history: PitchHistory;
  active: boolean;
  captureState: PitchHistoryCaptureState;
  sessionVersion: number;
  toEffectiveTimestamp: (sourceTimestampMs: number) => number | null;
  visibleDurationMs: number;
  presentTimeXRatio?: number;
  detectedPitch?: MusicalPitch | null;
  continuityStatus?: PitchContinuityStatus;
  measurementTimestampMs?: number | null;
  observationTimestampMs?: number | null;
  practiceMicrophoneActive?: boolean;
  showReferenceDroneDiagnostics?: boolean;
  showAudioDiagnostics?: boolean;
  audioSessionTimeline?: AudioSessionDiagnosticTimeline | null;
};

export const PitchGridCanvas = memo(function PitchGridCanvas({
  history,
  active,
  captureState,
  sessionVersion,
  toEffectiveTimestamp,
  visibleDurationMs,
  lowMidi = DEFAULT_PITCH_GRID_RANGE.lowMidi,
  highMidi = DEFAULT_PITCH_GRID_RANGE.highMidi,
  presentTimeXRatio = DEFAULT_PRESENT_TIME_X_RATIO,
  detectedPitch = null,
  continuityStatus = 'unvoiced',
  measurementTimestampMs = null,
  observationTimestampMs = null,
  practiceMicrophoneActive = active,
  showReferenceDroneDiagnostics = false,
  showAudioDiagnostics = false,
  audioSessionTimeline = null,
}: PitchGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const { elementRef, size } = useCanvasViewport<HTMLDivElement>();
  const visibleRange = useMemo(
    () => ({ lowMidi, highMidi }),
    [lowMidi, highMidi],
  );
  const referenceKeyboard = useReferenceKeyboard(visibleRange);
  const droneDiagnosticObserver = useCallback(
    (label: string, diagnostics: DroneDiagnostics) =>
      audioSessionTimeline?.captureDrone(label, diagnostics),
    [audioSessionTimeline],
  );
  const referenceDrone = useReferenceDrone(
    undefined,
    showAudioDiagnostics,
    droneDiagnosticObserver,
  );
  useEffect(() => {
    audioSessionTimeline?.updateDrone(referenceDrone.snapshot.diagnostics);
  }, [audioSessionTimeline, referenceDrone.snapshot.diagnostics]);
  const practice = useTargetPracticeSession({
    selectedMidi: referenceKeyboard.state.selectedMidi,
    microphoneActive: practiceMicrophoneActive,
    detectedPitch,
    continuityStatus,
    observationTimestampMs,
  });
  const selectReferenceMidi = referenceKeyboard.selectMidi;
  const toggleReferenceMidi = referenceDrone.toggleMidi;
  const lowLabel = getPitchGridNote(lowMidi)?.label ?? String(lowMidi);
  const highLabel = getPitchGridNote(highMidi)?.label ?? String(highMidi);
  const viewport = useMemo(
    () =>
      createPitchGridViewport({
        widthCssPx: size.widthCssPx,
        heightCssPx: size.heightCssPx,
        devicePixelRatio: size.devicePixelRatio,
        lowMidi,
        highMidi,
        presentTimeXRatio,
        ...DEFAULT_PITCH_GRID_LAYOUT,
      }),
    [
      size.widthCssPx,
      size.heightCssPx,
      size.devicePixelRatio,
      lowMidi,
      highMidi,
      presentTimeXRatio,
    ],
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const curveCanvas = curveCanvasRef.current;
    if (!canvas || !curveCanvas || !viewport) return;
    sizePitchGridCanvas(canvas, viewport);
    sizePitchGridCanvas(curveCanvas, viewport);
    const context = canvas.getContext('2d');
    if (context) drawPitchGrid(context, viewport, DEFAULT_PITCH_GRID_STYLE);
  }, [viewport]);

  const drawCurve = useCallback(
    (referenceTimeMs: number) => {
      const curveCanvas = curveCanvasRef.current;
      if (!curveCanvas || !viewport) return;
      const context = curveCanvas.getContext('2d');
      if (!context) return;
      drawPitchCurve(context, viewport, history.points, referenceTimeMs, {
        ...DEFAULT_PITCH_CURVE_CONFIG,
        visibleDurationMs,
      });
    },
    [history.points, viewport, visibleDurationMs],
  );

  usePitchCurveAnimation({
    active: active && captureState.status === 'recording',
    fallbackReferenceTimeMs: history.points.at(-1)?.timestampMs ?? 0,
    inactiveReferenceTimeMs:
      captureState.status === 'paused'
        ? captureState.frozenEffectiveTimeMs
        : null,
    resetKey: sessionVersion,
    toReferenceTime: toEffectiveTimestamp,
    draw: drawCurve,
  });

  const activateReferenceMidi = useCallback(
    (midiNote: number) => {
      if (practice.targetSelectionLocked) return;
      const activation = toggleReferenceMidi(midiNote);
      selectReferenceMidi(midiNote);
      void activation;
    },
    [practice.targetSelectionLocked, selectReferenceMidi, toggleReferenceMidi],
  );

  return (
    <div className="pitch-visualization-block">
      <div
        className="pitch-visualization"
        style={
          {
            '--pitch-grid-top-padding': `${DEFAULT_PITCH_GRID_LAYOUT.topPaddingCssPx}px`,
            '--pitch-grid-bottom-padding': `${DEFAULT_PITCH_GRID_LAYOUT.bottomPaddingCssPx}px`,
          } as CSSProperties
        }
      >
        <ReferenceKeyboard
          range={visibleRange}
          state={referenceKeyboard.state}
          onBeginPointerPress={referenceKeyboard.beginPointerPress}
          onEndPointerPress={referenceKeyboard.endPointerPress}
          onBeginKeyboardPress={referenceKeyboard.beginKeyboardPress}
          onEndKeyboardPress={referenceKeyboard.endKeyboardPress}
          onReleaseAll={referenceKeyboard.releaseAll}
          onMoveFocus={referenceKeyboard.moveFocus}
          onFocusMidi={referenceKeyboard.setFocusedMidi}
          onActivateMidi={activateReferenceMidi}
          activeDroneMidi={referenceDrone.snapshot.activeMidi}
          selectionLocked={practice.targetSelectionLocked}
        />
        <figure
          className="pitch-grid"
          role="img"
          aria-label={
            captureState.status === 'paused'
              ? `Pitch history paused. Showing the last captured ${visibleDurationMs / 1000} seconds from ${lowLabel} to ${highLabel}.`
              : `Live pitch history from ${lowLabel} to ${highLabel} over the last ${visibleDurationMs / 1000} seconds.`
          }
        >
          <div className="pitch-grid__viewport" ref={elementRef}>
            <canvas
              ref={canvasRef}
              data-testid="pitch-grid-canvas"
              aria-hidden="true"
            />
            <canvas
              ref={curveCanvasRef}
              className="pitch-grid__curve"
              data-testid="pitch-curve-canvas"
              aria-hidden="true"
            />
          </div>
          {history.points.every((point) => point.kind !== 'pitch') && (
            <figcaption>
              {captureState.status === 'paused'
                ? 'History is paused.'
                : active
                  ? 'Sing a sustained note to begin pitch history.'
                  : 'Start the microphone to begin pitch history.'}
            </figcaption>
          )}
        </figure>
      </div>
      <ReferenceNoteStatus state={referenceKeyboard.state} />
      <ReferenceDroneStatus
        snapshot={referenceDrone.snapshot}
        range={visibleRange}
      />
      <ReferenceDroneControls
        snapshot={referenceDrone.snapshot}
        selectedMidi={referenceKeyboard.state.selectedMidi}
        onStartSelected={(midiNote) => void referenceDrone.playMidi(midiNote)}
        onStop={() => void referenceDrone.stop()}
        onVolumeChange={referenceDrone.setVolume}
      />
      <TargetPitchGuidance
        selectedMidi={referenceKeyboard.state.selectedMidi}
        detectedPitch={detectedPitch}
        continuityStatus={continuityStatus}
        measurementTimestampMs={measurementTimestampMs}
      />
      <TargetPracticeSession model={practice} />
      {(showReferenceDroneDiagnostics || showAudioDiagnostics) && (
        <ReferenceDroneDiagnostics
          diagnostics={referenceDrone.snapshot.diagnostics}
          audioDiagnosticMode={showAudioDiagnostics}
          onPlayOutputTest={() =>
            void referenceDrone.playOutputTestFromUserGesture()
          }
          onPlayDirectOutputTest={() =>
            void referenceDrone.playDirectOutputTestFromUserGesture()
          }
          onPlayConstantGainOutputTest={() =>
            void referenceDrone.playConstantGainOutputTestFromUserGesture()
          }
          onRecreateContext={() =>
            void referenceDrone.recreateContextAndPlayOutputTestFromUserGesture()
          }
          audioSessionTimeline={audioSessionTimeline}
        />
      )}
    </div>
  );
});
