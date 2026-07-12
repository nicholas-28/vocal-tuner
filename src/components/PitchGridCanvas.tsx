import { memo, useLayoutEffect, useRef } from 'react';
import { useCanvasViewport } from '../hooks/useCanvasViewport';
import type { MidiRange } from '../types/pitchGrid';
import { drawPitchGrid } from '../visualization/drawPitchGrid';
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
  presentTimeXRatio?: number;
};

export const PitchGridCanvas = memo(function PitchGridCanvas({
  lowMidi = DEFAULT_PITCH_GRID_RANGE.lowMidi,
  highMidi = DEFAULT_PITCH_GRID_RANGE.highMidi,
  presentTimeXRatio = DEFAULT_PRESENT_TIME_X_RATIO,
}: PitchGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { elementRef, size } = useCanvasViewport<HTMLDivElement>();
  const lowLabel = getPitchGridNote(lowMidi)?.label ?? String(lowMidi);
  const highLabel = getPitchGridNote(highMidi)?.label ?? String(highMidi);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const viewport = createPitchGridViewport({
      widthCssPx: size.widthCssPx,
      heightCssPx: size.heightCssPx,
      devicePixelRatio: size.devicePixelRatio,
      lowMidi,
      highMidi,
      presentTimeXRatio,
      ...DEFAULT_PITCH_GRID_LAYOUT,
    });
    if (!viewport) return;
    sizePitchGridCanvas(canvas, viewport);
    const context = canvas.getContext('2d');
    if (context) drawPitchGrid(context, viewport, DEFAULT_PITCH_GRID_STYLE);
  }, [
    size.widthCssPx,
    size.heightCssPx,
    size.devicePixelRatio,
    lowMidi,
    highMidi,
    presentTimeXRatio,
  ]);

  return (
    <figure
      className="pitch-grid"
      role="img"
      aria-label={`Pitch grid from ${lowLabel} to ${highLabel}. Live pitch curve is not yet displayed.`}
    >
      <div className="pitch-grid__viewport" ref={elementRef}>
        <canvas
          ref={canvasRef}
          data-testid="pitch-grid-canvas"
          aria-hidden="true"
        />
      </div>
      <figcaption>Pitch curve will be added in Issue 008.</figcaption>
    </figure>
  );
});
