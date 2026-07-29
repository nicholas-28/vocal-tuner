import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pitchAnalysisConfig, startPitchAnalysis } from './pitchAnalysis';

describe('pitch analysis graph', () => {
  const disconnectSource = vi.fn();
  const disconnectAnalyser = vi.fn();
  const close = vi.fn().mockResolvedValue(undefined);
  const callbacks: FrameRequestCallback[] = [];

  class MockAudioContext {
    state = 'running' as AudioContextState;
    sampleRate = 48_000;
    destination = { channelCount: 2 };
    createMediaStreamSource = vi.fn(() => ({
      connect: vi.fn(),
      disconnect: disconnectSource,
    }));
    createAnalyser = vi.fn(() => ({
      fftSize: 0,
      smoothingTimeConstant: 0,
      disconnect: disconnectAnalyser,
      getFloatTimeDomainData(samples: Float32Array<ArrayBuffer>) {
        for (let index = 0; index < samples.length; index += 1) {
          samples[index] = 0.5 * Math.sin((2 * Math.PI * 220 * index) / 48_000);
        }
      },
    }));
    close = close;
  }

  beforeEach(() => {
    callbacks.length = 0;
    vi.clearAllMocks();
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

  afterEach(() => vi.unstubAllGlobals());

  it('publishes detected frequency and releases every owned resource', async () => {
    const onDetection = vi.fn();
    const handle = startPitchAnalysis({} as MediaStream, onDetection, vi.fn());
    callbacks[0](100);

    expect(onDetection).toHaveBeenCalledOnce();
    expect(onDetection.mock.calls[0][0].frequencyHz).toBeCloseTo(220, 0);
    expect(pitchAnalysisConfig.fftSize).toBe(4096);

    const pendingCallback = callbacks.at(-1)!;
    await handle.stop();
    pendingCallback(200);

    expect(onDetection).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(disconnectSource).toHaveBeenCalledOnce();
    expect(disconnectAnalyser).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
