import type { AudioContextConstructor } from '../audio/referenceDroneContext';
import type { PitchSource } from '../pitch/pitchSource';

/**
 * Pad-boundary pitch values are absolute cents (fractional MIDI * 100).
 * Fractional MIDI values never cross this boundary. All *Ms timestamps share
 * the performance.now() clock domain. A sample published during a browser
 * frame can be newer than that frame's requestAnimationFrame timestamp, so
 * consumers must not reconcile the clocks with Math.abs or timestamp clamping.
 */

export type FastPitchPhase = 'idle' | 'voiced' | 'grace' | 'releasing';

export type FastPitchEvidence = 'sample' | 'interpolated' | 'none';

export type FastPitchFrame = Readonly<{
  phase: FastPitchPhase;
  atMs: number;
  /** Accepted evidence target after octave folding; changes on new samples. */
  targetCents: number | null;
  /** Fast expressive path. */
  shimmerCents: number | null;
  /** Slow quantizer path. */
  harmonyCents: number | null;
  pitchClass: number | null;
  octaveFolded: boolean;
  /** PitchSample.timestampMs of the last consumed voiced sample, not nowMs. */
  lastVoicedAtMs: number | null;
  evidence: FastPitchEvidence;
}>;

export type FastPitchInterpreterOptions = Readonly<{
  source: PitchSource;
  gracePeriodMs?: number;
  tuning?: PadTuning;
}>;

export type FastPitchInterpreter = Readonly<{
  /** nowMs must come from performance.now(), not a requestAnimationFrame timestamp. */
  update(nowMs: number): FastPitchFrame;
  reset(): void;
}>;

export type ChordQuality = 'major' | 'minor' | 'diminished';

export type Key = Readonly<{
  tonicPitchClass: number;
  mode: 'major';
}>;

export type Chord = Readonly<{
  id: string;
  degree: number;
  rootPitchClass: number;
  quality: ChordQuality;
  voiceCents: readonly [number, number, number];
}>;

export type HarmonyState = Readonly<{
  chord: Chord | null;
  changed: boolean;
}>;

export type HarmonyModelOptions = Readonly<{
  key?: Key;
  voicingFloorCents?: number;
  tuning?: PadTuning;
}>;

export type HarmonyModel = Readonly<{
  next(frame: FastPitchFrame): HarmonyState;
  reset(): void;
}>;

export type PadTarget = Readonly<{
  shimmerCents: number | null;
  harmony: HarmonyState;
}>;

export type PadEngineState =
  'idle' | 'starting' | 'running' | 'stopping' | 'unavailable';

export type PadEngineOptions = Readonly<{
  selectContext?: () => AudioContextConstructor | null;
  gainBudget?: PadGainBudget;
  envelope?: PadEnvelope;
}>;

export type PadEngine = Readonly<{
  readonly state: PadEngineState;
  /**
   * Implementations must synchronously construct and start audio nodes before
   * the first await, preserving the existing trusted-gesture pattern.
   */
  start(): Promise<void>;
  render(target: PadTarget, nowMs: number): void;
  setChordMuted(muted: boolean): void;
  stop(): Promise<void>;
  dispose(): void;
}>;

export type PadTuning = Readonly<{
  shimmerQuietTimeConstantMs: number;
  harmonyTimeConstantMs: number;
  pitchClassHysteresisCents: number;
  pitchClassDwellMs: number;
  octaveFoldToleranceCents: number;
  octaveConfirmMs: number;
}>;

export type PadGainBudget = Readonly<{
  totalPeak: number;
  chordBody: number;
  shimmer: number;
}>;

export type PadEnvelope = Readonly<{
  chordAttackMs: number;
  chordCrossfadeMs: number;
  chordReleaseMs: number;
  shimmerAttackMs: number;
  shimmerReleaseMs: number;
}>;

export type PadResponsePolicy = Readonly<{
  harmonyChangeBudgetMs: number;
  referenceLeapCents: number;
  shimmerSettleFraction: number;
  shimmerSettleBudgetMs: number;
}>;
