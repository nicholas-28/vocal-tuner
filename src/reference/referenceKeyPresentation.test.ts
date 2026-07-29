import { describe, expect, it } from 'vitest';
import { createInitialReferenceDroneDiagnostics } from '../audio/referenceDroneConfig';
import type { ReferenceDroneSnapshot } from '../types/referenceDrone';
import type { ReferenceKeyboardState } from '../types/referenceKey';
import { createReferenceKeyPresentation } from './referenceKeyPresentation';

const keyboard: ReferenceKeyboardState = {
  pressedMidi: null,
  selectedMidi: 60,
  focusedMidi: 60,
};

function snapshot(
  values: Partial<ReferenceDroneSnapshot>,
): ReferenceDroneSnapshot {
  return {
    status: 'stopped',
    activeMidi: null,
    pendingMidi: null,
    frequencyHz: null,
    volume: 0.25,
    errorCode: null,
    recoveryState: 'ready',
    diagnostics: createInitialReferenceDroneDiagnostics(),
    ...values,
  };
}

describe('reference key presentation', () => {
  it('keeps selected, pressed, preparing, and sounding independent', () => {
    expect(
      createReferenceKeyPresentation(60, keyboard, snapshot({})),
    ).toMatchObject({ isSelected: true, isPressed: false, isSounding: false });
    expect(
      createReferenceKeyPresentation(
        60,
        { ...keyboard, pressedMidi: 60 },
        snapshot({ pendingMidi: 60, status: 'starting' }),
      ),
    ).toMatchObject({
      isSelected: true,
      isPressed: true,
      isPreparing: true,
      isSounding: false,
    });
    expect(
      createReferenceKeyPresentation(
        60,
        keyboard,
        snapshot({ activeMidi: 60, status: 'playing' }),
      ),
    ).toMatchObject({ isSelected: true, isPreparing: false, isSounding: true });
  });

  it('retains the previous sounding note while a change prepares', () => {
    const changing = snapshot({
      activeMidi: 60,
      pendingMidi: 69,
      status: 'changing',
    });
    expect(
      createReferenceKeyPresentation(60, keyboard, changing),
    ).toMatchObject({ isSounding: true, isPreparing: false });
    expect(
      createReferenceKeyPresentation(
        69,
        { ...keyboard, selectedMidi: 69 },
        changing,
      ),
    ).toMatchObject({ isSounding: false, isPreparing: true });
  });

  it('never presents reactivation or failure as sounding', () => {
    expect(
      createReferenceKeyPresentation(
        60,
        keyboard,
        snapshot({
          status: 'error',
          errorCode: 'context-interrupted',
          recoveryState: 'needs-reactivation',
        }),
      ),
    ).toMatchObject({
      needsReactivation: true,
      hasError: false,
      isSounding: false,
    });
    expect(
      createReferenceKeyPresentation(
        60,
        keyboard,
        snapshot({ status: 'error', errorCode: 'unavailable' }),
      ),
    ).toMatchObject({ hasError: true, isUnavailable: true, isSounding: false });
  });
});
