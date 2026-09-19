export const PAD_CHORD_VOICE_COUNT = 3;
export const PAD_CHORD_BANK_COUNT = 2;

export type PadVoice = Readonly<{
  oscillator: OscillatorNode;
  gain: GainNode;
}>;

export type PadVoiceBank = readonly [PadVoice, PadVoice, PadVoice];

export type PadVoiceGraph = Readonly<{
  context: AudioContext;
  master: GainNode;
  bodyFilter: BiquadFilterNode;
  chordBanks: readonly [PadVoiceBank, PadVoiceBank];
  shimmer: PadVoice;
}>;

const safeDisconnect = (node: AudioNode | null) => {
  try {
    node?.disconnect();
  } catch {
    // Cleanup remains idempotent for partially constructed browser graphs.
  }
};

const safeStop = (oscillator: OscillatorNode, when?: number) => {
  try {
    if (when === undefined) oscillator.stop();
    else oscillator.stop(when);
  } catch {
    // An already stopped or partially started oscillator is safe to ignore.
  }
};

function setParam(parameter: AudioParam, value: number, atTime: number) {
  if (typeof parameter.setValueAtTime === 'function') {
    parameter.setValueAtTime(value, atTime);
  } else {
    parameter.value = value;
  }
}

function createChordBank(
  context: AudioContext,
  bodyFilter: BiquadFilterNode,
  atTime: number,
): PadVoiceBank {
  const voices: PadVoice[] = [];
  for (let index = 0; index < PAD_CHORD_VOICE_COUNT; index += 1) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    setParam(oscillator.frequency, 220, atTime);
    setParam(gain.gain, 0, atTime);
    oscillator.connect(gain);
    gain.connect(bodyFilter);
    oscillator.start(atTime);
    voices.push({ oscillator, gain });
  }
  return voices as unknown as PadVoiceBank;
}

/** Constructs and starts the complete zero-gain graph synchronously. */
export function createPadVoiceGraph(context: AudioContext): PadVoiceGraph {
  const atTime = context.currentTime;
  if (!Number.isFinite(atTime) || atTime < 0) {
    throw new Error('AudioContext returned an invalid current time.');
  }

  let master: GainNode | null = null;
  let bodyFilter: BiquadFilterNode | null = null;
  const banks: PadVoiceBank[] = [];
  let shimmer: PadVoice | null = null;
  try {
    master = context.createGain();
    setParam(master.gain, 1, atTime);
    master.connect(context.destination);

    bodyFilter = context.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    setParam(bodyFilter.frequency, 1200, atTime);
    setParam(bodyFilter.Q, 0.7, atTime);
    bodyFilter.connect(master);

    for (let index = 0; index < PAD_CHORD_BANK_COUNT; index += 1) {
      banks.push(createChordBank(context, bodyFilter, atTime));
    }

    const shimmerOscillator = context.createOscillator();
    const shimmerGain = context.createGain();
    shimmerOscillator.type = 'sine';
    setParam(shimmerOscillator.frequency, 440, atTime);
    setParam(shimmerGain.gain, 0, atTime);
    shimmerOscillator.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmerOscillator.start(atTime);
    shimmer = { oscillator: shimmerOscillator, gain: shimmerGain };

    return {
      context,
      master,
      bodyFilter,
      chordBanks: banks as unknown as readonly [PadVoiceBank, PadVoiceBank],
      shimmer,
    };
  } catch (error) {
    for (const bank of banks) {
      for (const voice of bank) {
        safeStop(voice.oscillator);
        safeDisconnect(voice.oscillator);
        safeDisconnect(voice.gain);
      }
    }
    if (shimmer) {
      safeStop(shimmer.oscillator);
      safeDisconnect(shimmer.oscillator);
      safeDisconnect(shimmer.gain);
    }
    safeDisconnect(bodyFilter);
    safeDisconnect(master);
    throw error;
  }
}

export function stopPadOscillators(graph: PadVoiceGraph, when?: number) {
  for (const bank of graph.chordBanks) {
    for (const voice of bank) safeStop(voice.oscillator, when);
  }
  safeStop(graph.shimmer.oscillator, when);
}

export function disconnectPadVoiceGraph(graph: PadVoiceGraph) {
  for (const bank of graph.chordBanks) {
    for (const voice of bank) {
      safeDisconnect(voice.oscillator);
      safeDisconnect(voice.gain);
    }
  }
  safeDisconnect(graph.shimmer.oscillator);
  safeDisconnect(graph.shimmer.gain);
  safeDisconnect(graph.bodyFilter);
  safeDisconnect(graph.master);
}

export function absoluteCentsToFrequency(cents: number): number {
  return 440 * 2 ** ((cents - 6900) / 1200);
}
