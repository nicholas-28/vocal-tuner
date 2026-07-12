import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startInputLevelMonitor } from './inputLevel';

describe('input level monitor', () => {
  const disconnectSource = vi.fn();
  const disconnectAnalyser = vi.fn();
  const close = vi.fn().mockResolvedValue(undefined);
  let animationCallback: FrameRequestCallback;

  class MockAudioContext {
    state = 'running' as AudioContextState;
    createMediaStreamSource = vi.fn(() => ({
      connect: vi.fn(),
      disconnect: disconnectSource,
    }));
    createAnalyser = vi.fn(() => ({
      fftSize: 0,
      disconnect: disconnectAnalyser,
      getFloatTimeDomainData: (samples: Float32Array<ArrayBuffer>) =>
        samples.fill(0.5),
    }));
    close = close;
  }

  beforeEach(() => {
    disconnectSource.mockClear();
    disconnectAnalyser.mockClear();
    close.mockClear();
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationCallback = callback;
        return 42;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it('publishes normalized RMS and releases its graph idempotently', async () => {
    const onLevel = vi.fn();
    const monitor = startInputLevelMonitor({} as MediaStream, onLevel);

    animationCallback(100);
    expect(onLevel).toHaveBeenCalledWith(0.5);

    await monitor.stop();
    await monitor.stop();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(disconnectSource).toHaveBeenCalledOnce();
    expect(disconnectAnalyser).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(onLevel).toHaveBeenLastCalledWith(0);
  });
});
