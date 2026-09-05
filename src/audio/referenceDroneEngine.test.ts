import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReferenceDroneEngine } from './referenceDroneEngine';

class MockAudioParam {
  value = 0;
  cancelAndHoldAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  linearRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  setTargetAtTime = vi.fn((value: number) => {
    this.value = value;
  });
}

class MockNode {
  disconnect = vi.fn();

  constructor(
    readonly context: MockAudioContext,
    readonly name: string,
  ) {}

  connect = vi.fn((target: MockNode) => {
    this.context.events.push(`${this.name}->${target.name}`);
    if (this.context.failConnectionFrom === this.name) {
      throw new Error(`cannot connect ${this.name}`);
    }
    return target;
  });
}

class MockGain extends MockNode {
  gain = new MockAudioParam();
}

class MockAnalyser extends MockNode {
  fftSize = 1024;
  smoothingTimeConstant = 0;
  buffers: Float32Array[] = [];

  getFloatTimeDomainData(buffer: Float32Array) {
    this.buffers.push(buffer);
    for (let index = 0; index < buffer.length; index += 1)
      buffer[index] =
        this.context.waveform[index % this.context.waveform.length] ?? 0;
  }
}

class MockOscillator extends MockNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();
  onended: (() => void) | null = null;
  start = vi.fn(() => {
    this.context.events.push('oscillator:start');
    if (this.context.failStart) throw new Error('oscillator blocked');
  });
  stop = vi.fn();
  setPeriodicWave = vi.fn(() => {
    this.type = 'custom';
  });

  finish() {
    this.onended?.();
  }
}

type ResumeMode = 'running' | 'stays-suspended' | 'reject' | 'deferred';

class MockAudioContext {
  state: AudioContextState | 'interrupted';
  currentTime = 10;
  destination = new MockNode(this, 'destination');
  gains: MockGain[] = [];
  oscillators: MockOscillator[] = [];
  analysers: MockAnalyser[] = [];
  waveform = new Float32Array([0.1, -0.1]);
  events: string[] = [];
  failConnectionFrom: string | null = null;
  failStart = false;
  failCreateGainAt: number | null = null;
  resumeMode: ResumeMode = 'running';
  resolveDeferredResume = () => undefined;
  private stateListeners = new Set<EventListener>();

  resume = vi.fn(async () => {
    this.events.push('context:resume');
    if (this.resumeMode === 'reject') throw new Error('resume rejected');
    if (this.resumeMode === 'deferred') {
      await new Promise<void>((resolve) => {
        this.resolveDeferredResume = () => {
          this.setState('running');
          setTimeout(() => {
            this.currentTime += 0.05;
          }, 10);
          resolve();
        };
      });
      return;
    }
    if (this.resumeMode === 'running') {
      this.setState('running');
      setTimeout(() => {
        this.currentTime += 0.05;
      }, 10);
    }
  });

  close = vi.fn(async () => {
    this.setState('closed');
  });

  suspend = vi.fn(async () => {
    this.setState('suspended');
  });

  createGain = vi.fn(() => {
    if (this.failCreateGainAt === this.gains.length) {
      throw new Error('gain creation failed');
    }
    const gain = new MockGain(this, `gain-${this.gains.length}`);
    this.gains.push(gain);
    return gain as unknown as GainNode;
  });

  createOscillator = vi.fn(() => {
    const oscillator = new MockOscillator(
      this,
      `oscillator-${this.oscillators.length}`,
    );
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  });

  createAnalyser = vi.fn(() => {
    const analyser = new MockAnalyser(
      this,
      `analyser-${this.analysers.length}`,
    );
    this.analysers.push(analyser);
    return analyser as unknown as AnalyserNode;
  });

  createPeriodicWave = vi.fn(() => ({}) as PeriodicWave);

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'statechange' && typeof listener === 'function') {
      this.stateListeners.add(listener);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    if (type === 'statechange' && typeof listener === 'function') {
      this.stateListeners.delete(listener);
    }
  }

  setState(state: AudioContextState | 'interrupted') {
    this.state = state;
    for (const listener of this.stateListeners)
      listener(new Event('statechange'));
  }

  get listenerCount() {
    return this.stateListeners.size;
  }

  constructor(state: AudioContextState | 'interrupted' = 'running') {
    this.state = state;
  }
}

const asAudioContext = (context: MockAudioContext) =>
  context as unknown as AudioContext;
const A4 = { midiNote: 69, frequencyHz: 440 };
const G4 = { midiNote: 67, frequencyHz: 391.99543598174927 };
const F_SHARP_4 = { midiNote: 66, frequencyHz: 369.9944227116344 };
const C4 = { midiNote: 60, frequencyHz: 261.6255653005986 };

describe('reference drone engine', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'audioSession');
    Reflect.deleteProperty(navigator, 'mediaDevices');
  });

  it('confirms a running, fully connected graph before reporting playing', async () => {
    const context = new MockAudioContext();
    const factory = vi.fn(() => asAudioContext(context));
    const engine = createReferenceDroneEngine({ contextFactory: factory });

    expect(factory).not.toHaveBeenCalled();
    expect((await engine.play(A4)).ok).toBe(true);
    expect(context.events).toEqual([
      'gain-0->destination',
      'oscillator-0->gain-1',
      'gain-1->gain-0',
      'oscillator:start',
    ]);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'playing',
      diagnostics: {
        contextState: 'running',
        voiceState: 'started',
        graphConnected: true,
        destinationConnected: true,
        oscillatorStarted: true,
        masterGain: 0.08,
        effectiveGain: 0.08,
        voiceGainTarget: 1,
        backend: 'web-audio',
        timbreProfile: 'light-harmonic-support',
      },
    });
    expect(engine.getSnapshot().diagnostics.predictedPeak).toBeCloseTo(0.08);
    expect(context.oscillators[0]?.setPeriodicWave).toHaveBeenCalledOnce();
    expect(engine.getSnapshot().diagnostics.partials).toHaveLength(3);
    expect(context.gains[1]?.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
    expect(context.gains[1]?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      1,
      10.05,
    );
  });

  it('leaves AudioSession untouched and never requests microphone access during normal activation', async () => {
    const events: string[] = [];
    let sessionType = 'auto';
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        get type() {
          return sessionType;
        },
        set type(value: string) {
          sessionType = value;
          events.push(`session:${value}`);
        },
        state: 'inactive',
      },
    });
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => {
        events.push('context:create');
        return asAudioContext(context);
      },
    });

    expect((await engine.play(A4)).ok).toBe(true);
    expect(events).toEqual(['context:create']);
    expect(sessionType).toBe('auto');
    expect(engine.getSnapshot().diagnostics.audioSession).toMatchObject({
      preparationResult: 'not-requested',
      priorType: null,
      type: 'auto',
    });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('reuses a retained healthy output context after Stop', async () => {
    const context = new MockAudioContext();
    const factory = vi.fn(() => asAudioContext(context));
    const engine = createReferenceDroneEngine({ contextFactory: factory });

    await engine.play(A4);
    const stopping = engine.stop();
    context.oscillators[0]?.finish();
    await stopping;
    await engine.play(G4);

    expect(factory).toHaveBeenCalledOnce();
    expect(context.close).not.toHaveBeenCalled();
    expect(engine.getSnapshot().diagnostics.contextGenerationId).toBe(1);
  });

  it('inserts one analyser on the real persistent path and classifies active samples', async () => {
    vi.useFakeTimers();
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
      diagnosticsEnabled: true,
    });
    await engine.play(A4);
    expect(context.events).toEqual([
      'gain-0->analyser-0',
      'analyser-0->destination',
      'oscillator-0->gain-1',
      'gain-1->gain-0',
      'oscillator:start',
    ]);
    await vi.advanceTimersByTimeAsync(375);
    expect(engine.getSnapshot().diagnostics.persistentSignal).toMatchObject({
      classification: 'digitally-active',
      analyserGenerationId: 1,
      contextGenerationId: 1,
      voiceGenerationId: 1,
      analyserConnectedToDestination: true,
    });
    expect(engine.getSnapshot().diagnostics.persistentSignal.rms).toBeCloseTo(
      0.1,
    );
    expect(engine.getSnapshot().diagnostics.persistentSignal.peak).toBeCloseTo(
      0.1,
    );
    expect(new Set(context.analysers[0]?.buffers).size).toBe(1);
    await engine.dispose();
    expect(context.analysers[0]?.disconnect).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('classifies persistent zero samples as digitally silent', async () => {
    vi.useFakeTimers();
    const context = new MockAudioContext();
    context.waveform = new Float32Array([0, 0]);
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
      diagnosticsEnabled: true,
    });
    await engine.play(A4);
    await vi.advanceTimersByTimeAsync(375);
    expect(
      engine.getSnapshot().diagnostics.persistentSignal.classification,
    ).toBe('digitally-silent');
  });

  it('runs measured direct and constant-gain paths without the persistent master', async () => {
    vi.useFakeTimers();
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
      diagnosticsEnabled: true,
    });
    const direct = engine.playDirectOutputTestFromUserGesture();
    await expect(engine.play(A4)).resolves.toEqual({
      ok: false,
      errorCode: 'audio-start-failed',
    });
    expect(context.oscillators).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(direct).resolves.toEqual({ ok: true });
    expect(engine.getSnapshot().diagnostics.directOutputTest).toMatchObject({
      status: 'succeeded',
      oscillatorStarted: true,
      automation: { method: 'linearRampToValueAtTime' },
      signal: { classification: 'digitally-active' },
    });
    expect(context.events).toContain('gain-1->analyser-1');
    expect(context.events).toContain('analyser-1->destination');

    const constant = engine.playConstantGainOutputTestFromUserGesture();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(constant).resolves.toEqual({ ok: true });
    expect(
      engine.getSnapshot().diagnostics.constantGainOutputTest,
    ).toMatchObject({
      status: 'succeeded',
      automation: {
        method: 'setValueAtTime',
        scheduledAfterRunning: true,
      },
      signal: { classification: 'digitally-active' },
    });
  });

  it('recreates the context and starts a measured direct test under the same command', async () => {
    vi.useFakeTimers();
    const first = new MockAudioContext();
    const second = new MockAudioContext();
    const factory = vi
      .fn()
      .mockReturnValueOnce(asAudioContext(first))
      .mockReturnValueOnce(asAudioContext(second));
    const engine = createReferenceDroneEngine({
      contextFactory: factory,
      diagnosticsEnabled: true,
    });
    await engine.play(A4);
    const stopping = engine.stop();
    first.oscillators[0]?.finish();
    await stopping;
    const recreated = engine.recreateContextAndPlayOutputTestFromUserGesture();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(recreated).resolves.toEqual({ ok: true });
    expect(first.close).toHaveBeenCalledOnce();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(
      engine.getSnapshot().diagnostics.recreatedContextOutputTest,
    ).toMatchObject({
      status: 'succeeded',
      signal: { contextGenerationId: 2, classification: 'digitally-active' },
    });
    expect(engine.getSnapshot().diagnostics).toMatchObject({
      previousContextGenerationId: 1,
      contextGenerationId: 2,
      contextCloseResult: 'resolved',
    });
  });

  it('clears a direct diagnostic lock when page lifecycle interrupts it', async () => {
    vi.useFakeTimers();
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
      diagnosticsEnabled: true,
    });

    const runningTest = engine.playDirectOutputTestFromUserGesture();
    window.dispatchEvent(new Event('pagehide'));

    expect(engine.getSnapshot().diagnostics.directOutputTest.status).toBe(
      'failed',
    );
    await vi.advanceTimersByTimeAsync(1000);
    await expect(runningTest).resolves.toEqual({
      ok: false,
      errorCode: 'audio-start-failed',
    });
  });

  it('stays starting until a deferred resume makes the context running', async () => {
    const context = new MockAudioContext('suspended');
    context.resumeMode = 'deferred';
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    const starting = engine.play(A4);
    expect(context.events).toEqual([
      'gain-0->destination',
      'context:resume',
      'oscillator-0->gain-1',
      'gain-1->gain-0',
      'oscillator:start',
    ]);
    await Promise.resolve();
    expect(engine.getSnapshot().status).toBe('starting');
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.start).toHaveBeenCalledOnce();
    expect(context.gains[1]?.gain.value).toBe(0);
    expect(engine.getSnapshot().diagnostics).toMatchObject({
      voiceGainTarget: 0,
      effectiveGain: 0,
    });
    context.resolveDeferredResume();
    await expect(starting).resolves.toEqual({ ok: true });
    expect(engine.getSnapshot().status).toBe('playing');
  });

  it('runs one explicit output test through the protected graph and cleans it', async () => {
    vi.useFakeTimers();
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    const test = engine.playOutputTestFromUserGesture();
    await Promise.resolve();
    expect(engine.getSnapshot()).toMatchObject({
      activeMidi: null,
      diagnostics: { outputTestStatus: 'playing', frequencyHz: 440 },
    });
    expect(context.gains[0]?.gain.value).toBe(0.08);
    await vi.advanceTimersByTimeAsync(1000);
    context.oscillators[0]?.finish();
    await expect(test).resolves.toEqual({ ok: true });
    expect(engine.getSnapshot()).toMatchObject({
      activeMidi: null,
      diagnostics: { outputTestStatus: 'succeeded' },
    });
    expect(context.oscillators[0]?.disconnect).toHaveBeenCalled();
  });

  it('keeps a failed output test independent from reference selection', async () => {
    const context = new MockAudioContext('suspended');
    context.resumeMode = 'stays-suspended';
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await expect(engine.playOutputTestFromUserGesture()).resolves.toEqual({
      ok: false,
      errorCode: 'context-not-running',
    });
    expect(engine.getSnapshot()).toMatchObject({
      activeMidi: null,
      frequencyHz: null,
      status: 'error',
      diagnostics: { outputTestStatus: 'failed' },
    });
    expect(context.oscillators[0]?.disconnect).toHaveBeenCalled();
  });

  it('does not report playing when resume resolves but remains suspended', async () => {
    const context = new MockAudioContext('suspended');
    const replacement = new MockAudioContext('running');
    context.resumeMode = 'stays-suspended';
    const engine = createReferenceDroneEngine({
      contextFactory: vi
        .fn()
        .mockReturnValueOnce(asAudioContext(context))
        .mockReturnValueOnce(asAudioContext(replacement)),
    });
    await expect(engine.play(A4)).resolves.toEqual({
      ok: false,
      errorCode: 'context-not-running',
    });
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.disconnect).toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'context-not-running',
      diagnostics: { contextState: 'suspended', oscillatorStarted: false },
    });

    await expect(engine.play(A4)).resolves.toEqual({ ok: true });
    expect(context.close).toHaveBeenCalledOnce();
    expect(replacement.oscillators).toHaveLength(1);
  });

  it('treats interrupted and rejected resume states as recoverable errors', async () => {
    const interrupted = new MockAudioContext('interrupted');
    interrupted.resumeMode = 'stays-suspended';
    const interruptedEngine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(interrupted),
    });
    await interruptedEngine.play(A4);
    expect(interruptedEngine.getSnapshot().errorCode).toBe(
      'context-interrupted',
    );

    const rejected = new MockAudioContext('suspended');
    rejected.resumeMode = 'reject';
    const rejectedEngine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(rejected),
    });
    await rejectedEngine.play(A4);
    expect(rejectedEngine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'audio-start-failed',
    });
  });

  it('reports unknown future context states without mislabeling them', async () => {
    const context = new MockAudioContext();
    context.state = 'future-state' as AudioContextState;
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'context-not-running',
      diagnostics: { contextState: 'unknown' },
    });
  });

  it('rejects a closed constructed context and retries with a fresh one', async () => {
    const closed = new MockAudioContext('closed');
    const running = new MockAudioContext('running');
    const factory = vi
      .fn()
      .mockReturnValueOnce(asAudioContext(closed))
      .mockReturnValueOnce(asAudioContext(running));
    const engine = createReferenceDroneEngine({ contextFactory: factory });
    await engine.play(A4);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'context-closed',
    });
    expect(closed.createGain).not.toHaveBeenCalled();
    await expect(engine.play(A4)).resolves.toEqual({ ok: true });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('cleans partial graphs when destination, voice connection, or start fails', async () => {
    const destinationFailure = new MockAudioContext();
    destinationFailure.failConnectionFrom = 'gain-0';
    const destinationEngine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(destinationFailure),
    });
    await destinationEngine.play(A4);
    expect(destinationEngine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'graph-connection-failed',
    });
    expect(destinationFailure.gains[0]?.disconnect).toHaveBeenCalled();
    expect(destinationFailure.close).toHaveBeenCalledOnce();

    const voiceFailure = new MockAudioContext();
    voiceFailure.failConnectionFrom = 'gain-1';
    const voiceEngine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(voiceFailure),
    });
    await voiceEngine.play(A4);
    expect(voiceEngine.getSnapshot().errorCode).toBe('graph-connection-failed');
    expect(voiceFailure.oscillators[0]?.disconnect).toHaveBeenCalled();
    expect(voiceFailure.gains[1]?.disconnect).toHaveBeenCalled();

    const startFailure = new MockAudioContext();
    startFailure.failStart = true;
    const startEngine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(startFailure),
    });
    await startEngine.play(A4);
    expect(startEngine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'oscillator-start-failed',
    });
    expect(startFailure.oscillators[0]?.disconnect).toHaveBeenCalled();
  });

  it('uses one oscillator for smooth confirmed note transitions', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    await engine.play(G4);
    expect(context.oscillators).toHaveLength(1);
    expect(
      context.oscillators[0]?.frequency.linearRampToValueAtTime,
    ).toHaveBeenCalledWith(G4.frequencyHz, 10.07);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'playing',
      activeMidi: 67,
      diagnostics: { frequencyHz: G4.frequencyHz },
    });
  });

  it('updates every reported partial on a low-note transition and preserves headroom', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    await engine.play({ midiNote: 47, frequencyHz: 123.47082531403103 });
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.setPeriodicWave).toHaveBeenCalledTimes(2);
    expect(engine.getSnapshot().diagnostics).toMatchObject({
      timbreProfile: 'low-harmonic-support',
      predictedPeak: 0.08,
    });
    expect(
      engine
        .getSnapshot()
        .diagnostics.partials.map((partial) => partial.frequencyHz),
    ).toEqual([
      123.47082531403103, 246.94165062806206, 370.4124759420931,
      493.8833012561241,
    ]);
    engine.setVolume(1);
    expect(engine.getSnapshot().diagnostics.predictedPeak).toBeCloseTo(0.32);
  });

  it('falls back to an exact sine when PeriodicWave construction fails', async () => {
    const context = new MockAudioContext();
    context.createPeriodicWave.mockImplementation(() => {
      throw new Error('unsupported');
    });
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    expect(context.oscillators[0]?.type).toBe('sine');
    expect(engine.getSnapshot().diagnostics).toMatchObject({
      timbreProfile: 'pure-sine-fallback',
      predictedPeak: 0.08,
    });
    expect(engine.getSnapshot().diagnostics.partials).toHaveLength(1);
    expect(engine.getSnapshot().diagnostics.partials[0]?.frequencyHz).toBe(440);
  });

  it('maps 0%, default, and 100% volume to the active master only', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    expect(engine.getSnapshot().diagnostics.effectiveGain).toBe(0.08);
    engine.setVolume(1);
    expect(engine.getSnapshot().diagnostics).toMatchObject({
      masterGain: 0.32,
      effectiveGain: 0.32,
    });
    expect(context.gains[0]?.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.32,
      10,
      0.03,
    );
    engine.setVolume(0);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'playing',
      diagnostics: { masterGain: 0, effectiveGain: 0 },
    });
    expect(context.gains[1]?.gain.setTargetAtTime).not.toHaveBeenCalled();
  });

  it('falls back when optional automation methods are unavailable', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    const master = context.gains[0]?.gain;
    if (!master) throw new Error('missing master');
    Object.assign(master, {
      cancelAndHoldAtTime: undefined,
      setTargetAtTime: undefined,
    });
    engine.setVolume(0.5);
    expect(master.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(master.linearRampToValueAtTime).toHaveBeenCalledWith(0.16, 10.03);
  });

  it('invalidates a suspended start when Stop wins the race', async () => {
    const context = new MockAudioContext('suspended');
    context.resumeMode = 'deferred';
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    const starting = engine.play(A4);
    const stopping = engine.stop();
    context.resolveDeferredResume();
    await Promise.all([starting, stopping]);
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.stop).toHaveBeenCalled();
    expect(context.oscillators[0]?.disconnect).toHaveBeenCalled();
    expect(engine.getSnapshot().status).toBe('stopped');
  });

  it('serializes rapid activations so the newest requested note wins', async () => {
    const context = new MockAudioContext('suspended');
    context.resumeMode = 'deferred';
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });

    const first = engine.play(C4);
    const second = engine.play(A4);
    const latest = engine.play(F_SHARP_4);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'changing',
      activeMidi: null,
      pendingMidi: F_SHARP_4.midiNote,
    });

    context.resolveDeferredResume();
    const results = await Promise.all([first, second, latest]);

    expect(results.at(-1)).toEqual({ ok: true });
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.stop).not.toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'playing',
      activeMidi: F_SHARP_4.midiNote,
      pendingMidi: null,
      errorCode: null,
    });
  });

  it.each([
    [C4, A4],
    [C4, A4, F_SHARP_4],
  ])(
    'attacks the winning prepared voice once during rapid pending activation %#',
    async (...notes) => {
      vi.useFakeTimers();
      const context = new MockAudioContext('suspended');
      context.resumeMode = 'deferred';
      const engine = createReferenceDroneEngine({
        contextFactory: () => asAudioContext(context),
      });
      const playingAttacks: number[] = [];
      engine.subscribe((next) => {
        if (next.status === 'playing')
          playingAttacks.push(
            context.gains[1]?.gain.linearRampToValueAtTime.mock.calls.filter(
              ([value]) => value === 1,
            ).length ?? 0,
          );
      });
      const commands = notes.map((note) => engine.play(note));
      expect(context.oscillators).toHaveLength(1);
      expect(context.gains[1]?.gain.value).toBe(0);
      expect(playingAttacks).toEqual([]);
      context.resolveDeferredResume();
      await vi.advanceTimersByTimeAsync(60);
      const results = await Promise.all(commands);
      expect(results.at(-1)).toEqual({ ok: true });
      expect(engine.getSnapshot()).toMatchObject({
        status: 'playing',
        activeMidi: notes.at(-1)!.midiNote,
        pendingMidi: null,
      });
      expect(
        context.gains[1]?.gain.linearRampToValueAtTime,
      ).toHaveBeenCalledExactlyOnceWith(1, context.currentTime + 0.05);
      expect(context.gains[1]?.gain.value).toBe(1);
      expect(playingAttacks.length).toBeGreaterThan(0);
      expect(playingAttacks.every((count) => count === 1)).toBe(true);
      expect(context.oscillators).toHaveLength(1);
      expect(context.oscillators[0]?.start).toHaveBeenCalledOnce();
      await engine.play(G4);
      expect(
        context.gains[1]?.gain.linearRampToValueAtTime,
      ).toHaveBeenCalledOnce();
      await engine.dispose();
    },
  );

  it.each(['interrupted', 'suspended', 'closed'] as const)(
    'settles Stop on %s during release without waiting for onended',
    async (state) => {
      const context = new MockAudioContext();
      const replacement = new MockAudioContext();
      const engine = createReferenceDroneEngine({
        contextFactory: vi
          .fn()
          .mockReturnValueOnce(asAudioContext(context))
          .mockReturnValueOnce(asAudioContext(replacement)),
      });
      await engine.play(A4);
      const oscillator = context.oscillators[0]!;
      let settled = false;
      const stopping = engine.stop().then(() => {
        settled = true;
      });
      const lateEnded = oscillator.onended!;
      expect(engine.getSnapshot().status).toBe('stopping');
      context.setState(state);
      // Flush promise settlement without progressing either audio time or timers.
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
      expect(settled).toBe(true);
      await stopping;
      expect(engine.getSnapshot()).toMatchObject({
        status: 'stopped',
        activeMidi: null,
        pendingMidi: null,
        diagnostics: {
          oscillatorStarted: false,
          graphConnected: false,
          voiceGenerationId: null,
        },
      });
      expect(oscillator.disconnect).toHaveBeenCalledOnce();
      expect(context.gains[1]?.disconnect).toHaveBeenCalledOnce();
      expect(oscillator.onended).toBeNull();
      await engine.play(G4);
      expect(engine.getSnapshot()).toMatchObject({
        status: 'playing',
        activeMidi: G4.midiNote,
      });
      const restarted = engine.getSnapshot();
      lateEnded();
      context.setState('running');
      expect(engine.getSnapshot()).toEqual(restarted);
      expect(replacement.oscillators[0]?.stop).not.toHaveBeenCalled();
      const finalStop = engine.stop();
      replacement.oscillators[0]?.finish();
      await finalStop;
      await engine.dispose();
    },
  );

  it('settles Stop for a shared prepared voice before resume completes', async () => {
    const context = new MockAudioContext('suspended');
    context.resumeMode = 'deferred';
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    const first = engine.play(C4);
    const second = engine.play(A4);
    let settled = false;
    const stopping = engine.stop().then(() => {
      settled = true;
    });
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
    expect(settled).toBe(true);
    expect(engine.getSnapshot()).toMatchObject({
      status: 'stopped',
      activeMidi: null,
      pendingMidi: null,
    });
    expect(context.oscillators[0]?.disconnect).toHaveBeenCalledOnce();
    expect(
      context.gains[1]?.gain.linearRampToValueAtTime,
    ).not.toHaveBeenCalled();
    context.resolveDeferredResume();
    await Promise.all([first, second, stopping]);
    expect(engine.getSnapshot().status).toBe('stopped');
    await engine.dispose();
  });

  it('cannot publish an interrupted Stop completion over a newer activation', async () => {
    const context = new MockAudioContext();
    const replacement = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: vi
        .fn()
        .mockReturnValueOnce(asAudioContext(context))
        .mockReturnValueOnce(asAudioContext(replacement)),
    });
    await engine.play(C4);
    const stopping = engine.stop();
    const lateEnded = context.oscillators[0]!.onended!;
    context.setState('interrupted');
    const starting = engine.play(A4);
    await Promise.all([stopping, starting]);
    lateEnded();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'playing',
      activeMidi: A4.midiNote,
      pendingMidi: null,
    });
    expect(replacement.oscillators).toHaveLength(1);
    expect(replacement.oscillators[0]?.stop).not.toHaveBeenCalled();
    await engine.dispose();
  });
  it('turns an unexpected state loss into an error and removes stale listeners', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    expect(context.listenerCount).toBe(1);
    context.setState('interrupted');
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'context-interrupted',
      diagnostics: { contextState: 'interrupted', oscillatorStarted: false },
    });
    expect(context.oscillators[0]?.disconnect).toHaveBeenCalled();
    await engine.dispose();
    expect(context.listenerCount).toBe(0);
    const disposedSnapshot = engine.getSnapshot();
    context.setState('running');
    expect(engine.getSnapshot()).toEqual(disposedSnapshot);
  });

  it('anchors a sustained or partial-attack release at the current gain and reaches zero before termination', async () => {
    for (const heldGain of [1, 0.4]) {
      const context = new MockAudioContext();
      const engine = createReferenceDroneEngine({
        contextFactory: () => asAudioContext(context),
      });
      await engine.play(A4);
      context.currentTime = 12;
      const gain = context.gains[1]!.gain;
      gain.value = heldGain;
      const stopping = engine.stop();
      expect(gain.cancelAndHoldAtTime).toHaveBeenCalledWith(12);
      // A ramp must start at Stop, not interpolate from the old attack endpoint.
      expect(gain.setValueAtTime).toHaveBeenLastCalledWith(heldGain, 12);
      expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 12.12);
      const stopAt = context.oscillators[0]!.stop.mock.calls[0]![0] as number;
      expect(stopAt).toBeGreaterThan(12.12);
      expect(stopAt - 12.12).toBeLessThanOrEqual(0.01);
      expect(gain.setTargetAtTime).not.toHaveBeenCalled();
      context.oscillators[0]!.finish();
      await stopping;
      await engine.dispose();
    }
  });

  it('fades Stop, retains the context, and disconnects ended voice nodes', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    const oscillator = context.oscillators[0];
    const stopping = engine.stop();
    expect(oscillator?.stop).toHaveBeenCalledWith(10.12 + 128 / 48_000);
    oscillator?.finish();
    await stopping;
    expect(engine.getSnapshot().status).toBe('stopped');
    expect(context.close).not.toHaveBeenCalled();
    await engine.play(G4);
    expect(context.oscillators).toHaveLength(2);
  });

  it('disposes once, closes the context, and ignores late commands', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
    });
    await engine.play(A4);
    await engine.dispose();
    await engine.dispose();
    await engine.play(G4);
    expect(context.oscillators[0]?.stop).toHaveBeenCalledWith(10);
    expect(context.gains[0]?.disconnect).toHaveBeenCalled();
    expect(context.close).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(1);
    expect(engine.getSnapshot().diagnostics.engineState).toBe('disposed');
  });

  it('rejects invalid notes and unavailable construction without resources', async () => {
    const factory = vi.fn();
    const engine = createReferenceDroneEngine({
      contextFactory: factory as () => AudioContext,
    });
    await engine.play({ midiNote: 60.5, frequencyHz: Number.NaN });
    expect(factory).not.toHaveBeenCalled();
    expect(engine.getSnapshot().errorCode).toBe('invalid-note');

    const unavailable = createReferenceDroneEngine({
      contextFactory: () => {
        throw new DOMException('missing', 'NotSupportedError');
      },
    });
    await unavailable.play(A4);
    expect(unavailable.getSnapshot()).toMatchObject({
      status: 'error',
      errorCode: 'unavailable',
    });
  });

  it('reports constructor identity and keeps the lifecycle log bounded', async () => {
    const context = new MockAudioContext();
    const engine = createReferenceDroneEngine({
      contextFactory: () => asAudioContext(context),
      contextConstructorName: 'webkitAudioContext',
    });
    await engine.play(A4);
    for (let index = 0; index < 45; index += 1) context.setState('running');
    const diagnostics = engine.getSnapshot().diagnostics;
    expect(diagnostics.constructorName).toBe('webkitAudioContext');
    expect(diagnostics.contextGenerationId).toBe(1);
    expect(diagnostics.voiceGenerationId).toBe(1);
    expect(diagnostics.lifecycleLog).toHaveLength(40);
    expect(diagnostics.lifecycleLog[0]?.sequence).toBeGreaterThan(1);
  });

  it('does not auto-play after visibility loss and creates fresh output on the next gesture', async () => {
    let visibility: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility,
    );
    const first = new MockAudioContext();
    const second = new MockAudioContext();
    const third = new MockAudioContext();
    const contexts = [first, second, third];
    const factory = vi.fn(() => asAudioContext(contexts.shift()!));
    const engine = createReferenceDroneEngine({ contextFactory: factory });
    await engine.play(A4);

    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'error',
      diagnostics: { requiresExplicitReactivation: true },
    });
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(factory).toHaveBeenCalledOnce();
    expect(engine.getSnapshot().status).toBe('error');

    await expect(engine.activateFromUserGesture(A4)).resolves.toEqual({
      ok: true,
    });
    expect(factory).toHaveBeenCalledTimes(2);
    expect(first.close).toHaveBeenCalledOnce();
    expect(first.suspend).toHaveBeenCalledOnce();
    expect(first.resume).not.toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({
      status: 'playing',
      diagnostics: {
        contextGenerationId: 2,
        previousContextGenerationId: 1,
        requiresExplicitReactivation: false,
      },
    });
    const replacementSnapshot = engine.getSnapshot();
    first.setState('running');
    expect(engine.getSnapshot()).toEqual(replacementSnapshot);
    expect(first.listenerCount).toBe(0);

    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(factory).toHaveBeenCalledTimes(2);
    await expect(engine.activateFromUserGesture(A4)).resolves.toEqual({
      ok: true,
    });
    expect(factory).toHaveBeenCalledTimes(3);
    expect(second.close).toHaveBeenCalledOnce();
    expect(second.listenerCount).toBe(0);
    expect(third.listenerCount).toBe(1);
  });
});
