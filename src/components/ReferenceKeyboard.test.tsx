import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReferenceKeyboard } from '../hooks/useReferenceKeyboard';
import type { VisiblePitchRange } from '../types/visiblePitchRange';
import { ReferenceKeyboard } from './ReferenceKeyboard';
import { ReferenceNoteStatus } from './ReferenceNoteStatus';

function Harness({ range }: { range: VisiblePitchRange }) {
  const keyboard = useReferenceKeyboard(range);
  return (
    <>
      <ReferenceKeyboard
        range={range}
        state={keyboard.state}
        onBeginPointerPress={keyboard.beginPointerPress}
        onEndPointerPress={keyboard.endPointerPress}
        onBeginKeyboardPress={keyboard.beginKeyboardPress}
        onEndKeyboardPress={keyboard.endKeyboardPress}
        onReleaseAll={keyboard.releaseAll}
        onMoveFocus={keyboard.moveFocus}
        onFocusMidi={keyboard.setFocusedMidi}
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

  it('selects on pointer press and clears only the pressed state on release', () => {
    render(<Harness range={middleRange} />);
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz',
    });
    fireEvent.pointerDown(c4, { pointerId: 7 });
    expect(c4).toHaveAttribute('data-pressed', 'true');
    expect(c4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'Reference key pressed: C4, 261.6 Hz',
    );
    fireEvent.pointerUp(c4, { pointerId: 7 });
    expect(c4).not.toHaveAttribute('data-pressed');
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
});
