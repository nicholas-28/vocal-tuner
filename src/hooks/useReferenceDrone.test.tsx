import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialReferenceDroneDiagnostics } from '../audio/referenceDroneConfig';
import type {
  ReferenceDroneEngine,
  ReferenceDroneSnapshot,
} from '../types/referenceDrone';
import { useReferenceDrone } from './useReferenceDrone';

function createFakeEngine(initialVolume = 0.25) {
  let snapshot: ReferenceDroneSnapshot = {
    status: 'stopped',
    activeMidi: null,
    pendingMidi: null,
    frequencyHz: null,
    volume: initialVolume,
    errorCode: null,
    recoveryState: 'ready',
    diagnostics: createInitialReferenceDroneDiagnostics(),
  };
  const listeners = new Set<(value: ReferenceDroneSnapshot) => void>();
  const publish = (next: ReferenceDroneSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener({ ...snapshot }));
  };
  const activateFromUserGesture = vi.fn(async (note) => {
    publish({
      ...snapshot,
      status: 'starting',
      activeMidi: note.midiNote,
      frequencyHz: note.frequencyHz,
      errorCode: null,
    });
    publish({ ...snapshot, status: 'playing' });
    return { ok: true } as const;
  });
  const engine: ReferenceDroneEngine = {
    activateFromUserGesture,
    play: activateFromUserGesture,
    playOutputTestFromUserGesture: vi.fn(async () => ({ ok: true }) as const),
    playDirectOutputTestFromUserGesture: vi.fn(
      async () => ({ ok: true }) as const,
    ),
    playConstantGainOutputTestFromUserGesture: vi.fn(
      async () => ({ ok: true }) as const,
    ),
    recreateContextAndPlayOutputTestFromUserGesture: vi.fn(
      async () => ({ ok: true }) as const,
    ),
    stop: vi.fn(async () => {
      publish({ ...snapshot, status: 'stopping' });
      publish({
        ...snapshot,
        status: 'stopped',
        activeMidi: null,
        frequencyHz: null,
      });
    }),
    setVolume: vi.fn((volume) => publish({ ...snapshot, volume })),
    getSnapshot: () => ({ ...snapshot }),
    subscribe: (listener) => {
      listeners.add(listener);
      listener({ ...snapshot });
      return () => listeners.delete(listener);
    },
    dispose: vi.fn(async () => undefined),
  };
  return engine;
}

describe('useReferenceDrone', () => {
  it('creates the engine lazily and toggles the same exact note', async () => {
    const engine = createFakeEngine();
    const factory = vi.fn(() => engine);
    const { result } = renderHook(() => useReferenceDrone(factory));
    expect(factory).not.toHaveBeenCalled();
    expect(result.current.snapshot.status).toBe('stopped');

    act(() => result.current.setVolume(0.4));
    expect(factory).not.toHaveBeenCalled();
    expect(result.current.snapshot.volume).toBe(0.4);

    await act(() => result.current.toggleMidi(60));
    expect(factory).toHaveBeenCalledWith(0.4, false, undefined);
    expect(engine.activateFromUserGesture).toHaveBeenCalledWith({
      midiNote: 60,
      frequencyHz: 261.6255653005986,
    });
    expect(result.current.snapshot).toMatchObject({
      status: 'playing',
      activeMidi: 60,
    });

    await act(() => result.current.toggleMidi(60));
    expect(engine.stop).toHaveBeenCalledOnce();
    expect(result.current.snapshot.status).toBe('stopped');
    await act(() => result.current.toggleMidi(60));
    expect(engine.activateFromUserGesture).toHaveBeenCalledTimes(2);
  });

  it('changes notes, forwards volume, and disposes on unmount', async () => {
    const engine = createFakeEngine();
    const { result, unmount } = renderHook(() =>
      useReferenceDrone(() => engine),
    );
    await act(() => result.current.playMidi(69));
    expect(engine.activateFromUserGesture).toHaveBeenCalledWith({
      midiNote: 69,
      frequencyHz: 440,
    });
    await act(() => result.current.toggleMidi(67));
    expect(engine.activateFromUserGesture).toHaveBeenLastCalledWith({
      midiNote: 67,
      frequencyHz: 391.99543598174927,
    });
    act(() => result.current.setVolume(0));
    expect(engine.setVolume).toHaveBeenCalledWith(0);
    unmount();
    expect(engine.dispose).toHaveBeenCalledOnce();
  });

  it('creates the active engine after the Strict Mode setup cycle', async () => {
    const engine = createFakeEngine();
    const factory = vi.fn(() => engine);
    const { result, unmount } = renderHook(() => useReferenceDrone(factory), {
      wrapper: StrictMode,
    });

    expect(factory).not.toHaveBeenCalled();
    await act(() => result.current.playMidi(60));
    expect(factory).toHaveBeenCalledOnce();
    expect(engine.dispose).not.toHaveBeenCalled();
    expect(result.current.snapshot.status).toBe('playing');
    unmount();
    expect(engine.dispose).toHaveBeenCalledOnce();
  });

  it('uses a new owned engine after unmount and remount', async () => {
    const firstEngine = createFakeEngine();
    const secondEngine = createFakeEngine();
    const factory = vi
      .fn()
      .mockReturnValueOnce(firstEngine)
      .mockReturnValueOnce(secondEngine);
    const first = renderHook(() => useReferenceDrone(factory));
    await act(() => first.result.current.playMidi(60));
    first.unmount();
    expect(firstEngine.dispose).toHaveBeenCalledOnce();

    const second = renderHook(() => useReferenceDrone(factory));
    await act(() => second.result.current.playMidi(69));
    expect(secondEngine.play).toHaveBeenCalledWith({
      midiNote: 69,
      frequencyHz: 440,
    });
    expect(firstEngine.activateFromUserGesture).toHaveBeenCalledTimes(1);
    expect(second.result.current.snapshot).toMatchObject({
      status: 'playing',
      activeMidi: 69,
    });
    second.unmount();
  });
});
