import type { ReferenceDroneSnapshot } from '../types/referenceDrone';
import type {
  ReferenceKeyboardState,
  ReferenceKeyPresentation,
} from '../types/referenceKey';

export function createReferenceKeyPresentation(
  midiNote: number,
  keyboard: ReferenceKeyboardState,
  drone: ReferenceDroneSnapshot,
): ReferenceKeyPresentation {
  const isSelected = keyboard.selectedMidi === midiNote;
  const isPreparing =
    drone.pendingMidi === midiNote &&
    (drone.status === 'starting' || drone.status === 'changing');
  const isSounding =
    drone.activeMidi === midiNote &&
    (drone.status === 'playing' || drone.status === 'changing');
  const needsReactivation =
    isSelected && drone.recoveryState === 'needs-reactivation';
  const hasError = isSelected && drone.status === 'error' && !needsReactivation;

  return Object.freeze({
    isPressed: keyboard.pressedMidi === midiNote,
    isSelected,
    isSounding,
    isPreparing,
    needsReactivation,
    hasError,
    isUnavailable: hasError && drone.errorCode === 'unavailable',
  });
}
