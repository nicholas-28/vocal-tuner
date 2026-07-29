import { describe, expect, it, vi } from 'vitest';
import { selectAudioContextConstructor } from './referenceDroneContext';

describe('reference drone AudioContext constructor selection', () => {
  it('prefers the standard constructor', () => {
    const Standard = vi.fn();
    const Prefixed = vi.fn();
    expect(
      selectAudioContextConstructor({
        AudioContext: Standard as unknown as typeof AudioContext,
        webkitAudioContext: Prefixed as unknown as typeof AudioContext,
      }),
    ).toEqual({ constructor: Standard, name: 'AudioContext' });
  });

  it('falls back to the prefixed constructor', () => {
    const Prefixed = vi.fn();
    expect(
      selectAudioContextConstructor({
        webkitAudioContext: Prefixed as unknown as typeof AudioContext,
      }),
    ).toEqual({ constructor: Prefixed, name: 'webkitAudioContext' });
  });

  it('reports unavailable without touching a constructor', () => {
    expect(selectAudioContextConstructor({})).toEqual({
      constructor: null,
      name: 'unavailable',
    });
  });
});
