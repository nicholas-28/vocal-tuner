import {
  createReferenceKey,
  formatReferenceKeyFrequency,
} from '../reference/referenceKeyboard';
import type { ReferenceDroneSnapshot } from '../types/referenceDrone';
import type { VisiblePitchRange } from '../types/visiblePitchRange';
import { isMidiVisibleInRange } from '../visualization/visiblePitchRange';

type ReferenceDroneStatusProps = {
  snapshot: ReferenceDroneSnapshot;
  range: VisiblePitchRange;
};

export function ReferenceDroneStatus({
  snapshot,
  range,
}: ReferenceDroneStatusProps) {
  const displayedMidi =
    snapshot.status === 'starting' || snapshot.status === 'changing'
      ? snapshot.pendingMidi
      : snapshot.activeMidi;
  const key = displayedMidi === null ? null : createReferenceKey(displayedMidi);
  const frequency = key
    ? formatReferenceKeyFrequency(key.idealFrequencyHz)
    : null;
  const statusText = (() => {
    if (snapshot.recoveryState === 'needs-reactivation') {
      return 'Reference audio paused by the browser. Tap the selected note to restart.';
    }
    if (snapshot.status === 'error') {
      if (snapshot.errorCode === 'unavailable') {
        return 'Reference drone unavailable in this browser.';
      }
      if (snapshot.errorCode === 'context-not-running') {
        return 'Reference drone could not start because audio output stayed suspended. Activate a key to try again.';
      }
      if (snapshot.errorCode === 'context-interrupted') {
        return 'Reference drone audio was interrupted. Activate a key to try again.';
      }
      if (snapshot.errorCode === 'context-closed') {
        return 'Reference drone audio closed unexpectedly. Activate a key to create a new output.';
      }
      return 'Reference drone could not start. Activate a key to try again.';
    }
    if (!key || !frequency || snapshot.status === 'stopped') {
      return 'Reference drone stopped.';
    }
    if (snapshot.status === 'starting') {
      return `Starting reference drone ${key.label} at ${frequency}.`;
    }
    if (snapshot.status === 'changing') {
      return `Reference drone changing to ${key.label} at ${frequency}.`;
    }
    if (snapshot.status === 'stopping') {
      return `Stopping reference drone ${key.label}.`;
    }
    return `Reference drone playing ${key.label} at ${frequency}.`;
  })();
  const outsideRange =
    key !== null &&
    snapshot.status !== 'stopped' &&
    snapshot.status !== 'error' &&
    !isMidiVisibleInRange(key.midiNote, range);

  return (
    <div className="reference-drone-status">
      <p role="status" aria-live="polite" aria-label="Reference drone status">
        {statusText}
      </p>
      {outsideRange && (
        <p className="reference-drone-status__outside">
          Reference drone {key.label} is outside the visible graph range.
        </p>
      )}
    </div>
  );
}
