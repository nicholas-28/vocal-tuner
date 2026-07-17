export type ReferenceDroneSessionPreparationResult = Readonly<{
  available: boolean;
  changed: boolean;
  priorType: string | null;
  resultingType: string | null;
  state: string | null;
  result: 'unavailable' | 'not-needed' | 'prepared' | 'rejected' | 'failed';
  errorMessage: string | null;
}>;

type MutableAudioSession = {
  type?: unknown;
  state?: unknown;
};

export function prepareReferenceDronePlaybackSession(): ReferenceDroneSessionPreparationResult {
  const audioSession = getAudioSession();
  const priorType = readString(audioSession?.type);
  const state = readString(audioSession?.state);

  if (!audioSession || priorType === null) {
    return result(false, false, null, null, state, 'unavailable');
  }

  // An active session is already routed. In particular, do not replace an
  // active microphone's play-and-record policy while the drone is selected.
  if (state === 'active' || priorType === 'playback') {
    return result(true, false, priorType, priorType, state, 'not-needed');
  }

  try {
    audioSession.type = 'playback';
    const resultingType = readString(audioSession.type);
    return result(
      true,
      resultingType === 'playback',
      priorType,
      resultingType,
      readString(audioSession.state),
      resultingType === 'playback' ? 'prepared' : 'rejected',
    );
  } catch (error) {
    return result(
      true,
      false,
      priorType,
      readString(audioSession.type),
      readString(audioSession.state),
      'failed',
      error instanceof Error
        ? error.message
        : 'AudioSession playback preparation failed.',
    );
  }
}

export function restoreReferenceDroneAudioSession(
  preparation: ReferenceDroneSessionPreparationResult,
): string | null {
  if (!preparation.changed || preparation.priorType === null) return null;
  const audioSession = getAudioSession();
  if (!audioSession || audioSession.type !== 'playback') return null;
  try {
    audioSession.type = preparation.priorType;
    return readString(audioSession.type);
  } catch {
    return readString(audioSession.type);
  }
}

function getAudioSession(): MutableAudioSession | null {
  if (typeof navigator === 'undefined') return null;
  return (
    (navigator as Navigator & { audioSession?: MutableAudioSession })
      .audioSession ?? null
  );
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function result(
  available: boolean,
  changed: boolean,
  priorType: string | null,
  resultingType: string | null,
  state: string | null,
  preparationResult: ReferenceDroneSessionPreparationResult['result'],
  errorMessage: string | null = null,
): ReferenceDroneSessionPreparationResult {
  return Object.freeze({
    available,
    changed,
    priorType,
    resultingType,
    state,
    result: preparationResult,
    errorMessage,
  });
}
