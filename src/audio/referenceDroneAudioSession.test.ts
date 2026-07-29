import { afterEach, describe, expect, it } from 'vitest';
import {
  prepareReferenceDronePlaybackSession,
  restoreReferenceDroneAudioSession,
} from './referenceDroneAudioSession';

describe('reference drone audio-session preparation', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'audioSession');
  });

  it('prepares playback and restores auto without microphone access', () => {
    const audioSession = { type: 'auto', state: 'inactive' };
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: audioSession,
    });

    const preparation = prepareReferenceDronePlaybackSession();

    expect(preparation).toMatchObject({
      changed: true,
      priorType: 'auto',
      resultingType: 'playback',
      result: 'prepared',
    });
    expect(restoreReferenceDroneAudioSession(preparation)).toBe('auto');
    expect(audioSession.type).toBe('auto');
  });

  it('falls back when the capability is unavailable or rejects assignment', () => {
    expect(prepareReferenceDronePlaybackSession()).toMatchObject({
      available: false,
      changed: false,
      result: 'unavailable',
    });

    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        get type() {
          return 'auto';
        },
        set type(_value: string) {
          // Simulate a capability that exposes but rejects the requested type.
        },
        state: 'inactive',
      },
    });
    expect(prepareReferenceDronePlaybackSession()).toMatchObject({
      changed: false,
      resultingType: 'auto',
      result: 'rejected',
    });
  });

  it('contains assignment failures', () => {
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        get type() {
          return 'auto';
        },
        set type(_value: string) {
          throw new Error('setter blocked');
        },
        state: 'inactive',
      },
    });

    expect(prepareReferenceDronePlaybackSession()).toMatchObject({
      changed: false,
      result: 'failed',
      errorMessage: 'setter blocked',
    });
  });

  it('does not override an active audio session', () => {
    const audioSession = { type: 'play-and-record', state: 'active' };
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: audioSession,
    });

    expect(prepareReferenceDronePlaybackSession()).toMatchObject({
      changed: false,
      priorType: 'play-and-record',
      result: 'not-needed',
    });
    expect(audioSession.type).toBe('play-and-record');
  });

  it('does not overwrite a session type changed by another owner', () => {
    const audioSession = { type: 'auto', state: 'inactive' };
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: audioSession,
    });
    const preparation = prepareReferenceDronePlaybackSession();
    audioSession.type = 'play-and-record';

    expect(restoreReferenceDroneAudioSession(preparation)).toBeNull();
    expect(audioSession.type).toBe('play-and-record');
  });
});
