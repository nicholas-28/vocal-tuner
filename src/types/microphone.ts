export type MicrophoneState =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'stopping'
  | 'denied'
  | 'unsupported'
  | 'no-device'
  | 'error';

export type MicrophoneErrorState = Extract<
  MicrophoneState,
  'denied' | 'unsupported' | 'no-device' | 'error'
>;

export type MicrophoneStateContent = {
  status: string;
  guidance?: string;
};

export const microphoneStateContent: Record<
  MicrophoneState,
  MicrophoneStateContent
> = {
  idle: { status: 'Microphone inactive' },
  requesting: { status: 'Requesting access' },
  active: { status: 'Microphone active' },
  stopping: { status: 'Stopping microphone' },
  denied: {
    status: 'Permission denied',
    guidance:
      'Microphone access was denied. Allow microphone access in your browser settings, then try again.',
  },
  unsupported: {
    status: 'Microphone unsupported',
    guidance: 'This browser does not support microphone access.',
  },
  'no-device': {
    status: 'Microphone unavailable',
    guidance: 'No microphone was found.',
  },
  error: {
    status: 'Microphone error',
    guidance:
      'The microphone could not be started. Check that it is available, then try again.',
  },
};
