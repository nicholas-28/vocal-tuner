import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  basicAudioConstraints,
  mapMicrophoneError,
  requestMicrophoneStream,
  supportsMicrophoneCapture,
  voiceAudioConstraints,
} from './microphone';

describe('microphone capture', () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    getUserMedia.mockReset();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });

  it('detects browser support', () => {
    expect(supportsMicrophoneCapture()).toBe(true);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
    expect(supportsMicrophoneCapture()).toBe(false);
  });

  it('requests conservative audio-only constraints', async () => {
    const stream = {} as MediaStream;
    getUserMedia.mockResolvedValue(stream);

    await expect(requestMicrophoneStream()).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith(voiceAudioConstraints);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('retries once with basic audio after an over-constrained failure', async () => {
    const stream = {} as MediaStream;
    getUserMedia
      .mockRejectedValueOnce({ name: 'OverconstrainedError' })
      .mockResolvedValueOnce(stream);

    await expect(requestMicrophoneStream()).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenNthCalledWith(1, voiceAudioConstraints);
    expect(getUserMedia).toHaveBeenNthCalledWith(2, basicAudioConstraints);
  });

  it.each([
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['NotFoundError', 'no-device'],
    ['DevicesNotFoundError', 'no-device'],
    ['NotReadableError', 'no-device'],
    ['TrackStartError', 'no-device'],
    ['AbortError', 'error'],
    ['UnknownError', 'error'],
  ] as const)('maps %s to %s', (name, state) => {
    expect(mapMicrophoneError({ name })).toBe(state);
  });
});
