import { fireEvent, render, screen } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createReferenceDroneEngine } from '../audio/referenceDroneEngine';
import { useReferenceKeyboard } from '../hooks/useReferenceKeyboard';
import type { ReferenceDroneSnapshot } from '../types/referenceDrone';
import type { VisiblePitchRange } from '../types/visiblePitchRange';
import { ReferenceKeyboard } from './ReferenceKeyboard';
import { ReferenceNoteStatus } from './ReferenceNoteStatus';

const stoppedDroneSnapshot = createReferenceDroneEngine({
  contextFactory: () => {
    throw new Error('The keyboard test must not create audio output.');
  },
}).getSnapshot();
const noop = () => undefined;

function Harness({
  range,
  activeDroneMidi = null,
  onActivateMidi = () => undefined,
  selectionLocked = false,
  droneSnapshot = {},
  onReleaseAllObserved = noop,
}: {
  range: VisiblePitchRange;
  activeDroneMidi?: number | null;
  onActivateMidi?: (midiNote: number) => void;
  selectionLocked?: boolean;
  droneSnapshot?: Partial<ReferenceDroneSnapshot>;
  onReleaseAllObserved?: () => void;
}) {
  const keyboard = useReferenceKeyboard(range);
  const releaseKeyboard = keyboard.releaseAll;
  const releaseAll = useCallback(() => {
    releaseKeyboard();
    onReleaseAllObserved();
  }, [onReleaseAllObserved, releaseKeyboard]);
  const activateMidi = (midiNote: number) => {
    keyboard.selectMidi(midiNote);
    onActivateMidi(midiNote);
  };
  return (
    <>
      <ReferenceKeyboard
        range={range}
        state={keyboard.state}
        onBeginPointerPress={keyboard.beginPointerPress}
        onEndPointerPress={keyboard.endPointerPress}
        onBeginKeyboardPress={keyboard.beginKeyboardPress}
        onEndKeyboardPress={keyboard.endKeyboardPress}
        onReleaseAll={releaseAll}
        onMoveFocus={keyboard.moveFocus}
        onFocusMidi={keyboard.setFocusedMidi}
        onActivateMidi={activateMidi}
        droneSnapshot={{
          ...stoppedDroneSnapshot,
          status: activeDroneMidi === null ? 'stopped' : 'playing',
          activeMidi: activeDroneMidi,
          ...droneSnapshot,
        }}
        selectionLocked={selectionLocked}
      />
      <ReferenceNoteStatus state={keyboard.state} />
    </>
  );
}

const middleRange = { lowMidi: 48, highMidi: 72 };

describe('ReferenceKeyboard', () => {
  it('renders one accessible roving-tab key per visible MIDI note', () => {
    render(<Harness range={middleRange} />);
    const keyboard = screen.getByRole('group', { name: 'Reference keyboard' });
    const keys = Array.from(keyboard.querySelectorAll('button'));
    expect(keys).toHaveLength(25);
    expect(keys[0]).toHaveAccessibleName('Reference note C5, 523.3 hertz');
    expect(keys.at(-1)).toHaveAccessibleName('Reference note C3, 130.8 hertz');
    expect(keys.filter((key) => key.tabIndex === 0)).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Reference note C4, 261.6 hertz' }),
    ).toHaveAttribute('tabindex', '0');
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'No reference note selected',
    );
  });

  it('selects on completed pointer activation and clears pressed state', () => {
    render(<Harness range={middleRange} />);
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz',
    });
    fireEvent.pointerDown(c4, { pointerId: 7 });
    expect(c4).toHaveAttribute('data-pressed', 'true');
    expect(c4).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'Reference key pressed: C4, 261.6 Hz',
    );
    fireEvent.pointerUp(c4, { pointerId: 7 });
    expect(c4).not.toHaveAttribute('data-pressed');
    expect(c4).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(c4);
    expect(c4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'Reference note selected: C4, 261.6 Hz',
    );
  });

  it('supports roving focus, boundaries, and keyboard press lifecycle', () => {
    render(<Harness range={middleRange} />);
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz',
    });
    c4.focus();
    fireEvent.keyDown(c4, { key: 'ArrowUp' });
    const cSharp4 = screen.getByRole('button', {
      name: 'Reference note C#4, 277.2 hertz',
    });
    expect(cSharp4).toHaveFocus();
    fireEvent.keyDown(cSharp4, { key: ' ' });
    expect(cSharp4).toHaveAttribute('data-pressed', 'true');
    fireEvent.keyUp(cSharp4, { key: ' ' });
    expect(cSharp4).not.toHaveAttribute('data-pressed');
    expect(cSharp4).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(cSharp4, { key: 'Home' });
    expect(
      screen.getByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
    ).toHaveFocus();
  });

  it('activates exactly once and keeps sounding distinct from pressed', () => {
    const onActivateMidi = vi.fn();
    const { rerender } = render(
      <Harness range={middleRange} onActivateMidi={onActivateMidi} />,
    );
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz',
    });
    fireEvent.pointerDown(c4, { pointerId: 12 });
    fireEvent.pointerUp(c4, { pointerId: 12 });
    fireEvent.click(c4, { detail: 1 });
    expect(onActivateMidi).toHaveBeenCalledOnce();
    expect(c4).not.toHaveAttribute('data-pressed');

    rerender(
      <Harness
        range={middleRange}
        activeDroneMidi={60}
        onActivateMidi={onActivateMidi}
      />,
    );
    const soundingC4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz, reference drone sounding',
    });
    expect(soundingC4).toHaveAttribute('data-sounding', 'true');
    expect(soundingC4).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(soundingC4, { key: 'Enter', repeat: false });
    fireEvent.keyUp(soundingC4, { key: 'Enter' });
    fireEvent.click(soundingC4);
    expect(onActivateMidi).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(soundingC4, { key: ' ', repeat: false });
    fireEvent.keyUp(soundingC4, { key: ' ' });
    fireEvent.click(soundingC4);
    expect(onActivateMidi).toHaveBeenCalledTimes(3);
  });

  it('releases on cancellation, lost capture, blur, and range change', () => {
    const { rerender } = render(<Harness range={middleRange} />);
    const c5 = screen.getByRole('button', {
      name: 'Reference note C5, 523.3 hertz',
    });
    fireEvent.pointerDown(c5, { pointerId: 3 });
    fireEvent.pointerCancel(c5, { pointerId: 3 });
    expect(c5).not.toHaveAttribute('data-pressed');
    fireEvent.pointerDown(c5, { pointerId: 4 });
    fireEvent.lostPointerCapture(c5, { pointerId: 4 });
    expect(c5).not.toHaveAttribute('data-pressed');
    fireEvent.keyDown(c5, { key: 'Enter' });
    fireEvent.blur(window);
    expect(c5).not.toHaveAttribute('data-pressed');

    fireEvent.keyDown(c5, { key: 'Enter' });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));
    expect(c5).not.toHaveAttribute('data-pressed');

    fireEvent.pointerDown(c5, { pointerId: 5 });
    rerender(<Harness range={{ lowMidi: 36, highMidi: 60 }} />);
    expect(
      screen.queryByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'No reference note selected',
    );
    expect(
      screen.getByRole('button', { name: 'Reference note C4, 261.6 hertz' }),
    ).toHaveFocus();
  });

  it('renders deterministic preparing and recovery states for natural and accidental keys', () => {
    const { rerender } = render(
      <Harness
        range={middleRange}
        droneSnapshot={{ status: 'starting', pendingMidi: 60 }}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reference note C4, 261.6 hertz, reference drone preparing',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Reference note C4, 261.6 hertz, reference drone preparing',
      }),
    ).toHaveAttribute('data-preparing', 'true');

    rerender(
      <Harness
        range={middleRange}
        droneSnapshot={{
          status: 'error',
          pendingMidi: null,
          errorCode: 'context-interrupted',
          recoveryState: 'needs-reactivation',
        }}
      />,
    );
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz, reference audio paused by browser',
    });
    expect(c4).toHaveAttribute('data-needs-reactivation', 'true');
    expect(c4).not.toHaveAttribute('data-sounding');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reference note C#4, 277.2 hertz',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Reference note C#4, 277.2 hertz, reference audio paused by browser',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps focus navigation but blocks target activation while locked', () => {
    const onActivateMidi = vi.fn();
    render(
      <Harness
        range={middleRange}
        selectionLocked
        onActivateMidi={onActivateMidi}
      />,
    );
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz',
    });
    expect(c4).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(c4);
    expect(onActivateMidi).not.toHaveBeenCalled();
    expect(c4).toHaveAttribute('aria-pressed', 'false');
    c4.focus();
    fireEvent.keyDown(c4, { key: 'ArrowUp' });
    expect(
      screen.getByRole('button', {
        name: 'Reference note C#4, 277.2 hertz',
      }),
    ).toHaveFocus();
  });

  it('releases transient press state during unmount cleanup', () => {
    const onReleaseAllObserved = vi.fn();
    const { unmount } = render(
      <Harness
        range={middleRange}
        onReleaseAllObserved={onReleaseAllObserved}
      />,
    );
    fireEvent.pointerDown(
      screen.getByRole('button', {
        name: 'Reference note C4, 261.6 hertz',
      }),
      { pointerId: 51 },
    );

    unmount();

    expect(onReleaseAllObserved).toHaveBeenCalled();
  });
});
