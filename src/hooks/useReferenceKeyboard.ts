import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  DEFAULT_REFERENCE_FOCUS_MIDI,
  clampReferenceFocusMidi,
  isReferenceKeyVisible,
  resolveReferenceFocusMidi,
} from '../reference/referenceKeyboard';
import type {
  ReferenceFocusCommand,
  ReferenceKeyboardState,
} from '../types/referenceKey';
import type { VisiblePitchRange } from '../types/visiblePitchRange';

function createInitialState(range: VisiblePitchRange): ReferenceKeyboardState {
  return {
    pressedMidi: null,
    selectedMidi: null,
    focusedMidi:
      clampReferenceFocusMidi(DEFAULT_REFERENCE_FOCUS_MIDI, range) ??
      range.lowMidi,
  };
}

export function useReferenceKeyboard(range: VisiblePitchRange) {
  const { lowMidi, highMidi } = range;
  const [state, setState] = useState<ReferenceKeyboardState>(() =>
    createInitialState(range),
  );
  const activePointerIdRef = useRef<number | null>(null);
  const keyboardPressedMidiRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    activePointerIdRef.current = null;
    keyboardPressedMidiRef.current = null;
    setState((current) => ({
      pressedMidi: null,
      selectedMidi:
        current.selectedMidi !== null &&
        isReferenceKeyVisible(current.selectedMidi, { lowMidi, highMidi })
          ? current.selectedMidi
          : null,
      focusedMidi:
        clampReferenceFocusMidi(current.focusedMidi, { lowMidi, highMidi }) ??
        lowMidi,
    }));
  }, [highMidi, lowMidi]);

  const beginPointerPress = useCallback(
    (midiNote: number, pointerId: number): boolean => {
      if (
        activePointerIdRef.current !== null ||
        keyboardPressedMidiRef.current !== null ||
        !isReferenceKeyVisible(midiNote, range)
      ) {
        return false;
      }
      activePointerIdRef.current = pointerId;
      setState((current) => ({
        ...current,
        pressedMidi: midiNote,
        selectedMidi: midiNote,
        focusedMidi: midiNote,
      }));
      return true;
    },
    [range],
  );

  const endPointerPress = useCallback((pointerId: number): boolean => {
    if (activePointerIdRef.current !== pointerId) return false;
    activePointerIdRef.current = null;
    setState((current) => ({ ...current, pressedMidi: null }));
    return true;
  }, []);

  const beginKeyboardPress = useCallback(
    (midiNote: number): boolean => {
      if (
        activePointerIdRef.current !== null ||
        (keyboardPressedMidiRef.current !== null &&
          keyboardPressedMidiRef.current !== midiNote) ||
        !isReferenceKeyVisible(midiNote, range)
      ) {
        return false;
      }
      keyboardPressedMidiRef.current = midiNote;
      setState((current) => ({
        ...current,
        pressedMidi: midiNote,
        selectedMidi: midiNote,
        focusedMidi: midiNote,
      }));
      return true;
    },
    [range],
  );

  const endKeyboardPress = useCallback((midiNote: number): boolean => {
    if (keyboardPressedMidiRef.current !== midiNote) return false;
    keyboardPressedMidiRef.current = null;
    setState((current) => ({ ...current, pressedMidi: null }));
    return true;
  }, []);

  const releaseAll = useCallback(() => {
    activePointerIdRef.current = null;
    keyboardPressedMidiRef.current = null;
    setState((current) =>
      current.pressedMidi === null
        ? current
        : { ...current, pressedMidi: null },
    );
  }, []);

  const moveFocus = useCallback(
    (command: ReferenceFocusCommand) => {
      setState((current) => {
        const focusedMidi = resolveReferenceFocusMidi(
          current.focusedMidi,
          command,
          range,
        );
        return focusedMidi === null || focusedMidi === current.focusedMidi
          ? current
          : { ...current, focusedMidi };
      });
    },
    [range],
  );

  const setFocusedMidi = useCallback(
    (midiNote: number) => {
      if (!isReferenceKeyVisible(midiNote, range)) return;
      setState((current) =>
        current.focusedMidi === midiNote
          ? current
          : { ...current, focusedMidi: midiNote },
      );
    },
    [range],
  );

  return {
    state,
    beginPointerPress,
    endPointerPress,
    beginKeyboardPress,
    endKeyboardPress,
    releaseAll,
    moveFocus,
    setFocusedMidi,
  };
}
