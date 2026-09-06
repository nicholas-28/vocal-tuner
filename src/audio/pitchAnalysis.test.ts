import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pitchAnalysisConfig, startPitchAnalysis } from './pitchAnalysis';

describe('pitch analysis graph', () => {
  const callbacks: FrameRequestCallback[] = [];
  let now = 0;
  let constructionFailure = false;

  class MockAudioContext extends EventTarget {
    static current: MockAudioContext;
    state = 'running';
    currentTime = 0;
    sampleRate = 48_000;
    destination = { channelCount: 2 };
    source = { connect: vi.fn(), disconnect: vi.fn() };
    analyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      disconnect: vi.fn(),
      getFloatTimeDomainData: vi.fn((samples: Float32Array) => {
        for (let index = 0; index < samples.length; index += 1)
          samples[index] = 0.5 * Math.sin((2 * Math.PI * 220 * index) / 48_000);
      }),
    };
    constructor() {
      super();
      MockAudioContext.current = this;
    }
    createMediaStreamSource = vi.fn(() => this.source);
    createAnalyser = vi.fn(() => {
      if (constructionFailure) throw new Error('construction failed');
      return this.analyser;
    });
    close = vi.fn(async () => {
      this.state = 'closed';
    });
    resume = vi.fn(async () => {
      this.state = 'running';
    });
  }

  function frame(timestamp: number, audioTime = timestamp / 1000) {
    now = timestamp;
    MockAudioContext.current.currentTime = audioTime;
    callbacks.at(-1)!(timestamp);
  }

  beforeEach(() => {
    callbacks.length = 0;
    now = 0;
    constructionFailure = false;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callbacks.push(callback);
        return callbacks.length;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('publishes sustained pitch only from progressing audio and releases every resource', async () => {
    const onDetection = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, onDetection, vi.fn());
    frame(100);
    frame(200);
    expect(onDetection).toHaveBeenCalledTimes(2);
    expect(onDetection.mock.calls[0][0].frequencyHz).toBeCloseTo(220, 0);
    expect(onDetection.mock.calls[1][0].timestampMs).toBeGreaterThan(
      onDetection.mock.calls[0][0].timestampMs,
    );
    expect(pitchAnalysisConfig.fftSize).toBe(4096);
    expect(
      MockAudioContext.current.source.connect,
    ).toHaveBeenCalledExactlyOnceWith(MockAudioContext.current.analyser);
    await handle.stop();
    frame(300);
    await handle.stop();
    expect(onDetection).toHaveBeenCalledTimes(2);
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(MockAudioContext.current.source.disconnect).toHaveBeenCalledOnce();
    expect(MockAudioContext.current.analyser.disconnect).toHaveBeenCalledOnce();
    expect(MockAudioContext.current.close).toHaveBeenCalledOnce();
  });

  it('delivers every analysis before the presentation throttle and skips frozen render samples', async () => {
    const presentation = vi.fn();
    const observation = vi.fn();
    const handle = startPitchAnalysis(
      {} as MediaStream,
      presentation,
      vi.fn(),
      observation,
    );
    for (const timestamp of [100, 140, 180, 220]) frame(timestamp);
    expect(observation.mock.calls.map(([value]) => value.timestampMs)).toEqual([
      100, 140, 180, 220,
    ]);
    expect(presentation.mock.calls.map(([value]) => value.timestampMs)).toEqual(
      [100, 180],
    );
    frame(260, 0.22);
    expect(observation).toHaveBeenCalledTimes(4);
    expect(
      MockAudioContext.current.analyser.getFloatTimeDomainData,
    ).toHaveBeenCalledTimes(4);
    await handle.stop();
    frame(300);
    expect(observation).toHaveBeenCalledTimes(4);
  });

  it('does not publish presentation after a realtime consumer synchronously stops analysis', async () => {
    const presentation = vi.fn();
    const handle = startPitchAnalysis(
      {} as MediaStream,
      presentation,
      vi.fn(),
      () => void handle.stop(),
    );
    frame(100);
    expect(presentation).not.toHaveBeenCalled();
  });

  it.each(['suspended', 'interrupted', 'closed', 'unknown'])(
    'invalidates %s without republishing frozen samples',
    async (state) => {
      const publish = vi.fn();
      const fail = vi.fn();
      const handle = startPitchAnalysis({} as MediaStream, publish, fail);
      frame(100);
      MockAudioContext.current.state = state;
      MockAudioContext.current.dispatchEvent(new Event('statechange'));
      frame(200, 0.1);
      frame(400, 0.1);
      expect(publish).toHaveBeenCalledOnce();
      expect(fail).toHaveBeenCalledOnce();
      expect(MockAudioContext.current.source.disconnect).toHaveBeenCalledOnce();
      await handle.stop();
    },
  );

  it('skips a repeated render clock, tolerates jitter, then fails a persistent stall', async () => {
    const publish = vi.fn();
    const fail = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, publish, fail);
    frame(100);
    frame(170, 0.1);
    expect(publish).toHaveBeenCalledOnce();
    expect(fail).not.toHaveBeenCalled();
    frame(210, 0.2);
    expect(publish).toHaveBeenCalledTimes(2);
    frame(300, 0.2);
    frame(500, 0.2);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(fail).toHaveBeenCalledOnce();
    await handle.stop();
  });

  it('preserves ordinary silence as a fresh detector observation', async () => {
    const publish = vi.fn();
    const fail = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, publish, fail);
    MockAudioContext.current.analyser.getFloatTimeDomainData.mockImplementation(
      (samples) => samples.fill(0),
    );
    frame(100);
    expect(publish.mock.calls[0][0]).toMatchObject({
      frequencyHz: null,
      rejectionReason: 'silence',
    });
    expect(fail).not.toHaveBeenCalled();
    await handle.stop();
  });

  it('disposes a partial graph when analyser construction throws', () => {
    constructionFailure = true;
    expect(() =>
      startPitchAnalysis({} as MediaStream, vi.fn(), vi.fn()),
    ).toThrow('construction failed');
    expect(MockAudioContext.current.source.disconnect).toHaveBeenCalledOnce();
    expect(MockAudioContext.current.close).toHaveBeenCalledOnce();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('disposes the graph after an analyser exception', async () => {
    const fail = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, vi.fn(), fail);
    MockAudioContext.current.analyser.getFloatTimeDomainData.mockImplementation(
      () => {
        throw new Error('read failed');
      },
    );
    frame(100);
    expect(fail).toHaveBeenCalledOnce();
    expect(MockAudioContext.current.close).toHaveBeenCalledOnce();
    await handle.stop();
  });
  it('waits for initial resume and clock progress before the first observation', async () => {
    class InitiallySuspended extends MockAudioContext {
      state = 'suspended';
      resume = vi.fn(() => new Promise<void>(() => undefined));
    }
    vi.stubGlobal('AudioContext', InitiallySuspended);
    const publish = vi.fn();
    const fail = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, publish, fail);
    frame(100, 0);
    expect(publish).not.toHaveBeenCalled();
    MockAudioContext.current.state = 'running';
    MockAudioContext.current.dispatchEvent(new Event('statechange'));
    frame(200, 0);
    expect(publish).not.toHaveBeenCalled();
    frame(300, 0.1);
    expect(publish).toHaveBeenCalledOnce();
    expect(fail).not.toHaveBeenCalled();
    await handle.stop();
  });

  it.each(['suspended', 'running'])(
    'bounds startup with a non-progressing %s context',
    async (state) => {
      class Stalled extends MockAudioContext {
        state = state;
        resume = vi.fn(() => new Promise<void>(() => undefined));
      }
      vi.stubGlobal('AudioContext', Stalled);
      const publish = vi.fn();
      const fail = vi.fn();
      const handle = startPitchAnalysis({} as MediaStream, publish, fail);
      frame(500, 0);
      expect(fail).not.toHaveBeenCalled();
      frame(1000, 0);
      expect(fail).toHaveBeenCalledOnce();
      expect(publish).not.toHaveBeenCalled();
      expect(MockAudioContext.current.close).toHaveBeenCalledOnce();
      await handle.stop();
    },
  );

  it('ignores late resume rejection after Stop', async () => {
    let reject!: (error: Error) => void;
    class Suspended extends MockAudioContext {
      state = 'suspended';
      resume = vi.fn(
        () =>
          new Promise<void>((_resolve, no) => {
            reject = no;
          }),
      );
    }
    vi.stubGlobal('AudioContext', Suspended);
    const fail = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, vi.fn(), fail);
    await handle.stop();
    reject(new Error('late resume'));
    await Promise.resolve();
    expect(fail).not.toHaveBeenCalled();
    expect(MockAudioContext.current.close).toHaveBeenCalledOnce();
  });

  it('allows scheduling gaps when the rendering clock still progresses', async () => {
    const fail = vi.fn();
    const publish = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, publish, fail);
    frame(100);
    frame(3000);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(fail).not.toHaveBeenCalled();
    await handle.stop();
  });

  it('continues cleanup if source disconnect throws', async () => {
    const handle = startPitchAnalysis({} as MediaStream, vi.fn(), vi.fn());
    MockAudioContext.current.source.disconnect.mockImplementation(() => {
      throw new Error('disconnect');
    });
    await handle.stop();
    expect(MockAudioContext.current.analyser.disconnect).toHaveBeenCalledOnce();
    expect(MockAudioContext.current.close).toHaveBeenCalledOnce();
  });
});
