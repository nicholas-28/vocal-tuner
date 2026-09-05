import { microphoneStateContent } from '../types/microphone';
import type { MicrophoneState } from '../types/microphone';

type MicrophoneStatusProps = {
  state: MicrophoneState;
  inputLevel: number;
};

type MicrophoneControlsProps = {
  state: MicrophoneState;
  onStart: () => void;
  onStop: () => void;
};

export function MicrophoneStatus({ state, inputLevel }: MicrophoneStatusProps) {
  const content = microphoneStateContent[state];

  return (
    <div className="microphone-status">
      <span
        className={`status status--${state}`}
        role="status"
        aria-live="polite"
        aria-label="Microphone status"
      >
        <span className="status__dot" aria-hidden="true" />
        {content.status}
      </span>
      <div className="input-level">
        <span>Input level</span>
        <div
          className="level-meter"
          role="meter"
          aria-label="Microphone input level"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={inputLevel}
        >
          <span
            className="level-meter__fill"
            style={{ transform: `scaleX(${inputLevel})` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MicrophoneControls({
  state,
  onStart,
  onStop,
}: MicrophoneControlsProps) {
  const content = microphoneStateContent[state];
  const isRequesting = state === 'requesting';
  const isStopping = state === 'stopping';
  const isActive = state === 'active';
  const buttonLabel = isActive
    ? 'Stop microphone'
    : isRequesting
      ? 'Allow microphone…'
      : isStopping
        ? 'Stopping microphone…'
        : 'Start microphone';

  return (
    <section className="controls" aria-label="Microphone controls">
      {content.guidance && (
        <p className="microphone-guidance" role="alert">
          {content.guidance}
        </p>
      )}
      <button
        className="primary-button"
        type="button"
        disabled={isRequesting || isStopping}
        onClick={isActive ? onStop : onStart}
      >
        {buttonLabel}
      </button>
      {isRequesting && (
        <button className="secondary-button" type="button" onClick={onStop}>
          Cancel microphone
        </button>
      )}
      <p className="privacy-note">
        Your microphone audio is processed locally on this device and is not
        uploaded.
      </p>
    </section>
  );
}
