import { useCallback, useEffect, useRef, useState } from 'react';
import { createReferenceDroneEngine } from '../audio/referenceDroneEngine';
import {
  createInitialReferenceDroneDiagnostics,
  DEFAULT_REFERENCE_DRONE_CONFIG,
} from '../audio/referenceDroneConfig';
import { createReferenceKey } from '../reference/referenceKeyboard';
import type {
  ReferenceDroneEngine,
  ReferenceDroneEngineFactory,
  ReferenceDroneSnapshot,
} from '../types/referenceDrone';

export function createInitialReferenceDroneSnapshot(): ReferenceDroneSnapshot {
  return {
    status: 'stopped',
    activeMidi: null,
    frequencyHz: null,
    volume: DEFAULT_REFERENCE_DRONE_CONFIG.defaultVolume,
    errorCode: null,
    diagnostics: createInitialReferenceDroneDiagnostics(),
  };
}

const defaultEngineFactory: ReferenceDroneEngineFactory = (initialVolume) =>
  createReferenceDroneEngine({ initialVolume });

export function useReferenceDrone(
  engineFactory: ReferenceDroneEngineFactory = defaultEngineFactory,
) {
  const [snapshot, setSnapshot] = useState<ReferenceDroneSnapshot>(
    createInitialReferenceDroneSnapshot,
  );
  const snapshotRef = useRef(snapshot);
  const engineRef = useRef<ReferenceDroneEngine | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const factoryRef = useRef(engineFactory);
  factoryRef.current = engineFactory;

  const updateSnapshot = useCallback((next: ReferenceDroneSnapshot) => {
    snapshotRef.current = next;
    if (mountedRef.current) setSnapshot(next);
  }, []);

  const ensureEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current;
    const engine = factoryRef.current(snapshotRef.current.volume);
    engineRef.current = engine;
    unsubscribeRef.current = engine.subscribe((next) => {
      if (engineRef.current === engine) updateSnapshot(next);
    });
    return engine;
  }, [updateSnapshot]);

  const playMidi = useCallback(
    async (midiNote: number) => {
      const key = createReferenceKey(midiNote);
      if (!key) return;
      await ensureEngine().play({
        midiNote,
        frequencyHz: key.idealFrequencyHz,
      });
    },
    [ensureEngine],
  );

  const toggleMidi = useCallback(
    async (midiNote: number) => {
      const current = snapshotRef.current;
      const isSoundingOrStarting =
        current.activeMidi === midiNote &&
        (current.status === 'starting' ||
          current.status === 'playing' ||
          current.status === 'changing');
      if (isSoundingOrStarting) {
        await ensureEngine().stop();
        return;
      }
      await playMidi(midiNote);
    },
    [ensureEngine, playMidi],
  );

  const stop = useCallback(async () => {
    if (!engineRef.current) return;
    await engineRef.current.stop();
  }, []);

  const setVolume = useCallback(
    (normalizedVolume: number) => {
      const volume = Number.isFinite(normalizedVolume)
        ? Math.min(1, Math.max(0, normalizedVolume))
        : snapshotRef.current.volume;
      if (!engineRef.current) {
        updateSnapshot({ ...snapshotRef.current, volume });
        return;
      }
      engineRef.current.setVolume(volume);
    },
    [updateSnapshot],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      const engine = engineRef.current;
      engineRef.current = null;
      if (engine) void engine.dispose();
    };
  }, []);

  return { snapshot, toggleMidi, playMidi, stop, setVolume };
}
