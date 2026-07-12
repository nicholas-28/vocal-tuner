import type { MicrophoneErrorState } from '../types/microphone';

export const voiceAudioConstraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  },
  video: false,
};

export const basicAudioConstraints: MediaStreamConstraints = {
  audio: true,
  video: false,
};

const overconstrainedErrors = new Set([
  'OverconstrainedError',
  'ConstraintNotSatisfiedError',
]);

export function supportsMicrophoneCapture(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia(voiceAudioConstraints);
  } catch (error) {
    if (!overconstrainedErrors.has(getErrorName(error))) {
      throw error;
    }

    // Older browsers and devices may reject one of the optional voice constraints.
    return navigator.mediaDevices.getUserMedia(basicAudioConstraints);
  }
}

export function mapMicrophoneError(error: unknown): MicrophoneErrorState {
  const name = getErrorName(error);

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'denied';
  }

  if (
    name === 'NotFoundError' ||
    name === 'DevicesNotFoundError' ||
    name === 'NotReadableError' ||
    name === 'TrackStartError'
  ) {
    return 'no-device';
  }

  return 'error';
}

function getErrorName(error: unknown): string {
  if (error instanceof DOMException || error instanceof Error) {
    return error.name;
  }

  if (typeof error === 'object' && error !== null && 'name' in error) {
    return String(error.name);
  }

  return '';
}
