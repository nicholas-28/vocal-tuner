import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PitchAnalysisHandle } from '../audio/pitchAnalysis';
import { createPitchDetection } from '../test/pitchFixture';
import type { RawPitchDetection } from '../types/pitch';
import type { MicrophoneServices } from './useMicrophone';
import { useMicrophone } from './useMicrophone';

class MockTrack extends EventTarget {
  stop = vi.fn();
}

function createStream() {
  const track = new MockTrack();
  const stream = {
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream;
  return { stream, track };
}

function createServices(
  stream: MediaStream,
  monitor: PitchAnalysisHandle = {
    stop: vi.fn().mockResolvedValue(undefined),
  },
): MicrophoneServices {
  return {
    isSupported: vi.fn(() => true),
    requestStream: vi.fn().mockResolvedValue(stream),
    startLevelMonitor: vi.fn((_stream, onDetection) => {
      onDetection(createPitchDetection());
      return monitor;
    }),
  };
}

describe('useMicrophone', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('starts idle and reports unsupported browsers after a start attempt', async () => {
    const { stream } = createStream();
    const services = createServices(stream);
    services.isSupported = vi.fn(() => false);
    const { result } = renderHook(() => useMicrophone(services));

    expect(result.current.state).toBe('idle');
    await act(() => result.current.start());
    expect(result.current.state).toBe('unsupported');
    expect(services.requestStream).not.toHaveBeenCalled();
  });

  it('moves through requesting and active, then stops every resource', async () => {
    const { stream, track } = createStream();
    const removeEndedListener = vi.spyOn(track, 'removeEventListener');
    let resolveStream!: (stream: MediaStream) => void;
    const request = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve;
    });
    const monitor = { stop: vi.fn().mockResolvedValue(undefined) };
    const services = createServices(stream, monitor);
    services.requestStream = vi.fn(() => request);
    const { result } = renderHook(() => useMicrophone(services));

    act(() => void result.current.start());
    await waitFor(() => expect(result.current.state).toBe('requesting'));
    expect(services.startLevelMonitor).not.toHaveBeenCalled();

    await act(async () => resolveStream(stream));
    expect(result.current.state).toBe('active');
    expect(result.current.inputLevel).toBe(0.4);

    await act(() => result.current.stop());
    expect(result.current.state).toBe('idle');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(removeEndedListener).toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );
    expect(monitor.stop).toHaveBeenCalledOnce();
  });

  it('exposes stopping until asynchronous monitor cleanup completes', async () => {
    const { stream } = createStream();
    let resolveStop!: () => void;
    const stopPromise = new Promise<void>((resolve) => {
      resolveStop = resolve;
    });
    const services = createServices(stream, { stop: vi.fn(() => stopPromise) });
    const { result } = renderHook(() => useMicrophone(services));
    await act(() => result.current.start());

    act(() => void result.current.stop());
    expect(result.current.state).toBe('stopping');
    await act(async () => resolveStop());
    expect(result.current.state).toBe('idle');
  });

  it('supports repeated start and stop without reloading', async () => {
    const first = createStream();
    const second = createStream();
    const services = createServices(first.stream);
    services.requestStream = vi
      .fn()
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream);
    const { result } = renderHook(() => useMicrophone(services));

    await act(() => result.current.start());
    await act(() => result.current.stop());
    await act(() => result.current.start());
    expect(result.current.state).toBe('active');
    await act(() => result.current.stop());

    expect(services.requestStream).toHaveBeenCalledTimes(2);
    expect(services.startLevelMonitor).toHaveBeenCalledTimes(2);
    expect(first.track.stop).toHaveBeenCalledOnce();
    expect(second.track.stop).toHaveBeenCalledOnce();
  });

  it('ignores detector updates after stop', async () => {
    const { stream } = createStream();
    let publishDetection!: (detection: RawPitchDetection) => void;
    const services = createServices(stream);
    services.startLevelMonitor = vi.fn((_stream, onDetection) => {
      publishDetection = onDetection;
      return { stop: vi.fn().mockResolvedValue(undefined) };
    });
    const onDetection = vi.fn();
    const onAnalysisReset = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, { onDetection, onAnalysisReset }),
    );
    await act(() => result.current.start());
    await act(() => result.current.stop());

    act(() =>
      publishDetection(
        createPitchDetection({ timestampMs: 10, frequencyHz: 440, rms: 0.5 }),
      ),
    );
    expect(result.current.inputLevel).toBe(0);
    expect(onDetection).not.toHaveBeenCalled();
    expect(onAnalysisReset).toHaveBeenCalled();
  });

  it.each([
    ['NotAllowedError', 'denied'],
    ['NotFoundError', 'no-device'],
    ['AbortError', 'error'],
  ] as const)('maps %s start failures to %s', async (name, expected) => {
    const { stream } = createStream();
    const services = createServices(stream);
    services.requestStream = vi.fn().mockRejectedValue({ name });
    const { result } = renderHook(() => useMicrophone(services));

    await act(() => result.current.start());
    expect(result.current.state).toBe(expected);
  });

  it('cleans up when an active track ends unexpectedly', async () => {
    const { stream, track } = createStream();
    const monitor = { stop: vi.fn().mockResolvedValue(undefined) };
    const services = createServices(stream, monitor);
    const { result } = renderHook(() => useMicrophone(services));
    await act(() => result.current.start());

    await act(async () => track.dispatchEvent(new Event('ended')));
    await waitFor(() => expect(result.current.state).toBe('no-device'));
    expect(track.stop).toHaveBeenCalledOnce();
    expect(monitor.stop).toHaveBeenCalledOnce();
  });

  it('cleans up on unmount and stops a late stream from a stale request', async () => {
    const active = createStream();
    const activeServices = createServices(active.stream);
    const activeHook = renderHook(() => useMicrophone(activeServices));
    await act(() => activeHook.result.current.start());
    activeHook.unmount();
    await waitFor(() => expect(active.track.stop).toHaveBeenCalledOnce());

    const late = createStream();
    let resolveLate!: (stream: MediaStream) => void;
    const lateServices = createServices(late.stream);
    lateServices.requestStream = vi.fn(
      () => new Promise<MediaStream>((resolve) => (resolveLate = resolve)),
    );
    const lateHook = renderHook(() => useMicrophone(lateServices));
    act(() => void lateHook.result.current.start());
    await waitFor(() =>
      expect(lateServices.requestStream).toHaveBeenCalledOnce(),
    );
    lateHook.unmount();
    resolveLate(late.stream);
    await waitFor(() => expect(late.track.stop).toHaveBeenCalledOnce());
  });
});
