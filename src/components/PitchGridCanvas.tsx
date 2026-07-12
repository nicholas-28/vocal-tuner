import { memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useCanvasViewport } from '../hooks/useCanvasViewport';
import { usePitchCurveAnimation } from '../hooks/usePitchCurveAnimation';
import type { MidiRange } from '../types/pitchGrid';
import type { PitchHistory } from '../types/pitchHistory';
import type { PitchHistoryCaptureState } from '../types/pitchHistoryCapture';
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

type PitchGridCanvasProps = Partial<MidiRange> & {
  history: PitchHistory;
  active: boolean;
  captureState: PitchHistoryCaptureState;
  sessionVersion: number;
  toEffectiveTimestamp: (sourceTimestampMs: number) => number | null;
  visibleDurationMs: number;
  presentTimeXRatio?: number;
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
}: PitchGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const { elementRef, size } = useCanvasViewport<HTMLDivElement>();
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

  return (
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
  );
});
