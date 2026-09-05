import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  formatReferenceKeyFrequency,
  generateReferenceKeys,
} from '../reference/referenceKeyboard';
import { createReferenceKeyPresentation } from '../reference/referenceKeyPresentation';
import type { ReferenceDroneSnapshot } from '../types/referenceDrone';
import type {
  ReferenceFocusCommand,
  ReferenceKeyboardState,
} from '../types/referenceKey';
import type { VisiblePitchRange } from '../types/visiblePitchRange';

type ReferenceKeyboardProps = {
  range: VisiblePitchRange;
  state: ReferenceKeyboardState;
  onBeginPointerPress: (midiNote: number, pointerId: number) => boolean;
  onEndPointerPress: (pointerId: number) => boolean;
  onBeginKeyboardPress: (midiNote: number) => boolean;
  onEndKeyboardPress: (midiNote: number) => boolean;
  onReleaseAll: () => void;
  onMoveFocus: (command: ReferenceFocusCommand) => void;
  onFocusMidi: (midiNote: number) => void;
  onActivateMidi: (midiNote: number) => void;
  droneSnapshot: ReferenceDroneSnapshot;
  selectionLocked?: boolean;
};

export function ReferenceKeyboard({
  range,
  state,
  onBeginPointerPress,
  onEndPointerPress,
  onBeginKeyboardPress,
  onEndKeyboardPress,
  onReleaseAll,
  onMoveFocus,
  onFocusMidi,
  onActivateMidi,
  droneSnapshot,
  selectionLocked = false,
}: ReferenceKeyboardProps) {
  const keys = useMemo(() => generateReferenceKeys(range), [range]);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef(new Map<number, HTMLButtonElement>());
  const hadFocusWithinRef = useRef(false);
  useEffect(() => {
    const releaseForVisibilityLoss = () => {
      if (document.visibilityState === 'hidden') onReleaseAll();
    };
    window.addEventListener('blur', onReleaseAll);
    window.addEventListener('pagehide', onReleaseAll);
    document.addEventListener('visibilitychange', releaseForVisibilityLoss);
    return () => {
      window.removeEventListener('blur', onReleaseAll);
      window.removeEventListener('pagehide', onReleaseAll);
      document.removeEventListener(
        'visibilitychange',
        releaseForVisibilityLoss,
      );
      onReleaseAll();
    };
  }, [onReleaseAll]);

  useLayoutEffect(() => {
    if (hadFocusWithinRef.current) {
      keyRefs.current.get(state.focusedMidi)?.focus();
    }
  }, [range.highMidi, range.lowMidi, state.focusedMidi]);

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>): void => {
    if (onEndPointerPress(event.pointerId)) {
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture support varies in older mobile browsers.
      }
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    midiNote: number,
  ) => {
    const focusCommands: Partial<Record<string, ReferenceFocusCommand>> = {
      ArrowUp: 'higher',
      ArrowDown: 'lower',
      Home: 'highest',
      End: 'lowest',
    };
    const command = focusCommands[event.key];
    if (command) {
      event.preventDefault();
      onReleaseAll();
      onMoveFocus(command);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) onBeginKeyboardPress(midiNote);
    }
  };

  return (
    <div
      ref={keyboardRef}
      className="reference-keyboard"
      role="group"
      aria-label="Reference keyboard"
      aria-describedby={
        selectionLocked ? 'practice-target-lock-message' : undefined
      }
      onFocusCapture={() => {
        hadFocusWithinRef.current = true;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          hadFocusWithinRef.current = false;
          onReleaseAll();
        }
      }}
    >
      <div className="reference-keyboard__keys">
        {keys.map((key) => {
          const frequency = formatReferenceKeyFrequency(key.idealFrequencyHz);
          const presentation = createReferenceKeyPresentation(
            key.midiNote,
            state,
            droneSnapshot,
          );
          const stateDescription = presentation.isSounding
            ? ', reference drone sounding'
            : presentation.isPreparing
              ? ', reference drone preparing'
              : presentation.needsReactivation
                ? ', reference audio paused by browser'
                : presentation.isUnavailable
                  ? ', reference audio unavailable'
                  : presentation.hasError
                    ? ', reference audio error'
                    : '';
          return (
            <button
              key={key.midiNote}
              ref={(element) => {
                if (element) keyRefs.current.set(key.midiNote, element);
                else keyRefs.current.delete(key.midiNote);
              }}
              type="button"
              className={`reference-key reference-key--${key.kind}`}
              aria-label={`Reference note ${key.label}, ${frequency.replace('Hz', 'hertz')}${stateDescription}`}
              aria-pressed={presentation.isSelected}
              aria-current={presentation.isSounding ? 'true' : undefined}
              aria-disabled={selectionLocked || undefined}
              data-midi={key.midiNote}
              data-pressed={presentation.isPressed || undefined}
              data-preparing={presentation.isPreparing || undefined}
              data-sounding={presentation.isSounding || undefined}
              data-needs-reactivation={
                presentation.needsReactivation || undefined
              }
              data-error={presentation.hasError || undefined}
              tabIndex={state.focusedMidi === key.midiNote ? 0 : -1}
              onFocus={() => onFocusMidi(key.midiNote)}
              onPointerDown={(event) => {
                if (!onBeginPointerPress(key.midiNote, event.pointerId)) return;
                event.currentTarget.focus();
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // The release paths still clean up when capture is unavailable.
                }
              }}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onLostPointerCapture={(event) =>
                onEndPointerPress(event.pointerId)
              }
              onKeyDown={(event) => handleKeyDown(event, key.midiNote)}
              onKeyUp={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (onEndKeyboardPress(key.midiNote)) {
                    if (!selectionLocked) onActivateMidi(key.midiNote);
                  }
                }
              }}
              onClick={() => {
                // Enter/Space cancel their own native click at keydown/keyup.
                // Every independently dispatched click remains an activation,
                // including pointer, assistive, and programmatic clicks.
                if (selectionLocked) return;
                onActivateMidi(key.midiNote);
              }}
            >
              <span aria-hidden="true">{key.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
