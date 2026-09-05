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

const analysisDiagnostics = Object.freeze({
  contextState: 'running',
  sampleRate: 48_000,
  destinationChannelCount: 2,
  destinationConnected: false as const,
});

function createServices(
  stream: MediaStream,
  monitor: PitchAnalysisHandle = {
    stop: vi.fn().mockResolvedValue(undefined),
    diagnostics: analysisDiagnostics,
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
    const monitor = {
      stop: vi.fn().mockResolvedValue(undefined),
      diagnostics: analysisDiagnostics,
    };
    const services = createServices(stream, monitor);
    services.requestStream = vi.fn(() => request);
    const onSessionStarted = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, { onSessionStarted }),
    );

    act(() => void result.current.start());
    await waitFor(() => expect(result.current.state).toBe('requesting'));
    expect(services.startLevelMonitor).not.toHaveBeenCalled();

    await act(async () => resolveStream(stream));
    expect(result.current.state).toBe('active');
    expect(result.current.inputLevel).toBe(0.4);
    expect(onSessionStarted).toHaveBeenCalledOnce();

    await act(() => result.current.stop());
    expect(result.current.state).toBe('idle');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(removeEndedListener).toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );
    expect(monitor.stop).toHaveBeenCalledOnce();
  });

  it('publishes ordered capture and analysis context diagnostics', async () => {
    const { stream } = createStream();
    const services = createServices(stream);
    const onAudioDiagnosticEvent = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, { onAudioDiagnosticEvent }),
    );
    await act(() => result.current.start());
    await act(() => result.current.stop());
    expect(
      onAudioDiagnosticEvent.mock.calls.map(([event]) => event.label),
    ).toEqual([
      'before getUserMedia',
      'after getUserMedia resolved',
      'after microphone AudioContext starts',
      'after microphone Stop',
    ]);
    expect(onAudioDiagnosticEvent.mock.calls[2]?.[0]).toMatchObject({
      contextState: 'running',
      sampleRate: 48_000,
      destinationConnected: false,
      activeTrackCount: 1,
    });
  });

  it('exposes stopping until asynchronous monitor cleanup completes', async () => {
    const { stream } = createStream();
    let resolveStop!: () => void;
    const stopPromise = new Promise<void>((resolve) => {
      resolveStop = resolve;
    });
    const services = createServices(stream, {
      stop: vi.fn(() => stopPromise),
      diagnostics: analysisDiagnostics,
    });
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
      return {
        stop: vi.fn().mockResolvedValue(undefined),
        diagnostics: analysisDiagnostics,
      };
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
    const monitor = {
      stop: vi.fn().mockResolvedValue(undefined),
      diagnostics: analysisDiagnostics,
    };
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
  it('coalesces two same-task Starts into one acquisition', async () => {
    const { stream, track } = createStream();
    const services = createServices(stream);
    const { result } = renderHook(() => useMicrophone(services));
    await act(async () => {
      await Promise.all([result.current.start(), result.current.start()]);
    });
    expect(services.requestStream).toHaveBeenCalledOnce();
    expect(services.startLevelMonitor).toHaveBeenCalledOnce();
    await act(() => result.current.stop());
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('invalidates live observations and releases capture immediately on analysis failure', async () => {
    const { stream, track } = createStream();
    const monitor = {
      stop: vi.fn().mockResolvedValue(undefined),
      diagnostics: analysisDiagnostics,
    };
    const services = createServices(stream, monitor);
    let fail!: () => void;
    let publish!: (d: RawPitchDetection) => void;
    services.startLevelMonitor = vi.fn((_stream, onDetection, onError) => {
      fail = onError;
      publish = onDetection;
      onDetection(createPitchDetection());
      return monitor;
    });
    const reset = vi.fn();
    const error = vi.fn();
    const detection = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, {
        onAnalysisReset: reset,
        onAnalysisError: error,
        onDetection: detection,
      }),
    );
    await act(() => result.current.start());
    reset.mockClear();
    await act(async () => fail());
    expect(result.current.state).toBe('error');
    expect(result.current.inputLevel).toBe(0);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(monitor.stop).toHaveBeenCalledOnce();
    expect(reset).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    act(() => publish(createPitchDetection({ timestampMs: 1000 })));
    expect(detection).toHaveBeenCalledOnce();
  });

  it.each(['resolve', 'reject'] as const)(
    'Stop invalidates pending Start and its late %s cannot disturb a newer session',
    async (completion) => {
      const old = createStream();
      const fresh = createStream();
      let resolve!: (s: MediaStream) => void;
      let reject!: (e: unknown) => void;
      const pending = new Promise<MediaStream>((yes, no) => {
        resolve = yes;
        reject = no;
      });
      const services = createServices(fresh.stream);
      services.requestStream = vi
        .fn()
        .mockReturnValueOnce(pending)
        .mockResolvedValueOnce(fresh.stream);
      const { result } = renderHook(() => useMicrophone(services));
      act(() => {
        void result.current.start();
      });
      await waitFor(() =>
        expect(services.requestStream).toHaveBeenCalledOnce(),
      );
      await act(() => result.current.stop());
      expect(result.current.state).toBe('idle');
      await act(() => result.current.start());
      expect(result.current.state).toBe('active');
      await act(async () => {
        if (completion === 'resolve') resolve(old.stream);
        else reject(new Error('late denial'));
      });
      expect(result.current.state).toBe('active');
      expect(fresh.track.stop).not.toHaveBeenCalled();
      expect(services.startLevelMonitor).toHaveBeenCalledOnce();
      if (completion === 'resolve')
        expect(old.track.stop).toHaveBeenCalledOnce();
      await act(() => result.current.stop());
      expect(fresh.track.stop).toHaveBeenCalledOnce();
    },
  );
  it('releases all acquired tracks when analysis construction throws', async () => {
    const first = new MockTrack();
    const second = new MockTrack();
    const stream = {
      getTracks: () => [first, second],
    } as unknown as MediaStream;
    const services = createServices(stream);
    services.startLevelMonitor = vi.fn(() => {
      throw new Error('construction');
    });
    const { result } = renderHook(() => useMicrophone(services));
    await act(() => result.current.start());
    expect(result.current.state).toBe('error');
    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).toHaveBeenCalledOnce();
  });

  it('disposes a handle returned after a synchronous analysis failure', async () => {
    const { stream, track } = createStream();
    const monitor = {
      stop: vi.fn().mockResolvedValue(undefined),
      diagnostics: analysisDiagnostics,
    };
    const services = createServices(stream);
    services.startLevelMonitor = vi.fn((_stream, _publish, fail) => {
      fail();
      return monitor;
    });
    const { result } = renderHook(() => useMicrophone(services));
    await act(() => result.current.start());
    expect(result.current.state).toBe('error');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(monitor.stop).toHaveBeenCalledOnce();
  });

  it('waits for disposal on retry and requires new evidence before active', async () => {
    const old = createStream();
    const fresh = createStream();
    let finishClose!: () => void;
    const closing = new Promise<void>((resolve) => {
      finishClose = resolve;
    });
    const services = createServices(old.stream);
    services.requestStream = vi
      .fn()
      .mockResolvedValueOnce(old.stream)
      .mockResolvedValueOnce(fresh.stream);
    const failures: Array<() => void> = [];
    const publishers: Array<(d: RawPitchDetection) => void> = [];
    services.startLevelMonitor = vi.fn((_stream, publish, fail) => {
      publishers.push(publish);
      failures.push(fail);
      return {
        stop: vi.fn(() =>
          publishers.length === 1 ? closing : Promise.resolve(),
        ),
        diagnostics: analysisDiagnostics,
      };
    });
    const onDetection = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, { onDetection }),
    );
    await act(() => result.current.start());
    expect(result.current.state).toBe('requesting');
    act(() => publishers[0](createPitchDetection()));
    expect(result.current.state).toBe('active');
    act(() => failures[0]());
    expect(result.current.state).toBe('error');
    expect(old.track.stop).toHaveBeenCalledOnce();
    act(() => {
      void result.current.start();
    });
    expect(services.requestStream).toHaveBeenCalledOnce();
    await act(async () => finishClose());
    expect(services.requestStream).toHaveBeenCalledTimes(2);
    expect(result.current.state).toBe('requesting');
    act(() => {
      failures[0]();
      publishers[0](createPitchDetection({ timestampMs: 100 }));
    });
    expect(result.current.state).toBe('requesting');
    expect(onDetection).toHaveBeenCalledOnce();
    act(() => publishers[1](createPitchDetection({ timestampMs: 200 })));
    expect(result.current.state).toBe('active');
    expect(onDetection).toHaveBeenCalledTimes(2);
    await act(() => result.current.stop());
    expect(fresh.track.stop).toHaveBeenCalledOnce();
  });

  it('treats track mute as loss of trustworthy input', async () => {
    const { stream, track } = createStream();
    const services = createServices(stream);
    const { result } = renderHook(() => useMicrophone(services));
    await act(() => result.current.start());
    act(() => {
      track.dispatchEvent(new Event('mute'));
    });
    expect(result.current.state).toBe('no-device');
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it('reports cleanup rejection instead of claiming the context closed', async () => {
    const { stream, track } = createStream();
    const monitor = {
      stop: vi.fn().mockRejectedValue(new Error('close failed')),
      diagnostics: analysisDiagnostics,
    };
    const services = createServices(stream, monitor);
    const event = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, { onAudioDiagnosticEvent: event }),
    );
    await act(() => result.current.start());
    await act(() => result.current.stop());
    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.state).toBe('error');
    expect(event.mock.calls.at(-1)?.[0]).toMatchObject({
      microphoneState: 'error',
      contextState: 'unknown',
    });
  });

  it('does not publish after a track ends before its queued event is delivered', async () => {
    const track = Object.assign(new MockTrack(), { readyState: 'live' });
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    const services = createServices(stream);
    let publish!: (d: RawPitchDetection) => void;
    services.startLevelMonitor = vi.fn((_stream, onDetection) => {
      publish = onDetection;
      return {
        stop: vi.fn().mockResolvedValue(undefined),
        diagnostics: analysisDiagnostics,
      };
    });
    const onDetection = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, { onDetection }),
    );
    await act(() => result.current.start());
    act(() => publish(createPitchDetection()));
    track.readyState = 'ended';
    act(() => publish(createPitchDetection({ timestampMs: 100 })));
    expect(onDetection).toHaveBeenCalledOnce();
    expect(result.current.state).toBe('no-device');
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it('cannot adopt the generation of Stop reentered from its reset callback', async () => {
    const { stream, track } = createStream();
    const monitor = {
      stop: vi.fn().mockResolvedValue(undefined),
      diagnostics: analysisDiagnostics,
    };
    const services = createServices(stream, monitor);
    let cancelOnce = true;
    let pendingStop: Promise<void> | undefined;
    const { result } = renderHook(() =>
      useMicrophone(services, {
        onAnalysisReset: () => {
          if (!cancelOnce) return;
          cancelOnce = false;
          pendingStop = result.current.stop();
        },
      }),
    );
    await act(async () => {
      await result.current.start();
      await pendingStop;
    });
    expect(result.current.state).toBe('idle');
    expect(services.requestStream).not.toHaveBeenCalled();
    expect(services.startLevelMonitor).not.toHaveBeenCalled();
    expect(track.stop).not.toHaveBeenCalled(); // Never acquired.
    expect(monitor.stop).not.toHaveBeenCalled(); // No graph/context was created.
    await act(() => result.current.start());
    expect(result.current.state).toBe('active');
    expect(services.requestStream).toHaveBeenCalledOnce();
    expect(services.startLevelMonitor).toHaveBeenCalledOnce();
    await act(() => result.current.stop());
    expect(result.current.state).toBe('idle');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(monitor.stop).toHaveBeenCalledOnce();
  });

  it.each([
    'support',
    'before acquisition',
    'after acquisition',
    'session started',
  ] as const)('honors Stop reentered at the %s boundary', async (boundary) => {
    const { stream, track } = createStream();
    const services = createServices(stream);
    let pendingStop: Promise<void> | undefined;
    const cancel = () => {
      pendingStop = result.current.stop();
    };
    services.isSupported = vi.fn(() => {
      if (boundary === 'support') cancel();
      return true;
    });
    const { result } = renderHook(() =>
      useMicrophone(services, {
        onAudioDiagnosticEvent: (event) => {
          if (
            (boundary === 'before acquisition' &&
              event.label === 'before getUserMedia') ||
            (boundary === 'after acquisition' &&
              event.label === 'after getUserMedia resolved')
          )
            cancel();
        },
        onSessionStarted: () => {
          if (boundary === 'session started') cancel();
        },
      }),
    );
    await act(async () => {
      await result.current.start();
      await pendingStop;
    });
    expect(result.current.state).toBe('idle');
    expect(services.startLevelMonitor).not.toHaveBeenCalled();
    if (boundary === 'support' || boundary === 'before acquisition') {
      expect(services.requestStream).not.toHaveBeenCalled();
      expect(track.stop).not.toHaveBeenCalled();
    } else {
      expect(services.requestStream).toHaveBeenCalledOnce();
      expect(track.stop).toHaveBeenCalledOnce();
    }
  });

  it('does not overwrite Stop reentered during failure invalidation', async () => {
    const { stream, track } = createStream();
    const services = createServices(stream);
    let fail!: () => void;
    let cancelOnReset = false;
    let pendingStop: Promise<void> | undefined;
    const monitor = {
      stop: vi.fn().mockResolvedValue(undefined),
      diagnostics: analysisDiagnostics,
    };
    services.startLevelMonitor = vi.fn((_stream, publish, onError) => {
      fail = onError;
      publish(createPitchDetection());
      return monitor;
    });
    const error = vi.fn();
    const { result } = renderHook(() =>
      useMicrophone(services, {
        onAnalysisError: error,
        onAnalysisReset: () => {
          if (!cancelOnReset) return;
          cancelOnReset = false;
          pendingStop = result.current.stop();
        },
      }),
    );
    await act(() => result.current.start());
    cancelOnReset = true;
    await act(async () => {
      fail();
      await pendingStop;
    });
    expect(error).not.toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(monitor.stop).toHaveBeenCalledOnce();
  });

  it('ignores Start reentered from reset without replacing the requesting owner', async () => {
    const { stream, track } = createStream();
    const services = createServices(stream);
    let reenterOnce = true;
    const { result } = renderHook(() =>
      useMicrophone(services, {
        onAnalysisReset: () => {
          if (!reenterOnce) return;
          reenterOnce = false;
          void result.current.start();
        },
      }),
    );
    await act(() => result.current.start());
    expect(result.current.state).toBe('active');
    expect(services.requestStream).toHaveBeenCalledOnce();
    expect(services.startLevelMonitor).toHaveBeenCalledOnce();
    await act(() => result.current.stop());
    expect(track.stop).toHaveBeenCalledOnce();
  });
});
