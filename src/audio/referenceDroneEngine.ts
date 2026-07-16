import {
  createInitialAutomationDiagnostics,
  createInitialDiagnosticTestResult,
  createInitialReferenceDroneDiagnostics,
  DEFAULT_REFERENCE_DRONE_CONFIG,
  isValidReferenceDroneConfig,
  mapReferenceDroneVolumeToGain,
  normalizeReferenceDroneVolume,
} from './referenceDroneConfig';
import { selectAudioContextConstructor } from './referenceDroneContext';
import {
  createInitialSignalMeasurement,
  measureReferenceDroneSignal,
  REFERENCE_DRONE_ANALYSER_FFT_SIZE,
  REFERENCE_DRONE_SIGNAL_INTERVAL_MS,
} from './referenceDroneSignal';
import type {
  ReferenceDroneAudioContextConstructorName,
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
  contextConstructorName?: ReferenceDroneAudioContextConstructorName;
  config?: ReferenceDroneConfig;
  initialVolume?: number;
  diagnosticsEnabled?: boolean;
};

type DroneVoice = {
  generationId: number;
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
  analyser: AnalyserNode | null;
};

type DiagnosticVoice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  analyser: AnalyserNode;
  samples: Float32Array;
  generationId: number;
  started: boolean;
};

type DiagnosticTestKey =
  | 'engineOutputTest'
  | 'directOutputTest'
  | 'constantGainOutputTest'
  | 'recreatedContextOutputTest';

class DroneEngineError extends Error {
  constructor(
    readonly code: ReferenceDroneErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function createDefaultContext(): AudioContext {
  const selection = selectAudioContextConstructor();
  if (!selection.constructor) {
    throw new DroneEngineError(
      'unavailable',
      'Web Audio is unavailable in this browser.',
    );
  }
  return new selection.constructor();
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
  return state === 'interrupted' ? 'interrupted' : 'unknown';
}

let nextEngineGenerationId = 1;
const referenceDronePageStartTime =
  typeof performance === 'undefined' ? Date.now() : performance.now();

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
  const constructorSelection = selectAudioContextConstructor();
  const diagnosticsEnabled = options.diagnosticsEnabled === true;
  const contextFactory = options.contextFactory ?? createDefaultContext;
  const constructorName =
    options.contextConstructorName ??
    (options.contextFactory ? 'AudioContext' : constructorSelection.name);
  const engineGenerationId = nextEngineGenerationId++;
  const initialDiagnostics = createInitialReferenceDroneDiagnostics(
    constructorName,
    engineGenerationId,
  );
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
  let outputAnalyser: AnalyserNode | null = null;
  let outputAnalyserSamples: Float32Array | null = null;
  let destinationConnected = false;
  let voice: DroneVoice | null = null;
  let releasePromise: Promise<void> | null = null;
  let releaseFinish: (() => void) | null = null;
  let resumePromise: Promise<void> | null = null;
  let operation = 0;
  let contextGeneration = 0;
  let voiceGeneration = 0;
  let analyserGeneration = 0;
  let signalInterval: number | null = null;
  let diagnosticVoice: DiagnosticVoice | null = null;
  let persistentSignalOwner: 'drone' | 'engine-test' | null = null;
  let lifecycleSequence = 0;
  let disposed = false;
  let contextStateListener: {
    context: AudioContext;
    listener: EventListener;
  } | null = null;

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

  const addLifecycleEvent = (name: string, detail: string | null = null) => {
    const now =
      typeof performance === 'undefined' ? Date.now() : performance.now();
    const event = Object.freeze({
      sequence: ++lifecycleSequence,
      relativeTimeMs: Math.max(0, now - referenceDronePageStartTime),
      name,
      detail,
    });
    updateDiagnostics({
      lifecycleLog: Object.freeze(
        [...snapshot.diagnostics.lifecycleLog, event].slice(-40),
      ),
    });
  };

  const nowMs = () =>
    typeof performance === 'undefined' ? Date.now() : performance.now();

  const createAutomationRecord = (
    parameter: AudioParam,
    target: number,
    contextTime: number,
    method: string,
    fallbackMethod: string | null,
    ownedContext: AudioContext,
  ) =>
    Object.freeze({
      currentValue: Number.isFinite(parameter.value) ? parameter.value : null,
      scheduledTarget: target,
      schedulingContextTime: contextTime,
      lastAutomationTimestampMs: nowMs(),
      method,
      fallbackMethod,
      scheduledAfterRunning: getContextState(ownedContext) === 'running',
    });

  const updateDiagnosticTest = (
    key: DiagnosticTestKey,
    values: Partial<ReferenceDroneSnapshot['diagnostics'][DiagnosticTestKey]>,
  ) => {
    updateDiagnostics({
      [key]: Object.freeze({
        ...snapshot.diagnostics[key],
        ...values,
      }),
    });
  };

  const stopSignalSampling = () => {
    if (signalInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(signalInterval);
    }
    signalInterval = null;
    persistentSignalOwner = null;
  };

  const samplePersistentSignal = (
    ownedAnalyser: AnalyserNode,
    ownedContextGeneration: number,
    ownedAnalyserGeneration: number,
    ownedVoiceGeneration: number | null,
  ) => {
    if (
      disposed ||
      outputAnalyser !== ownedAnalyser ||
      contextGeneration !== ownedContextGeneration ||
      analyserGeneration !== ownedAnalyserGeneration ||
      !outputAnalyserSamples
    )
      return;
    ownedAnalyser.getFloatTimeDomainData(outputAnalyserSamples);
    const signal = measureReferenceDroneSignal(
      outputAnalyserSamples,
      snapshot.diagnostics.persistentSignal,
      nowMs(),
      {
        analyserGenerationId: ownedAnalyserGeneration,
        contextGenerationId: ownedContextGeneration,
        voiceGenerationId: ownedVoiceGeneration,
        analyserConnectedToDestination: destinationConnected,
      },
    );
    const values: Partial<ReferenceDroneSnapshot['diagnostics']> = {
      persistentSignal: signal,
    };
    if (persistentSignalOwner === 'engine-test') {
      values.engineOutputTest = Object.freeze({
        ...snapshot.diagnostics.engineOutputTest,
        signal,
      });
    }
    updateDiagnostics(values);
  };

  const startPersistentSignalSampling = (
    owner: 'drone' | 'engine-test',
    ownedVoiceGeneration: number | null,
  ) => {
    stopSignalSampling();
    if (!diagnosticsEnabled || !outputAnalyser || typeof window === 'undefined')
      return;
    persistentSignalOwner = owner;
    const ownedAnalyser = outputAnalyser;
    const ownedContextGeneration = contextGeneration;
    const ownedAnalyserGeneration = analyserGeneration;
    const sample = () =>
      samplePersistentSignal(
        ownedAnalyser,
        ownedContextGeneration,
        ownedAnalyserGeneration,
        ownedVoiceGeneration,
      );
    sample();
    signalInterval = window.setInterval(
      sample,
      REFERENCE_DRONE_SIGNAL_INTERVAL_MS,
    );
  };

  const cleanupVoice = (releasedVoice: DroneVoice, ended = true) => {
    releasedVoice.oscillator.onended = null;
    safeDisconnect(releasedVoice.oscillator);
    safeDisconnect(releasedVoice.gain);
    const ownsCurrentDiagnostics =
      voice === releasedVoice ||
      snapshot.diagnostics.voiceGenerationId === releasedVoice.generationId;
    if (voice === releasedVoice) voice = null;
    if (!ownsCurrentDiagnostics) return;
    stopSignalSampling();
    addLifecycleEvent('node ended', `voice ${releasedVoice.generationId}`);
    updateDiagnostics({
      voiceState: ended ? 'ended' : 'none',
      oscillatorEnded: ended,
      oscillatorStarted: false,
      graphConnected: false,
      voiceGainConnected: false,
      voiceGenerationId: null,
      voiceGainTarget: null,
      voiceGainCurrent: null,
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
        voiceGenerationId: null,
        oscillatorCreated: false,
        oscillatorStarted: false,
        oscillatorEnded: false,
        graphConnected: false,
        voiceGainConnected: false,
        midiNote: null,
        frequencyHz: null,
        voiceGainTarget: null,
        voiceGainCurrent: null,
        effectiveGain: null,
        lastCommand,
        errorCode: error.code,
        errorMessage: import.meta.env.DEV ? error.message : null,
        requiresExplicitReactivation:
          error.code === 'context-interrupted' ||
          error.code === 'context-not-running' ||
          error.code === 'context-closed',
      },
    });
    return { ok: false, errorCode: error.code };
  };

  const handleContextStateChange = (
    ownedContext: AudioContext,
    ownedGeneration: number,
  ) => {
    if (
      disposed ||
      context !== ownedContext ||
      contextGeneration !== ownedGeneration
    )
      return;
    const contextState = getContextState(ownedContext);
    const timestamp =
      typeof performance === 'undefined' ? Date.now() : performance.now();
    addLifecycleEvent('context statechange', contextState);
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
          safeDisconnect(outputAnalyser);
          masterGain = null;
          outputAnalyser = null;
          outputAnalyserSamples = null;
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
    updateDiagnostics({
      contextState,
      lastStateChangeTimestampMs: timestamp,
      requiresExplicitReactivation:
        contextState === 'suspended' || contextState === 'interrupted',
    });
  };

  const detachContextListener = (ownedContext: AudioContext | null) => {
    if (!ownedContext || contextStateListener?.context !== ownedContext) return;
    ownedContext.removeEventListener?.(
      'statechange',
      contextStateListener.listener,
    );
    contextStateListener = null;
  };

  const discardClosedOutput = () => {
    if (!context || getContextState(context) !== 'closed') return;
    detachContextListener(context);
    safeDisconnect(masterGain);
    safeDisconnect(outputAnalyser);
    context = null;
    masterGain = null;
    outputAnalyser = null;
    outputAnalyserSamples = null;
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
      let createdAnalyser: AnalyserNode | null = null;
      try {
        addLifecycleEvent('context constructor requested', constructorName);
        createdContext = contextFactory();
        context = createdContext;
        const ownedGeneration = ++contextGeneration;
        const listener = () =>
          handleContextStateChange(createdContext!, ownedGeneration);
        contextStateListener = { context, listener };
        context.addEventListener?.('statechange', listener);
        const contextState = getContextState(context);
        addLifecycleEvent(
          'context created',
          `${ownedGeneration}:${contextState}`,
        );
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
        const masterAutomation = createAutomationRecord(
          createdMaster.gain,
          mappedGain,
          currentTime,
          typeof createdMaster.gain.setValueAtTime === 'function'
            ? 'setValueAtTime'
            : 'value-assignment',
          null,
          context,
        );
        if (diagnosticsEnabled) {
          createdAnalyser = context.createAnalyser();
          createdAnalyser.fftSize = REFERENCE_DRONE_ANALYSER_FFT_SIZE;
          createdAnalyser.smoothingTimeConstant = 0;
          createdMaster.connect(createdAnalyser);
          createdAnalyser.connect(context.destination);
          outputAnalyser = createdAnalyser;
          outputAnalyserSamples = new Float32Array(createdAnalyser.fftSize);
          analyserGeneration += 1;
        } else {
          createdMaster.connect(context.destination);
        }
        masterGain = createdMaster;
        destinationConnected = true;
        updateDiagnostics({
          constructorAvailable: true,
          constructorName,
          contextGenerationId: ownedGeneration,
          contextState,
          contextSampleRate: Number.isFinite(context.sampleRate)
            ? context.sampleRate
            : null,
          contextBaseLatency:
            'baseLatency' in context &&
            Number.isFinite((context as AudioContext).baseLatency)
              ? (context as AudioContext).baseLatency
              : null,
          destinationChannelCount: Number.isFinite(
            context.destination.channelCount,
          )
            ? context.destination.channelCount
            : null,
          masterGainConnected: true,
          destinationConnected: true,
          masterGain: mappedGain,
          masterGainCurrent: createdMaster.gain.value,
          masterAutomation,
          effectiveGain: null,
          persistentSignal: diagnosticsEnabled
            ? Object.freeze({
                ...createInitialSignalMeasurement(),
                analyserGenerationId: analyserGeneration,
                contextGenerationId: ownedGeneration,
                analyserConnectedToDestination: true,
              })
            : createInitialSignalMeasurement(),
        });
        debugLog('destination connected', { masterGain: mappedGain });
        addLifecycleEvent(
          'nodes connected',
          diagnosticsEnabled
            ? 'master->output-analyser->destination'
            : 'master->destination',
        );
      } catch (error) {
        safeDisconnect(createdMaster);
        safeDisconnect(createdAnalyser);
        if (createdContext) detachContextListener(createdContext);
        context = null;
        masterGain = null;
        outputAnalyser = null;
        outputAnalyserSamples = null;
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
    return { context, masterGain, analyser: outputAnalyser };
  };

  const beginResumeFromUserGesture = (
    graph: OutputGraph,
  ): Promise<void> | null => {
    const contextState = getContextState(graph.context);
    if (
      contextState === 'suspended' ||
      contextState === 'interrupted' ||
      snapshot.diagnostics.requiresExplicitReactivation
    ) {
      debugLog('context resume begin', { state: contextState });
      addLifecycleEvent('resume requested', contextState);
      updateDiagnostics({
        resumeRequested: true,
        resumeResult: 'pending',
        contextStateAfterResume: null,
        renderingClockAdvanced: null,
      });
      resumePromise ??= graph.context.resume().finally(() => {
        resumePromise = null;
      });
      return resumePromise;
    }
    return null;
  };

  const confirmReady = async (
    graph: OutputGraph,
    commandOperation: number,
    pendingResume: Promise<void> | null,
  ): Promise<OutputGraph | null> => {
    if (pendingResume) {
      try {
        await pendingResume;
        const state = getContextState(graph.context);
        addLifecycleEvent('resume resolved', state);
        updateDiagnostics({
          resumeResult: 'resolved',
          contextStateAfterResume: state,
        });
      } catch (error) {
        addLifecycleEvent(
          'resume rejected',
          error instanceof Error ? error.name : 'unknown',
        );
        updateDiagnostics({
          resumeResult: 'rejected',
          contextStateAfterResume: getContextState(graph.context),
        });
        throw error;
      }
    }
    const contextState = getContextState(graph.context);
    debugLog('context readiness checked', { state: contextState });
    if (disposed || commandOperation !== operation) {
      debugLog('command invalidated', { commandOperation, operation });
      return null;
    }
    updateDiagnostics({
      contextState,
      contextStateAfterResume: pendingResume ? contextState : null,
      requiresExplicitReactivation: contextState !== 'running',
    });
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
    if (pendingResume) {
      const before = graph.context.currentTime;
      await new Promise<void>((resolve) => setTimeout(resolve, 48));
      if (disposed || commandOperation !== operation) return null;
      const advanced = graph.context.currentTime > before;
      updateDiagnostics({ renderingClockAdvanced: advanced });
      addLifecycleEvent(
        'rendering clock checked',
        advanced ? 'advanced' : 'stalled',
      );
      if (!advanced) {
        throw new DroneEngineError(
          'context-not-running',
          'AudioContext reported running but its rendering clock did not advance.',
        );
      }
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

  const createPreparedVoice = (
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
        generationId: ++voiceGeneration,
        oscillator,
        gain: voiceGain,
        note: { ...note },
        oscillatorConnected: false,
        gainConnected: false,
        started: false,
      };
      updateDiagnostics({
        voiceState: 'created',
        voiceGenerationId: nextVoice.generationId,
        oscillatorCreated: true,
        oscillatorEnded: false,
        midiNote: note.midiNote,
        frequencyHz: note.frequencyHz,
        voiceGainTarget: 0,
        voiceGainCurrent: voiceGain.gain.value,
        voiceAutomation: createAutomationRecord(
          voiceGain.gain,
          0,
          currentTime,
          typeof voiceGain.gain.setValueAtTime === 'function'
            ? 'setValueAtTime'
            : 'value-assignment',
          null,
          graph.context,
        ),
        masterGain: mappedGain,
        masterGainCurrent: graph.masterGain.gain.value,
        effectiveGain: 0,
      });
      oscillator.connect(voiceGain);
      nextVoice.oscillatorConnected = true;
      voiceGain.connect(graph.masterGain);
      nextVoice.gainConnected = true;
      voiceGraphConnected = true;
      updateDiagnostics({
        graphConnected: true,
        voiceGainConnected: true,
      });
      addLifecycleEvent('nodes connected', `voice ${nextVoice.generationId}`);
      debugLog('voice graph connected', { frequencyHz: note.frequencyHz });
      oscillator.onended = () => cleanupVoice(nextVoice);
      try {
        addLifecycleEvent(
          'oscillator start requested',
          `voice ${nextVoice.generationId}`,
        );
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
      addLifecycleEvent(
        'oscillator started',
        `voice ${nextVoice.generationId}`,
      );
      debugLog('oscillator started', { frequencyHz: note.frequencyHz });
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

  const scheduleVoiceAttack = (
    preparedVoice: DroneVoice,
    graph: OutputGraph,
  ) => {
    const currentTime = requireFiniteTime(graph.context);
    linearRamp(preparedVoice.gain.gain, 1, currentTime + config.attackSeconds);
    const method =
      typeof preparedVoice.gain.gain.linearRampToValueAtTime === 'function'
        ? 'linearRampToValueAtTime'
        : typeof preparedVoice.gain.gain.setValueAtTime === 'function'
          ? 'setValueAtTime'
          : 'value-assignment';
    updateDiagnostics({
      voiceGainTarget: 1,
      voiceGainCurrent: preparedVoice.gain.gain.value,
      voiceAutomation: createAutomationRecord(
        preparedVoice.gain.gain,
        1,
        currentTime + config.attackSeconds,
        method,
        method === 'linearRampToValueAtTime' ? null : method,
        graph.context,
      ),
    });
    addLifecycleEvent(
      'attack scheduled',
      `voice ${preparedVoice.generationId}`,
    );
    debugLog('attack scheduled', {
      voiceGainTarget: 1,
      masterGain: snapshot.diagnostics.masterGain,
    });
  };

  const cleanupDiagnosticVoice = (ownedVoice: DiagnosticVoice | null) => {
    if (!ownedVoice) return;
    safeStop(ownedVoice.oscillator);
    safeDisconnect(ownedVoice.oscillator);
    safeDisconnect(ownedVoice.gain);
    safeDisconnect(ownedVoice.analyser);
    if (diagnosticVoice === ownedVoice) diagnosticVoice = null;
    stopSignalSampling();
  };

  const createDirectDiagnosticVoice = (graph: OutputGraph): DiagnosticVoice => {
    let oscillator: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let analyser: AnalyserNode | null = null;
    try {
      const currentTime = requireFiniteTime(graph.context);
      oscillator = graph.context.createOscillator();
      gain = graph.context.createGain();
      analyser = graph.context.createAnalyser();
      analyser.fftSize = REFERENCE_DRONE_ANALYSER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      oscillator.type = 'sine';
      setParamValue(oscillator.frequency, 440, currentTime);
      setParamValue(gain.gain, 0, currentTime);
      oscillator.connect(gain);
      gain.connect(analyser);
      analyser.connect(graph.context.destination);
      oscillator.start(currentTime);
      const nextVoice: DiagnosticVoice = {
        oscillator,
        gain,
        analyser,
        samples: new Float32Array(analyser.fftSize),
        generationId: ++voiceGeneration,
        started: true,
      };
      analyserGeneration += 1;
      diagnosticVoice = nextVoice;
      addLifecycleEvent(
        'direct oscillator started',
        `voice ${nextVoice.generationId}`,
      );
      return nextVoice;
    } catch (error) {
      if (oscillator) safeStop(oscillator);
      safeDisconnect(oscillator);
      safeDisconnect(gain);
      safeDisconnect(analyser);
      throw error;
    }
  };

  const startDirectSignalSampling = (
    key: DiagnosticTestKey,
    ownedVoice: DiagnosticVoice,
  ) => {
    stopSignalSampling();
    if (typeof window === 'undefined') return;
    const ownedContextGeneration = contextGeneration;
    const ownedAnalyserGeneration = analyserGeneration;
    const sample = () => {
      if (
        disposed ||
        diagnosticVoice !== ownedVoice ||
        contextGeneration !== ownedContextGeneration ||
        analyserGeneration !== ownedAnalyserGeneration
      )
        return;
      ownedVoice.analyser.getFloatTimeDomainData(ownedVoice.samples);
      const signal = measureReferenceDroneSignal(
        ownedVoice.samples,
        snapshot.diagnostics[key].signal,
        nowMs(),
        {
          analyserGenerationId: ownedAnalyserGeneration,
          contextGenerationId: ownedContextGeneration,
          voiceGenerationId: ownedVoice.generationId,
          analyserConnectedToDestination: true,
        },
      );
      updateDiagnosticTest(key, { signal });
    };
    sample();
    signalInterval = window.setInterval(
      sample,
      REFERENCE_DRONE_SIGNAL_INTERVAL_MS,
    );
  };

  const recreateOutputContextFromUserGesture = () => {
    const oldContext = context;
    const oldGeneration = oldContext ? contextGeneration : null;
    stopSignalSampling();
    abortVoice(voice);
    cleanupDiagnosticVoice(diagnosticVoice);
    safeDisconnect(masterGain);
    safeDisconnect(outputAnalyser);
    masterGain = null;
    outputAnalyser = null;
    outputAnalyserSamples = null;
    destinationConnected = false;
    detachContextListener(oldContext);
    context = null;
    updateDiagnostics({
      previousContextGenerationId: oldGeneration,
      contextCloseResult: oldContext ? 'pending' : 'no-context',
      contextGenerationId: null,
      contextState: 'unavailable',
      masterGainConnected: false,
      destinationConnected: false,
      persistentSignal: createInitialSignalMeasurement(),
    });
    if (oldContext) {
      void oldContext
        .close()
        .then(() => {
          if (!disposed) updateDiagnostics({ contextCloseResult: 'resolved' });
        })
        .catch(() => {
          if (!disposed) updateDiagnostics({ contextCloseResult: 'rejected' });
        });
    }
    addLifecycleEvent('output context recreation requested');
  };

  const runDirectOutputTestFromUserGesture = async (
    key: DiagnosticTestKey,
    constantGain: boolean,
    recreateContext: boolean,
  ): Promise<ReferenceDroneCommandResult> => {
    if (
      disposed ||
      voice ||
      diagnosticVoice ||
      snapshot.diagnostics.outputTestStatus === 'starting' ||
      snapshot.diagnostics.outputTestStatus === 'playing'
    )
      return { ok: false, errorCode: 'audio-start-failed' };
    const commandOperation = ++operation;
    if (recreateContext) recreateOutputContextFromUserGesture();
    updateDiagnosticTest(key, {
      status: 'starting',
      oscillatorStarted: false,
      signal: createInitialSignalMeasurement(),
      automation: createInitialAutomationDiagnostics(),
      errorMessage: null,
    });
    addLifecycleEvent(
      'activation received',
      recreateContext
        ? 'recreate-context-test'
        : constantGain
          ? 'constant-gain-test'
          : 'direct-output-test',
    );
    try {
      const graph = ensureOutputGraph();
      const pendingResume = beginResumeFromUserGesture(graph);
      const testVoice = createDirectDiagnosticVoice(graph);
      updateDiagnosticTest(key, { oscillatorStarted: true });
      const readyGraph = await confirmReady(
        graph,
        commandOperation,
        pendingResume,
      );
      if (!readyGraph || disposed || commandOperation !== operation) {
        cleanupDiagnosticVoice(testVoice);
        updateDiagnosticTest(key, { status: 'failed' });
        return { ok: false, errorCode: 'audio-start-failed' };
      }
      const currentTime = requireFiniteTime(readyGraph.context);
      const gainValue = 0.12;
      let method: string;
      if (constantGain) {
        setParamValue(testVoice.gain.gain, gainValue, currentTime);
        method =
          typeof testVoice.gain.gain.setValueAtTime === 'function'
            ? 'setValueAtTime'
            : 'value-assignment';
      } else {
        linearRamp(testVoice.gain.gain, gainValue, currentTime + 0.02);
        method =
          typeof testVoice.gain.gain.linearRampToValueAtTime === 'function'
            ? 'linearRampToValueAtTime'
            : typeof testVoice.gain.gain.setValueAtTime === 'function'
              ? 'setValueAtTime'
              : 'value-assignment';
      }
      const automation = createAutomationRecord(
        testVoice.gain.gain,
        gainValue,
        constantGain ? currentTime : currentTime + 0.02,
        method,
        method === (constantGain ? 'setValueAtTime' : 'linearRampToValueAtTime')
          ? null
          : method,
        readyGraph.context,
      );
      updateDiagnosticTest(key, { status: 'playing', automation });
      startDirectSignalSampling(key, testVoice);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
      if (
        disposed ||
        commandOperation !== operation ||
        diagnosticVoice !== testVoice
      ) {
        cleanupDiagnosticVoice(testVoice);
        updateDiagnosticTest(key, { status: 'failed' });
        return { ok: false, errorCode: 'audio-start-failed' };
      }
      cleanupDiagnosticVoice(testVoice);
      updateDiagnosticTest(key, { status: 'succeeded' });
      addLifecycleEvent('direct output test completed', key);
      return { ok: true };
    } catch (error) {
      cleanupDiagnosticVoice(diagnosticVoice);
      updateDiagnosticTest(key, {
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown output failure.',
      });
      return publishError(toEngineError(error), key);
    }
  };

  const activateFromUserGesture = async (
    note: ReferenceDroneNote,
  ): Promise<ReferenceDroneCommandResult> => {
    if (disposed) return { ok: false, errorCode: 'audio-start-failed' };
    if (
      diagnosticVoice ||
      snapshot.diagnostics.outputTestStatus === 'starting' ||
      snapshot.diagnostics.outputTestStatus === 'playing'
    ) {
      return { ok: false, errorCode: 'audio-start-failed' };
    }
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
    const activationTimestamp =
      typeof performance === 'undefined' ? Date.now() : performance.now();
    addLifecycleEvent('activation received', command);
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
        lastUserActivationTimestampMs: activationTimestamp,
        errorCode: null,
        errorMessage: null,
      },
    });
    try {
      if (!activeVoice && releasePromise) releaseFinish?.();
      if (disposed || commandOperation !== operation) {
        return { ok: false, errorCode: 'audio-start-failed' };
      }
      const graph = ensureOutputGraph();
      const pendingResume = beginResumeFromUserGesture(graph);
      let preparedVoice: DroneVoice | null = null;
      if (!activeVoice) {
        preparedVoice = createPreparedVoice(graph, note);
        voice = preparedVoice;
      }
      const readyGraph = await confirmReady(
        graph,
        commandOperation,
        pendingResume,
      );
      if (!readyGraph || disposed || commandOperation !== operation) {
        if (preparedVoice) abortVoice(preparedVoice);
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
          const currentTime = requireFiniteTime(readyGraph.context);
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
      } else if (preparedVoice) {
        scheduleVoiceAttack(preparedVoice, readyGraph);
      }
      if (
        getContextState(readyGraph.context) !== 'running' ||
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
          voiceGainCurrent: voice?.gain.gain.value ?? null,
          effectiveGain: mapReferenceDroneVolumeToGain(
            snapshot.volume,
            config.maximumMasterGain,
          ),
          errorCode: null,
          errorMessage: null,
          requiresExplicitReactivation: false,
        },
      });
      addLifecycleEvent('playback confirmed', `voice ${voice.generationId}`);
      startPersistentSignalSampling('drone', voice.generationId);
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

  const play = activateFromUserGesture;

  const playOutputTestFromUserGesture =
    async (): Promise<ReferenceDroneCommandResult> => {
      if (
        disposed ||
        voice ||
        snapshot.diagnostics.outputTestStatus === 'starting' ||
        snapshot.diagnostics.outputTestStatus === 'playing'
      ) {
        return { ok: false, errorCode: 'audio-start-failed' };
      }
      const commandOperation = ++operation;
      const activationTimestamp =
        typeof performance === 'undefined' ? Date.now() : performance.now();
      addLifecycleEvent('activation received', 'output-test');
      updateDiagnostics({
        lastUserActivationTimestampMs: activationTimestamp,
        lastCommand: 'output-test',
        outputTestStatus: 'starting',
        engineOutputTest: Object.freeze({
          ...createInitialDiagnosticTestResult(
            'oscillator → voice gain → master gain → output analyser → destination',
          ),
          status: 'starting',
        }),
        persistentSignal: outputAnalyser
          ? Object.freeze({
              ...createInitialSignalMeasurement(),
              analyserGenerationId: analyserGeneration,
              contextGenerationId: contextGeneration,
              analyserConnectedToDestination: destinationConnected,
            })
          : createInitialSignalMeasurement(),
        errorCode: null,
        errorMessage: null,
      });
      try {
        if (releasePromise) releaseFinish?.();
        const graph = ensureOutputGraph();
        const pendingResume = beginResumeFromUserGesture(graph);
        const testVoice = createPreparedVoice(graph, {
          midiNote: 69,
          frequencyHz: 440,
        });
        voice = testVoice;
        const readyGraph = await confirmReady(
          graph,
          commandOperation,
          pendingResume,
        );
        if (!readyGraph || disposed || commandOperation !== operation) {
          abortVoice(testVoice);
          updateDiagnostics({ outputTestStatus: 'failed' });
          return { ok: false, errorCode: 'audio-start-failed' };
        }
        scheduleVoiceAttack(testVoice, readyGraph);
        updateDiagnostics({ outputTestStatus: 'playing' });
        updateDiagnosticTest('engineOutputTest', {
          status: 'playing',
          oscillatorStarted: true,
          automation: snapshot.diagnostics.voiceAutomation,
        });
        startPersistentSignalSampling('engine-test', testVoice.generationId);
        addLifecycleEvent('output test started', '440 Hz');
        await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
        if (disposed || commandOperation !== operation || voice !== testVoice) {
          abortVoice(testVoice);
          updateDiagnostics({ outputTestStatus: 'failed' });
          return { ok: false, errorCode: 'audio-start-failed' };
        }
        await releaseVoice(testVoice);
        if (!disposed && commandOperation === operation) {
          updateDiagnostics({
            engineState: 'stopped',
            outputTestStatus: 'succeeded',
            lastCommand: 'output-test-complete',
          });
          updateDiagnosticTest('engineOutputTest', { status: 'succeeded' });
          addLifecycleEvent('output test completed');
        }
        return { ok: true };
      } catch (error) {
        updateDiagnostics({ outputTestStatus: 'failed' });
        updateDiagnosticTest('engineOutputTest', {
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown output failure.',
        });
        return publishError(toEngineError(error), 'output-test');
      }
    };

  const playDirectOutputTestFromUserGesture = () =>
    runDirectOutputTestFromUserGesture('directOutputTest', false, false);

  const playConstantGainOutputTestFromUserGesture = () =>
    runDirectOutputTestFromUserGesture('constantGainOutputTest', true, false);

  const recreateContextAndPlayOutputTestFromUserGesture = () =>
    runDirectOutputTestFromUserGesture(
      'recreatedContextOutputTest',
      true,
      true,
    );

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
            voiceGainCurrent: null,
            effectiveGain: null,
            lastCommand: 'stop',
            errorCode: null,
            errorMessage: null,
          },
        });
      }
      return;
    }
    if (snapshot.status === 'starting') {
      abortVoice(activeVoice);
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
            voiceGenerationId: null,
            oscillatorCreated: false,
            oscillatorStarted: false,
            graphConnected: false,
            voiceGainConnected: false,
            midiNote: null,
            frequencyHz: null,
            voiceGainTarget: null,
            effectiveGain: null,
            lastCommand: 'stop',
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
        masterGainCurrent: masterGain?.gain.value ?? null,
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
      const method =
        typeof masterGain.gain.setTargetAtTime === 'function'
          ? 'setTargetAtTime'
          : typeof masterGain.gain.linearRampToValueAtTime === 'function'
            ? 'linearRampToValueAtTime'
            : typeof masterGain.gain.setValueAtTime === 'function'
              ? 'setValueAtTime'
              : 'value-assignment';
      updateDiagnostics({
        masterAutomation: createAutomationRecord(
          masterGain.gain,
          mappedGain,
          currentTime,
          method,
          method === 'setTargetAtTime' ? null : method,
          context,
        ),
      });
      debugLog('volume scheduled', { masterGain: mappedGain });
    } catch (error) {
      publishError(toEngineError(error), 'volume');
    }
  };

  const markLifecycle = (name: string, state: string) => {
    if (disposed) return;
    addLifecycleEvent(name, state);
    updateDiagnostics({
      pageLifecycleState: state,
      documentVisibilityState:
        typeof document === 'undefined'
          ? 'unavailable'
          : document.visibilityState,
      lastVisibilityChange:
        name === 'visibilitychange'
          ? `${Math.round(typeof performance === 'undefined' ? Date.now() : performance.now())}:${state}`
          : snapshot.diagnostics.lastVisibilityChange,
      requiresExplicitReactivation:
        snapshot.diagnostics.requiresExplicitReactivation ||
        state === 'hidden' ||
        name === 'pagehide',
    });
    if (voice && (state === 'hidden' || name === 'pagehide')) {
      operation += 1;
      const outputTestWasActive =
        snapshot.diagnostics.outputTestStatus === 'starting' ||
        snapshot.diagnostics.outputTestStatus === 'playing';
      abortVoice(voice);
      if (outputTestWasActive)
        updateDiagnostics({ outputTestStatus: 'failed' });
      publishError(
        new DroneEngineError(
          'context-interrupted',
          'Page lifecycle interrupted reference audio.',
        ),
        name,
      );
    }
    if (diagnosticVoice && (state === 'hidden' || name === 'pagehide')) {
      operation += 1;
      cleanupDiagnosticVoice(diagnosticVoice);
      for (const key of [
        'directOutputTest',
        'constantGainOutputTest',
        'recreatedContextOutputTest',
      ] as const) {
        if (
          snapshot.diagnostics[key].status === 'starting' ||
          snapshot.diagnostics[key].status === 'playing'
        )
          updateDiagnosticTest(key, {
            status: 'failed',
            errorMessage: 'Page lifecycle interrupted the test.',
          });
      }
    }
    if (
      context &&
      (state === 'hidden' || name === 'pagehide') &&
      getContextState(context) === 'running' &&
      typeof context.suspend === 'function'
    ) {
      const ownedContext = context;
      addLifecycleEvent('context suspend requested', name);
      void ownedContext
        .suspend()
        .then(() => {
          if (!disposed && context === ownedContext)
            addLifecycleEvent(
              'context suspend resolved',
              getContextState(ownedContext),
            );
        })
        .catch(() => {
          if (!disposed && context === ownedContext)
            addLifecycleEvent('context suspend rejected');
        });
    }
  };

  const onVisibilityChange = () =>
    markLifecycle('visibilitychange', document.visibilityState);
  const onPageShow = () => markLifecycle('pageshow', 'visible');
  const onPageHide = () => markLifecycle('pagehide', 'hidden');
  const onFocus = () => markLifecycle('focus', 'focused');
  const onBlur = () => markLifecycle('blur', 'blurred');
  const attachLifecycleListeners = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined')
      return;
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
  };
  const detachLifecycleListeners = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined')
      return;
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('blur', onBlur);
  };

  const dispose = async (): Promise<void> => {
    if (disposed) return;
    disposed = true;
    detachLifecycleListeners();
    operation += 1;
    stopSignalSampling();
    cleanupDiagnosticVoice(diagnosticVoice);
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
    safeDisconnect(outputAnalyser);
    masterGain = null;
    outputAnalyser = null;
    outputAnalyserSamples = null;
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
        voiceGenerationId: null,
        oscillatorCreated: false,
        oscillatorStarted: false,
        graphConnected: false,
        voiceGainConnected: false,
        masterGainConnected: false,
        destinationConnected: false,
        midiNote: null,
        frequencyHz: null,
        voiceGainTarget: null,
        voiceGainCurrent: null,
        masterGain: null,
        masterGainCurrent: null,
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

  attachLifecycleListeners();

  return {
    activateFromUserGesture,
    play,
    playOutputTestFromUserGesture,
    playDirectOutputTestFromUserGesture,
    playConstantGainOutputTestFromUserGesture,
    recreateContextAndPlayOutputTestFromUserGesture,
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
