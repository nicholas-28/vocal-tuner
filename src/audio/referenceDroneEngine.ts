import {
  createInitialReferenceDroneDiagnostics,
  DEFAULT_REFERENCE_DRONE_CONFIG,
  isValidReferenceDroneConfig,
  mapReferenceDroneVolumeToGain,
  normalizeReferenceDroneVolume,
} from './referenceDroneConfig';
import type {
  ReferenceDroneCommandResult,
  ReferenceDroneConfig,
  ReferenceDroneContextState,
  ReferenceDroneEngine,
  ReferenceDroneErrorCode,
  ReferenceDroneNote,
  ReferenceDroneSnapshot,
} from '../types/referenceDrone';
import { getCurrentRuntimeFeaturePolicy } from '../config/runtimeFeatures';

type ReferenceDroneEngineOptions = {
  contextFactory?: () => AudioContext;
  config?: ReferenceDroneConfig;
  initialVolume?: number;
};

type DroneVoice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  note: ReferenceDroneNote;
  oscillatorConnected: boolean;
  gainConnected: boolean;
  started: boolean;
};

type OutputGraph = {
  context: AudioContext;
  masterGain: GainNode;
};

class DroneEngineError extends Error {
  constructor(
    readonly code: ReferenceDroneErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function defaultContextFactory(): AudioContext {
  const browserWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass =
    browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextClass) {
    throw new DroneEngineError(
      'unavailable',
      'Web Audio is unavailable in this browser.',
    );
  }
  return new AudioContextClass();
}

function isValidNote(note: ReferenceDroneNote): boolean {
  return (
    Number.isInteger(note.midiNote) &&
    Number.isFinite(note.frequencyHz) &&
    note.frequencyHz > 0
  );
}

function getContextState(context: AudioContext): ReferenceDroneContextState {
  const state = String(context.state);
  if (state === 'running' || state === 'suspended' || state === 'closed') {
    return state;
  }
  return state === 'interrupted' ? 'interrupted' : 'suspended';
}

function safeDisconnect(node: AudioNode | null): void {
  try {
    node?.disconnect();
  } catch {
    // Cleanup is intentionally idempotent.
  }
}

function safeStop(oscillator: OscillatorNode, when?: number): void {
  try {
    if (when === undefined) oscillator.stop();
    else oscillator.stop(when);
  } catch {
    // A partially started or already stopped oscillator is safe to ignore.
  }
}

function requireFiniteTime(context: AudioContext): number {
  const currentTime = context.currentTime;
  if (!Number.isFinite(currentTime) || currentTime < 0) {
    throw new DroneEngineError(
      'audio-start-failed',
      'AudioContext returned an invalid current time.',
    );
  }
  return currentTime;
}

function setParamValue(
  parameter: AudioParam,
  value: number,
  atTime: number,
): void {
  if (!Number.isFinite(value) || !Number.isFinite(atTime) || atTime < 0) {
    throw new DroneEngineError(
      'audio-start-failed',
      'Invalid Web Audio automation value.',
    );
  }
  if (typeof parameter.setValueAtTime === 'function') {
    parameter.setValueAtTime(value, atTime);
  } else {
    parameter.value = value;
  }
}

function holdAutomation(parameter: AudioParam, atTime: number): void {
  if (typeof parameter.cancelAndHoldAtTime === 'function') {
    try {
      parameter.cancelAndHoldAtTime(atTime);
      return;
    } catch {
      // Older Safari versions expose the method but may reject the call.
    }
  }
  if (typeof parameter.cancelScheduledValues === 'function') {
    parameter.cancelScheduledValues(atTime);
  }
  setParamValue(parameter, parameter.value, atTime);
}

function linearRamp(
  parameter: AudioParam,
  value: number,
  endTime: number,
): void {
  if (!Number.isFinite(value) || !Number.isFinite(endTime) || endTime < 0) {
    throw new DroneEngineError(
      'audio-start-failed',
      'Invalid Web Audio ramp value.',
    );
  }
  if (typeof parameter.linearRampToValueAtTime === 'function') {
    parameter.linearRampToValueAtTime(value, endTime);
  } else {
    setParamValue(parameter, value, endTime);
  }
}

function toEngineError(error: unknown): DroneEngineError {
  if (error instanceof DroneEngineError) return error;
  if (error instanceof DOMException && error.name === 'NotSupportedError') {
    return new DroneEngineError('unavailable', error.message);
  }
  return new DroneEngineError(
    'audio-start-failed',
    error instanceof Error ? error.message : 'Unknown Web Audio failure.',
  );
}

function debugLog(message: string, details?: Record<string, unknown>): void {
  if (
    typeof window === 'undefined' ||
    !getCurrentRuntimeFeaturePolicy().enableReferenceDroneDebugLog
  ) {
    return;
  }
  console.info(`[reference-drone] ${message}`, details ?? {});
}

export function createReferenceDroneEngine(
  options: ReferenceDroneEngineOptions = {},
): ReferenceDroneEngine {
  const requestedConfig = options.config ?? DEFAULT_REFERENCE_DRONE_CONFIG;
  const config = isValidReferenceDroneConfig(requestedConfig)
    ? requestedConfig
    : DEFAULT_REFERENCE_DRONE_CONFIG;
  const contextFactory = options.contextFactory ?? defaultContextFactory;
  const initialDiagnostics = createInitialReferenceDroneDiagnostics();
  initialDiagnostics.oscillatorType = config.oscillatorType;
  let snapshot: ReferenceDroneSnapshot = {
    status: 'stopped',
    activeMidi: null,
    frequencyHz: null,
    volume: normalizeReferenceDroneVolume(
      options.initialVolume ?? config.defaultVolume,
      config.defaultVolume,
    ),
    errorCode: null,
    diagnostics: initialDiagnostics,
  };
  const listeners = new Set<(value: ReferenceDroneSnapshot) => void>();
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let destinationConnected = false;
  let voice: DroneVoice | null = null;
  let releasePromise: Promise<void> | null = null;
  let releaseFinish: (() => void) | null = null;
  let resumePromise: Promise<void> | null = null;
  let operation = 0;
  let disposed = false;

  const publish = (next: ReferenceDroneSnapshot) => {
    snapshot = {
      ...next,
      diagnostics: { ...next.diagnostics },
    };
    for (const listener of listeners) {
      try {
        listener({ ...snapshot, diagnostics: { ...snapshot.diagnostics } });
      } catch {
        // UI subscribers cannot interrupt audio cleanup or automation.
      }
    }
  };

  const updateDiagnostics = (
    values: Partial<ReferenceDroneSnapshot['diagnostics']>,
  ) => {
    publish({
      ...snapshot,
      diagnostics: { ...snapshot.diagnostics, ...values },
    });
  };

  const cleanupVoice = (releasedVoice: DroneVoice, ended = true) => {
    releasedVoice.oscillator.onended = null;
    safeDisconnect(releasedVoice.oscillator);
    safeDisconnect(releasedVoice.gain);
    if (voice === releasedVoice) voice = null;
    updateDiagnostics({
      voiceState: ended ? 'ended' : 'none',
      oscillatorStarted: false,
      graphConnected: false,
      voiceGainTarget: null,
      effectiveGain: null,
    });
  };

  const abortVoice = (releasedVoice: DroneVoice | null) => {
    if (!releasedVoice) return;
    safeStop(releasedVoice.oscillator);
    cleanupVoice(releasedVoice, false);
  };

  const publishError = (
    error: DroneEngineError,
    lastCommand = snapshot.diagnostics.lastCommand,
  ): ReferenceDroneCommandResult => {
    abortVoice(voice);
    debugLog('error', { code: error.code, message: error.message });
    publish({
      ...snapshot,
      status: 'error',
      activeMidi: null,
      frequencyHz: null,
      errorCode: error.code,
      diagnostics: {
        ...snapshot.diagnostics,
        contextState: context
          ? getContextState(context)
          : snapshot.diagnostics.contextState,
        engineState: 'error',
        voiceState: 'none',
        oscillatorStarted: false,
        graphConnected: false,
        midiNote: null,
        frequencyHz: null,
        voiceGainTarget: null,
        effectiveGain: null,
        lastCommand,
        errorCode: error.code,
        errorMessage: import.meta.env.DEV ? error.message : null,
      },
    });
    return { ok: false, errorCode: error.code };
  };

  const handleContextStateChange = () => {
    if (disposed || !context) return;
    const contextState = getContextState(context);
    debugLog('context state changed', { state: contextState });
    if (
      snapshot.status === 'playing' ||
      snapshot.status === 'changing' ||
      snapshot.status === 'starting'
    ) {
      if (contextState !== 'running') {
        operation += 1;
        if (contextState === 'closed') {
          safeDisconnect(masterGain);
          masterGain = null;
          destinationConnected = false;
        }
        publishError(
          new DroneEngineError(
            contextState === 'interrupted'
              ? 'context-interrupted'
              : contextState === 'closed'
                ? 'context-closed'
                : 'context-not-running',
            `AudioContext changed to ${contextState}.`,
          ),
          'context-statechange',
        );
        return;
      }
    }
    updateDiagnostics({ contextState });
  };

  const detachContextListener = (ownedContext: AudioContext | null) => {
    ownedContext?.removeEventListener?.(
      'statechange',
      handleContextStateChange,
    );
  };

  const discardClosedOutput = () => {
    if (!context || getContextState(context) !== 'closed') return;
    detachContextListener(context);
    safeDisconnect(masterGain);
    context = null;
    masterGain = null;
    destinationConnected = false;
  };

  const ensureOutputGraph = (): OutputGraph => {
    if (disposed) {
      throw new DroneEngineError(
        'audio-start-failed',
        'Reference drone engine is disposed.',
      );
    }
    discardClosedOutput();
    if (!context) {
      let createdContext: AudioContext | null = null;
      let createdMaster: GainNode | null = null;
      try {
        createdContext = contextFactory();
        context = createdContext;
        context.addEventListener?.('statechange', handleContextStateChange);
        const contextState = getContextState(context);
        debugLog('context created', { state: contextState });
        if (contextState === 'closed') {
          throw new DroneEngineError(
            'context-closed',
            'AudioContext was already closed at construction.',
          );
        }
        createdMaster = context.createGain();
        const currentTime = requireFiniteTime(context);
        const mappedGain = mapReferenceDroneVolumeToGain(
          snapshot.volume,
          config.maximumMasterGain,
        );
        setParamValue(createdMaster.gain, mappedGain, currentTime);
        createdMaster.connect(context.destination);
        masterGain = createdMaster;
        destinationConnected = true;
        updateDiagnostics({
          contextState,
          destinationConnected: true,
          masterGain: mappedGain,
          effectiveGain: null,
        });
        debugLog('destination connected', { masterGain: mappedGain });
      } catch (error) {
        safeDisconnect(createdMaster);
        if (createdContext) detachContextListener(createdContext);
        context = null;
        masterGain = null;
        destinationConnected = false;
        if (createdContext && getContextState(createdContext) !== 'closed') {
          void createdContext.close().catch(() => undefined);
        }
        const engineError = toEngineError(error);
        if (engineError.code === 'audio-start-failed') {
          throw new DroneEngineError(
            'graph-connection-failed',
            engineError.message,
          );
        }
        throw engineError;
      }
    }
    if (!masterGain || !destinationConnected) {
      throw new DroneEngineError(
        'graph-connection-failed',
        'Reference drone destination is not connected.',
      );
    }
    return { context, masterGain };
  };

  const ensureReady = async (
    commandOperation: number,
  ): Promise<OutputGraph | null> => {
    const graph = ensureOutputGraph();
    let contextState = getContextState(graph.context);
    if (contextState === 'suspended' || contextState === 'interrupted') {
      debugLog('context resume begin', { state: contextState });
      resumePromise ??= graph.context.resume().finally(() => {
        resumePromise = null;
      });
      await resumePromise;
      contextState = getContextState(graph.context);
      debugLog('context resume completed', { state: contextState });
    }
    if (disposed || commandOperation !== operation) {
      debugLog('command invalidated', { commandOperation, operation });
      return null;
    }
    updateDiagnostics({ contextState });
    if (contextState !== 'running') {
      throw new DroneEngineError(
        contextState === 'interrupted'
          ? 'context-interrupted'
          : contextState === 'closed'
            ? 'context-closed'
            : 'context-not-running',
        `AudioContext is ${contextState} after resume.`,
      );
    }
    return graph;
  };

  const releaseVoice = (releasedVoice: DroneVoice): Promise<void> => {
    const releaseAt = context ? requireFiniteTime(context) : 0;
    if (voice === releasedVoice) voice = null;
    updateDiagnostics({
      engineState: 'stopping',
      voiceState: 'releasing',
      lastCommand: 'stop',
    });
    const pendingRelease = new Promise<void>((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (releaseFinish === finish) releaseFinish = null;
        cleanupVoice(releasedVoice);
        debugLog('oscillator ended');
        resolve();
      };
      releaseFinish = finish;
      releasedVoice.oscillator.onended = finish;
      try {
        holdAutomation(releasedVoice.gain.gain, releaseAt);
        linearRamp(
          releasedVoice.gain.gain,
          0,
          releaseAt + config.releaseSeconds,
        );
        releasedVoice.oscillator.stop(releaseAt + config.releaseSeconds);
      } catch {
        safeStop(releasedVoice.oscillator);
        finish();
      }
    });
    const trackedRelease = pendingRelease.finally(() => {
      if (releasePromise === trackedRelease) releasePromise = null;
    });
    releasePromise = trackedRelease;
    return trackedRelease;
  };

  const createAndStartVoice = (
    graph: OutputGraph,
    note: ReferenceDroneNote,
  ): DroneVoice => {
    let oscillator: OscillatorNode | null = null;
    let voiceGain: GainNode | null = null;
    let voiceGraphConnected = false;
    try {
      const currentTime = requireFiniteTime(graph.context);
      const mappedGain = mapReferenceDroneVolumeToGain(
        snapshot.volume,
        config.maximumMasterGain,
      );
      if (!Number.isFinite(mappedGain) || mappedGain < 0) {
        throw new DroneEngineError(
          'audio-start-failed',
          'Reference drone master gain is invalid.',
        );
      }
      setParamValue(graph.masterGain.gain, mappedGain, currentTime);
      oscillator = graph.context.createOscillator();
      voiceGain = graph.context.createGain();
      oscillator.type = config.oscillatorType;
      setParamValue(voiceGain.gain, 0, currentTime);
      setParamValue(oscillator.frequency, note.frequencyHz, currentTime);
      const nextVoice: DroneVoice = {
        oscillator,
        gain: voiceGain,
        note: { ...note },
        oscillatorConnected: false,
        gainConnected: false,
        started: false,
      };
      updateDiagnostics({
        voiceState: 'created',
        midiNote: note.midiNote,
        frequencyHz: note.frequencyHz,
        voiceGainTarget: 1,
        masterGain: mappedGain,
        effectiveGain: mappedGain,
      });
      oscillator.connect(voiceGain);
      nextVoice.oscillatorConnected = true;
      voiceGain.connect(graph.masterGain);
      nextVoice.gainConnected = true;
      voiceGraphConnected = true;
      updateDiagnostics({ graphConnected: true });
      debugLog('voice graph connected', { frequencyHz: note.frequencyHz });
      oscillator.onended = () => cleanupVoice(nextVoice);
      try {
        oscillator.start(currentTime);
      } catch (error) {
        throw new DroneEngineError(
          'oscillator-start-failed',
          error instanceof Error ? error.message : 'Oscillator start failed.',
        );
      }
      nextVoice.started = true;
      updateDiagnostics({
        voiceState: 'started',
        oscillatorStarted: true,
      });
      debugLog('oscillator started', { frequencyHz: note.frequencyHz });
      linearRamp(voiceGain.gain, 1, currentTime + config.attackSeconds);
      debugLog('attack scheduled', {
        voiceGainTarget: 1,
        masterGain: mappedGain,
      });
      return nextVoice;
    } catch (error) {
      if (oscillator) safeStop(oscillator);
      safeDisconnect(oscillator);
      safeDisconnect(voiceGain);
      if (
        oscillator &&
        voiceGain &&
        !voiceGraphConnected &&
        !(error instanceof DroneEngineError)
      ) {
        throw new DroneEngineError(
          'graph-connection-failed',
          error instanceof Error ? error.message : 'Voice connection failed.',
        );
      }
      throw error;
    }
  };

  const play = async (
    note: ReferenceDroneNote,
  ): Promise<ReferenceDroneCommandResult> => {
    if (disposed) return { ok: false, errorCode: 'audio-start-failed' };
    if (!isValidNote(note)) {
      return publishError(
        new DroneEngineError('invalid-note', 'Invalid reference note.'),
        'play-invalid-note',
      );
    }
    const commandOperation = ++operation;
    const activeVoice = voice;
    const changing = activeVoice !== null;
    const command = changing
      ? `change:${note.midiNote}`
      : `play:${note.midiNote}`;
    debugLog('command', { command, operation: commandOperation });
    publish({
      ...snapshot,
      status: changing ? 'changing' : 'starting',
      activeMidi: note.midiNote,
      frequencyHz: note.frequencyHz,
      errorCode: null,
      diagnostics: {
        ...snapshot.diagnostics,
        engineState: changing ? 'changing' : 'starting',
        midiNote: note.midiNote,
        frequencyHz: note.frequencyHz,
        lastCommand: command,
        errorCode: null,
        errorMessage: null,
      },
    });
    try {
      if (!activeVoice && releasePromise) await releasePromise;
      if (disposed || commandOperation !== operation) {
        return { ok: false, errorCode: 'audio-start-failed' };
      }
      const graph = await ensureReady(commandOperation);
      if (!graph || disposed || commandOperation !== operation) {
        return { ok: false, errorCode: 'audio-start-failed' };
      }
      if (activeVoice) {
        if (
          voice !== activeVoice ||
          !activeVoice.started ||
          !activeVoice.oscillatorConnected ||
          !activeVoice.gainConnected ||
          !destinationConnected
        ) {
          throw new DroneEngineError(
            'graph-connection-failed',
            'Active reference-drone graph is incomplete.',
          );
        }
        if (
          activeVoice.note.midiNote !== note.midiNote ||
          activeVoice.note.frequencyHz !== note.frequencyHz
        ) {
          const currentTime = requireFiniteTime(graph.context);
          holdAutomation(activeVoice.oscillator.frequency, currentTime);
          linearRamp(
            activeVoice.oscillator.frequency,
            note.frequencyHz,
            currentTime + config.transitionSeconds,
          );
          activeVoice.note = { ...note };
          debugLog('note transition scheduled', {
            frequencyHz: note.frequencyHz,
          });
        }
      } else {
        const nextVoice = createAndStartVoice(graph, note);
        if (disposed || commandOperation !== operation) {
          abortVoice(nextVoice);
          return { ok: false, errorCode: 'audio-start-failed' };
        }
        voice = nextVoice;
      }
      if (
        getContextState(graph.context) !== 'running' ||
        !voice?.started ||
        !voice.oscillatorConnected ||
        !voice.gainConnected ||
        !destinationConnected
      ) {
        throw new DroneEngineError(
          'graph-connection-failed',
          'Playback graph could not be confirmed.',
        );
      }
      publish({
        ...snapshot,
        status: 'playing',
        activeMidi: note.midiNote,
        frequencyHz: note.frequencyHz,
        errorCode: null,
        diagnostics: {
          ...snapshot.diagnostics,
          contextState: 'running',
          engineState: 'playing',
          voiceState: 'started',
          oscillatorStarted: true,
          graphConnected: true,
          destinationConnected: true,
          midiNote: note.midiNote,
          frequencyHz: note.frequencyHz,
          voiceGainTarget: 1,
          effectiveGain: mapReferenceDroneVolumeToGain(
            snapshot.volume,
            config.maximumMasterGain,
          ),
          errorCode: null,
          errorMessage: null,
        },
      });
      debugLog('playback confirmed', {
        contextState: 'running',
        frequencyHz: note.frequencyHz,
        masterGain: snapshot.diagnostics.masterGain,
      });
      return { ok: true };
    } catch (error) {
      return publishError(toEngineError(error), command);
    }
  };

  const stop = async (): Promise<void> => {
    if (disposed) return;
    const commandOperation = ++operation;
    const activeVoice = voice;
    debugLog('stop', { hasVoice: Boolean(activeVoice) });
    if (!activeVoice) {
      if (releasePromise) await releasePromise;
      if (!disposed && commandOperation === operation) {
        publish({
          ...snapshot,
          status: 'stopped',
          activeMidi: null,
          frequencyHz: null,
          errorCode: null,
          diagnostics: {
            ...snapshot.diagnostics,
            engineState: 'stopped',
            voiceState: 'none',
            oscillatorStarted: false,
            graphConnected: false,
            midiNote: null,
            frequencyHz: null,
            voiceGainTarget: null,
            effectiveGain: null,
            lastCommand: 'stop',
            errorCode: null,
            errorMessage: null,
          },
        });
      }
      return;
    }
    publish({
      ...snapshot,
      status: 'stopping',
      errorCode: null,
      diagnostics: {
        ...snapshot.diagnostics,
        engineState: 'stopping',
        voiceState: 'releasing',
        lastCommand: 'stop',
      },
    });
    await releaseVoice(activeVoice);
    if (!disposed && commandOperation === operation) {
      publish({
        ...snapshot,
        status: 'stopped',
        activeMidi: null,
        frequencyHz: null,
        errorCode: null,
        diagnostics: {
          ...snapshot.diagnostics,
          engineState: 'stopped',
          voiceState: 'none',
          oscillatorStarted: false,
          graphConnected: false,
          midiNote: null,
          frequencyHz: null,
          voiceGainTarget: null,
          effectiveGain: null,
          lastCommand: 'stop',
        },
      });
    }
  };

  const setVolume = (normalizedVolume: number): void => {
    if (disposed) return;
    const volume = normalizeReferenceDroneVolume(
      normalizedVolume,
      snapshot.volume,
    );
    const mappedGain = mapReferenceDroneVolumeToGain(
      volume,
      config.maximumMasterGain,
    );
    publish({
      ...snapshot,
      volume,
      diagnostics: {
        ...snapshot.diagnostics,
        masterGain: context ? mappedGain : null,
        effectiveGain: voice?.started ? mappedGain : null,
        lastCommand: `volume:${Math.round(volume * 100)}`,
      },
    });
    if (!context || !masterGain || getContextState(context) === 'closed') {
      return;
    }
    try {
      const currentTime = requireFiniteTime(context);
      holdAutomation(masterGain.gain, currentTime);
      if (typeof masterGain.gain.setTargetAtTime === 'function') {
        masterGain.gain.setTargetAtTime(
          mappedGain,
          currentTime,
          config.volumeSmoothingSeconds,
        );
      } else {
        linearRamp(
          masterGain.gain,
          mappedGain,
          currentTime + config.volumeSmoothingSeconds,
        );
      }
      debugLog('volume scheduled', { masterGain: mappedGain });
    } catch (error) {
      publishError(toEngineError(error), 'volume');
    }
  };

  const dispose = async (): Promise<void> => {
    if (disposed) return;
    disposed = true;
    operation += 1;
    debugLog('dispose');
    const activeVoice = voice;
    voice = null;
    if (activeVoice) {
      safeStop(activeVoice.oscillator, context?.currentTime);
      cleanupVoice(activeVoice, false);
    }
    releaseFinish?.();
    releaseFinish = null;
    safeDisconnect(masterGain);
    masterGain = null;
    destinationConnected = false;
    const ownedContext = context;
    context = null;
    detachContextListener(ownedContext);
    publish({
      ...snapshot,
      status: 'stopped',
      activeMidi: null,
      frequencyHz: null,
      errorCode: null,
      diagnostics: {
        ...snapshot.diagnostics,
        contextState:
          ownedContext && getContextState(ownedContext) === 'closed'
            ? 'closed'
            : snapshot.diagnostics.contextState,
        engineState: 'disposed',
        voiceState: 'none',
        oscillatorStarted: false,
        graphConnected: false,
        destinationConnected: false,
        midiNote: null,
        frequencyHz: null,
        voiceGainTarget: null,
        masterGain: null,
        effectiveGain: null,
        lastCommand: 'dispose',
      },
    });
    listeners.clear();
    if (ownedContext && getContextState(ownedContext) !== 'closed') {
      try {
        await ownedContext.close();
      } catch {
        // Disposal remains idempotent even when browser shutdown rejects close.
      }
    }
  };

  return {
    play,
    stop,
    setVolume,
    getSnapshot: () => ({
      ...snapshot,
      diagnostics: { ...snapshot.diagnostics },
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      listener({ ...snapshot, diagnostics: { ...snapshot.diagnostics } });
      return () => listeners.delete(listener);
    },
    dispose,
  };
}
