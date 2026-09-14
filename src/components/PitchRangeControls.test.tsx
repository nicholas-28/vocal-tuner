import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PitchRangeControls,
  PitchRangePositionControls,
} from './PitchRangeControls';

describe('compact pitch viewport controls', () => {
  it('exposes span, explicit centering and reset without fixed octave presets', () => {
    const onZoom = vi.fn(),
      onCenter = vi.fn(),
      onReset = vi.fn();
    render(
      <>
        <PitchRangeControls
          range={{ lowMidi: 48, highMidi: 72 }}
          currentMidi={69.2}
          onZoom={onZoom}
          onCenter={onCenter}
        />
        <PitchRangePositionControls
          range={{ lowMidi: 48, highMidi: 72 }}
          onCenter={onCenter}
          onReset={onReset}
        />
      </>,
    );
    expect(screen.getByLabelText('Pitch span')).toHaveValue('24');
    fireEvent.change(screen.getByLabelText('Pitch span'), {
      target: { value: '12' },
    });
    expect(onZoom).toHaveBeenCalledWith(12);
    fireEvent.click(screen.getByRole('button', { name: 'Center my voice' }));
    expect(onCenter).toHaveBeenCalledWith(69.2);
    fireEvent.change(screen.getByLabelText('Graph center note'), {
      target: { value: '48' },
    });
    expect(onCenter).toHaveBeenCalledWith(48);
    fireEvent.click(screen.getByRole('button', { name: 'Reset graph range' }));
    expect(onReset).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole('button', { name: 'C2–C4' }),
    ).not.toBeInTheDocument();
  });
  it('disables centering without evidence and reports pitch outside the view', () => {
    const props = {
      range: { lowMidi: 48, highMidi: 72 },
      onZoom: vi.fn(),
      onCenter: vi.fn(),
      onReset: vi.fn(),
    };
    const view = render(<PitchRangeControls {...props} currentMidi={null} />);
    expect(
      screen.getByRole('button', { name: 'Center my voice' }),
    ).toBeDisabled();
    view.rerender(<PitchRangeControls {...props} currentMidi={47.9} />);
    expect(
      screen.getByText('Current pitch is below the visible graph range.'),
    ).toBeVisible();
    view.rerender(<PitchRangeControls {...props} currentMidi={72.1} />);
    expect(
      screen.getByText('Current pitch is above the visible graph range.'),
    ).toBeVisible();
  });
});
