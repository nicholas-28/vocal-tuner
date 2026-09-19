import { selectAudioContextConstructor } from '../audio/referenceDroneContext';
import { PAD_ENVELOPE, PAD_GAIN_BUDGET } from './padConfig';
import {
  absoluteCentsToFrequency,
  createPadVoiceGraph,
  disconnectPadVoiceGraph,
  stopPadOscillators,
  type PadVoiceBank,
  type PadVoiceGraph,
} from './padVoices';
import type {
  PadEngine,
  PadEngineOptions,
  PadEngineState,
  PadEnvelope,
  PadGainBudget,
  PadTarget,
} from './types';

const defaultSelectContext = () => selectAudioContextConstructor().constructor;

function validateGainBudget(gainBudget: PadGainBudget) {
  const values = [
    gainBudget.totalPeak,
    gainBudget.chordBody,
    gainBudget.shimmer,
  ];
  if (
    values.some((value) => !Number.isFinite(value) || value < 0) ||
    gainBudget.chordBody + gainBudget.shimmer > gainBudget.totalPeak
  ) {
    throw new RangeError('Pad gain budget exceeds its total peak.');
  }
}

function validateEnvelope(envelope: PadEnvelope) {
  if (
    Object.values(envelope).some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  ) {
    throw new RangeError('Pad envelope durations must be finite and positive.');
  }
}

function hold(parameter: AudioParam, atTime: number) {
  if (typeof parameter.cancelAndHoldAtTime === 'function') {
    try {
      parameter.cancelAndHoldAtTime(atTime);
      return;
    } catch {
      // Older Safari exposes this method but may reject it.
    }
  }
  parameter.cancelScheduledValues?.(atTime);
  if (typeof parameter.setValueAtTime === 'function') {
    parameter.setValueAtTime(parameter.value, atTime);
  }
}

function setValue(parameter: AudioParam, value: number, atTime: number) {
  if (typeof parameter.setValueAtTime === 'function') {
    parameter.setValueAtTime(value, atTime);
  } else {
    parameter.value = value;
  }
}

function ramp(
  parameter: AudioParam,
  value: number,
  atTime: number,
  durationMs: number,
) {
  hold(parameter, atTime);
  if (typeof parameter.linearRampToValueAtTime === 'function') {
    parameter.linearRampToValueAtTime(value, atTime + durationMs / 1000);
  } else {
    setValue(parameter, value, atTime + durationMs / 1000);
  }
}

function setBankFrequencies(
  bank: PadVoiceBank,
  voiceCents: readonly [number, number, number],
  atTime: number,
) {
  const frequencies = voiceCents.map(absoluteCentsToFrequency);
  if (
    frequencies.some(
      (frequency) => !Number.isFinite(frequency) || frequency <= 0,
    )
  ) {
    return false;
  }
  for (let index = 0; index < bank.length; index += 1) {
    hold(bank[index].oscillator.frequency, atTime);
    setValue(bank[index].oscillator.frequency, frequencies[index], atTime);
  }
  return true;
}

function rampBank(
  bank: PadVoiceBank,
  gain: number,
  atTime: number,
  durationMs: number,
) {
  for (const voice of bank) ramp(voice.gain.gain, gain, atTime, durationMs);
}

function rampAllChordVoices(
  graph: PadVoiceGraph,
  gain: number,
  atTime: number,
  durationMs: number,
) {
  for (const bank of graph.chordBanks) {
    rampBank(bank, gain, atTime, durationMs);
  }
}

function closeContext(context: AudioContext) {
  try {
    if (context.state === 'closed') return Promise.resolve();
    return context.close().catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

function delay(durationMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, durationMs));
}

export function createPadEngine({
  selectContext = defaultSelectContext,
  gainBudget = PAD_GAIN_BUDGET,
  envelope = PAD_ENVELOPE,
}: PadEngineOptions = {}): PadEngine {
  validateGainBudget(gainBudget);
  validateEnvelope(envelope);

  const chordVoiceGain = gainBudget.chordBody / 3;
  let state: PadEngineState = 'idle';
  let graph: PadVoiceGraph | null = null;
  let stoppingGraph: PadVoiceGraph | null = null;
  let startPromise: Promise<void> | null = null;
  let stopPromise: Promise<void> | null = null;
  let disposed = false;
  let operation = 0;
  let chordMuted = false;
  let activeBankIndex: 0 | 1 = 0;
  let chordId: string | null = null;
  let chordAudible = false;
  let shimmerCents: number | null = null;
  let shimmerAudible = false;

  const resetRenderState = () => {
    activeBankIndex = 0;
    chordId = null;
    chordAudible = false;
    shimmerCents = null;
    shimmerAudible = false;
  };

  const start = (): Promise<void> => {
    if (disposed || state === 'unavailable') return Promise.resolve();
    if (state === 'running') return Promise.resolve();
    if (state === 'starting') return startPromise ?? Promise.resolve();
    // Starting during an audible release would cross an await boundary before
    // graph creation, so recovery requires a later trusted gesture.
    if (state === 'stopping') return stopPromise ?? Promise.resolve();

    const Context = selectContext();
    if (!Context) {
      state = 'unavailable';
      return Promise.resolve();
    }

    state = 'starting';
    const command = ++operation;
    let context: AudioContext | null = null;
    let createdGraph: PadVoiceGraph | null = null;
    let pendingResume: Promise<void> | null = null;
    try {
      context = new Context();
      if (context.state !== 'running') pendingResume = context.resume();
      // Graph construction and every oscillator start remain in this task,
      // before confirmStart reaches its first await.
      createdGraph = createPadVoiceGraph(context);
      graph = createdGraph;
      resetRenderState();
    } catch (error) {
      if (createdGraph) {
        stopPadOscillators(createdGraph);
        disconnectPadVoiceGraph(createdGraph);
      }
      if (context) void closeContext(context);
      graph = null;
      state = 'idle';
      return Promise.reject(error);
    }

    const ownedGraph = createdGraph;
    const confirmStart = async () => {
      try {
        if (pendingResume) await pendingResume;
        if (
          disposed ||
          command !== operation ||
          graph !== ownedGraph ||
          ownedGraph.context.state !== 'running'
        ) {
          if (!disposed && command === operation) {
            throw new Error('AudioContext did not reach the running state.');
          }
          return;
        }
        state = 'running';
      } catch (error) {
        const stillOwnsGraph = graph === ownedGraph;
        if (!stillOwnsGraph) return;
        graph = null;
        stopPadOscillators(ownedGraph);
        disconnectPadVoiceGraph(ownedGraph);
        await closeContext(ownedGraph.context);
        if (!disposed && command === operation) state = 'idle';
        throw error;
      }
    };
    startPromise = confirmStart().finally(() => {
      startPromise = null;
    });
    return startPromise;
  };

  const render = (target: PadTarget, nowMs: number) => {
    const activeGraph = graph;
    if (state !== 'running' || !activeGraph || !Number.isFinite(nowMs)) {
      return;
    }
    const atTime = activeGraph.context.currentTime;
    if (!Number.isFinite(atTime) || atTime < 0) return;

    const nextShimmer =
      target.shimmerCents !== null && Number.isFinite(target.shimmerCents)
        ? target.shimmerCents
        : null;
    if (nextShimmer === null) {
      if (shimmerAudible) {
        ramp(
          activeGraph.shimmer.gain.gain,
          0,
          atTime,
          envelope.shimmerReleaseMs,
        );
        shimmerAudible = false;
      }
      shimmerCents = null;
    } else {
      if (nextShimmer !== shimmerCents) {
        const frequency = absoluteCentsToFrequency(nextShimmer);
        if (Number.isFinite(frequency) && frequency > 0) {
          hold(activeGraph.shimmer.oscillator.frequency, atTime);
          setValue(activeGraph.shimmer.oscillator.frequency, frequency, atTime);
          shimmerCents = nextShimmer;
        }
      }
      if (!shimmerAudible) {
        ramp(
          activeGraph.shimmer.gain.gain,
          gainBudget.shimmer,
          atTime,
          envelope.shimmerAttackMs,
        );
        shimmerAudible = true;
      }
    }

    const chord = target.harmony.chord;
    if (chord === null) {
      if (chordAudible) {
        rampAllChordVoices(activeGraph, 0, atTime, envelope.chordReleaseMs);
        chordAudible = false;
        chordId = null;
      }
      return;
    }

    if (!chordAudible) {
      const bank = activeGraph.chordBanks[activeBankIndex];
      const inactiveBankIndex: 0 | 1 = activeBankIndex === 0 ? 1 : 0;
      if (!setBankFrequencies(bank, chord.voiceCents, atTime)) return;
      // A new chord can arrive while both banks are still releasing from a
      // prior target. Pairing this fade with the attack preserves the ceiling.
      rampBank(
        activeGraph.chordBanks[inactiveBankIndex],
        0,
        atTime,
        envelope.chordAttackMs,
      );
      rampBank(
        bank,
        chordMuted ? 0 : chordVoiceGain,
        atTime,
        envelope.chordAttackMs,
      );
      chordId = chord.id;
      chordAudible = true;
      return;
    }

    if (target.harmony.changed && chord.id !== chordId) {
      const nextBankIndex: 0 | 1 = activeBankIndex === 0 ? 1 : 0;
      const outgoing = activeGraph.chordBanks[activeBankIndex];
      const incoming = activeGraph.chordBanks[nextBankIndex];
      if (!setBankFrequencies(incoming, chord.voiceCents, atTime)) return;
      rampBank(outgoing, 0, atTime, envelope.chordCrossfadeMs);
      rampBank(
        incoming,
        chordMuted ? 0 : chordVoiceGain,
        atTime,
        envelope.chordCrossfadeMs,
      );
      activeBankIndex = nextBankIndex;
      chordId = chord.id;
    }
  };

  const setChordMuted = (muted: boolean) => {
    if (muted === chordMuted) return;
    chordMuted = muted;
    const activeGraph = graph;
    if (state !== 'running' || !activeGraph) return;
    const atTime = activeGraph.context.currentTime;
    if (!Number.isFinite(atTime) || atTime < 0) return;
    if (muted) {
      rampAllChordVoices(activeGraph, 0, atTime, envelope.chordCrossfadeMs);
    } else if (chordAudible) {
      const inactiveBankIndex: 0 | 1 = activeBankIndex === 0 ? 1 : 0;
      rampBank(
        activeGraph.chordBanks[inactiveBankIndex],
        0,
        atTime,
        envelope.chordCrossfadeMs,
      );
      rampBank(
        activeGraph.chordBanks[activeBankIndex],
        chordVoiceGain,
        atTime,
        envelope.chordCrossfadeMs,
      );
    }
  };

  const stop = (): Promise<void> => {
    if (state === 'idle' || state === 'unavailable') return Promise.resolve();
    if (state === 'stopping') return stopPromise ?? Promise.resolve();

    const command = ++operation;
    state = 'stopping';
    const ownedGraph = graph;
    graph = null;
    stoppingGraph = ownedGraph;
    resetRenderState();
    if (!ownedGraph) {
      state = disposed ? 'unavailable' : 'idle';
      return Promise.resolve();
    }

    const atTime = ownedGraph.context.currentTime;
    const canRelease =
      ownedGraph.context.state === 'running' &&
      Number.isFinite(atTime) &&
      atTime >= 0;
    const releaseMs = canRelease
      ? Math.max(envelope.chordReleaseMs, envelope.shimmerReleaseMs)
      : 0;
    if (canRelease) {
      rampAllChordVoices(ownedGraph, 0, atTime, envelope.chordReleaseMs);
      ramp(ownedGraph.shimmer.gain.gain, 0, atTime, envelope.shimmerReleaseMs);
      stopPadOscillators(ownedGraph, atTime + releaseMs / 1000);
    } else {
      stopPadOscillators(ownedGraph);
    }

    stopPromise = (async () => {
      if (releaseMs > 0) await delay(releaseMs);
      if (stoppingGraph !== ownedGraph) return;
      stoppingGraph = null;
      disconnectPadVoiceGraph(ownedGraph);
      await closeContext(ownedGraph.context);
      if (!disposed && command === operation) state = 'idle';
    })().finally(() => {
      stopPromise = null;
    });
    return stopPromise;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    operation += 1;
    const ownedGraph = graph;
    const ownedStoppingGraph = stoppingGraph;
    graph = null;
    stoppingGraph = null;
    resetRenderState();
    if (ownedGraph) {
      stopPadOscillators(ownedGraph);
      disconnectPadVoiceGraph(ownedGraph);
      void closeContext(ownedGraph.context);
    }
    if (ownedStoppingGraph) {
      stopPadOscillators(ownedStoppingGraph);
      disconnectPadVoiceGraph(ownedStoppingGraph);
      void closeContext(ownedStoppingGraph.context);
    }
    state = 'unavailable';
  };

  return Object.freeze({
    get state() {
      return state;
    },
    start,
    render,
    setChordMuted,
    stop,
    dispose,
  });
}
