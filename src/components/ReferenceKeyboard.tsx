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
}: ReferenceKeyboardProps) {
  const keys = useMemo(() => generateReferenceKeys(range), [range]);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef(new Map<number, HTMLButtonElement>());
  const hadFocusWithinRef = useRef(false);

  useEffect(() => {
    window.addEventListener('blur', onReleaseAll);
    return () => {
      window.removeEventListener('blur', onReleaseAll);
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
          return (
            <button
              key={key.midiNote}
              ref={(element) => {
                if (element) keyRefs.current.set(key.midiNote, element);
                else keyRefs.current.delete(key.midiNote);
              }}
              type="button"
              className={`reference-key reference-key--${key.kind}`}
              aria-label={`Reference note ${key.label}, ${frequency.replace('Hz', 'hertz')}`}
              aria-pressed={state.selectedMidi === key.midiNote}
              data-midi={key.midiNote}
              data-pressed={state.pressedMidi === key.midiNote || undefined}
              tabIndex={state.focusedMidi === key.midiNote ? 0 : -1}
              onFocus={() => onFocusMidi(key.midiNote)}
              onPointerDown={(event) => {
                event.preventDefault();
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
                  onEndKeyboardPress(key.midiNote);
                }
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
