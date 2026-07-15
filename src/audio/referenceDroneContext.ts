import type { ReferenceDroneAudioContextConstructorName } from '../types/referenceDrone';

export type AudioContextConstructor = new () => AudioContext;

export type AudioContextConstructorSelection = Readonly<{
  constructor: AudioContextConstructor | null;
  name: ReferenceDroneAudioContextConstructorName;
}>;

type AudioContextWindow = Partial<
  Pick<typeof globalThis, 'AudioContext'> & {
    webkitAudioContext: AudioContextConstructor;
  }
>;

export function selectAudioContextConstructor(
  browserWindow: AudioContextWindow | undefined = typeof window === 'undefined'
    ? undefined
    : window,
): AudioContextConstructorSelection {
  if (typeof browserWindow?.AudioContext === 'function') {
    return { constructor: browserWindow.AudioContext, name: 'AudioContext' };
  }
  if (typeof browserWindow?.webkitAudioContext === 'function') {
    return {
      constructor: browserWindow.webkitAudioContext,
      name: 'webkitAudioContext',
    };
  }
  return { constructor: null, name: 'unavailable' };
}
