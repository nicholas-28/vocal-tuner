import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNativeAudioDiagnostic } from './useNativeAudioDiagnostic';

class MockAudioElement extends EventTarget {
  static instances: MockAudioElement[] = [];
  currentTime = 0;
  paused = true;
  preload = '';
  error: MediaError | null = null;
  play = vi.fn(async () => {
    this.paused = false;
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  removeAttribute = vi.fn();

  constructor(readonly src: string) {
    super();
    MockAudioElement.instances.push(this);
  }
}

describe('useNativeAudioDiagnostic', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    MockAudioElement.instances = [];
  });

  it('plays a local WAV explicitly, records media events, and revokes its URL', async () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('Audio', MockAudioElement);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:local-a4'),
      revokeObjectURL,
    });
    const { result, unmount } = renderHook(() => useNativeAudioDiagnostic());
    act(() => result.current.playFromUserGesture());
    const audio = MockAudioElement.instances[0];
    expect(audio?.src).toBe('blob:local-a4');
    expect(audio?.play).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(result.current.state.playResult).toBe('resolved'),
    );

    act(() => audio?.dispatchEvent(new Event('playing')));
    if (audio) audio.currentTime = 0.5;
    act(() => audio?.dispatchEvent(new Event('timeupdate')));
    if (audio) audio.currentTime = 1;
    act(() => audio?.dispatchEvent(new Event('ended')));
    expect(result.current.state).toMatchObject({
      status: 'succeeded',
      playingEventReceived: true,
      timeUpdateReceived: true,
      endedEventReceived: true,
      currentTime: 1,
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-a4');
    unmount();
  });

  it('reports a rejected play promise and cleans the object URL', async () => {
    const revokeObjectURL = vi.fn();
    class RejectingAudio extends MockAudioElement {
      play = vi.fn(async () => Promise.reject(new Error('media blocked')));
    }
    vi.stubGlobal('Audio', RejectingAudio);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:rejected'),
      revokeObjectURL,
    });
    const { result } = renderHook(() => useNativeAudioDiagnostic());
    act(() => result.current.playFromUserGesture());
    await waitFor(() => expect(result.current.state.status).toBe('failed'));
    expect(result.current.state).toMatchObject({
      playResult: 'rejected',
      errorMessage: 'media blocked',
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:rejected');
  });

  it('reports a media element error and removes its listeners', async () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('Audio', MockAudioElement);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:media-error'),
      revokeObjectURL,
    });
    const removeEventListener = vi.spyOn(
      MockAudioElement.prototype,
      'removeEventListener',
    );
    const { result } = renderHook(() => useNativeAudioDiagnostic());
    act(() => result.current.playFromUserGesture());
    const audio = MockAudioElement.instances[0];
    Object.defineProperty(audio, 'error', {
      configurable: true,
      value: { code: 3, message: 'decode failed' },
    });
    await waitFor(() =>
      expect(result.current.state.playResult).toBe('resolved'),
    );
    act(() => audio?.dispatchEvent(new Event('error')));
    expect(result.current.state).toMatchObject({
      status: 'failed',
      errorCode: 3,
      errorMessage: 'decode failed',
    });
    expect(removeEventListener).toHaveBeenCalledTimes(4);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:media-error');
  });
});
