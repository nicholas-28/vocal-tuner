import type { PitchGridViewport } from '../types/pitchGrid';
import { midiToY } from './pitchGridViewport';

/** A selected-note guide, not current-pitch evidence or a scoring zone. */
export function drawPitchTarget(
  context: CanvasRenderingContext2D,
  viewport: PitchGridViewport,
  targetMidi: number | null,
): void {
  if (
    targetMidi === null ||
    !Number.isInteger(targetMidi) ||
    targetMidi < viewport.lowMidi ||
    targetMidi > viewport.highMidi
  )
    return;
  const y = midiToY(targetMidi, viewport)!;
  context.save();
  try {
    context.setTransform(
      viewport.devicePixelRatio,
      0,
      0,
      viewport.devicePixelRatio,
      0,
      0,
    );
    context.strokeStyle = '#bca8e5';
    context.lineWidth = 1;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(viewport.graphLeftX, y);
    context.lineTo(viewport.presentTimeX, y);
    context.stroke();
  } finally {
    context.restore();
  }
}
