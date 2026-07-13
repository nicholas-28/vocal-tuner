import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PitchRangeControls } from './PitchRangeControls';

const callbacks = {
  onSelectPreset: vi.fn(),
  onShiftDown: vi.fn(),
  onShiftUp: vi.fn(),
  onReset: vi.fn(),
};

describe('PitchRangeControls', () => {
  it('exposes presets, selection, shift boundaries, reset, and current label', () => {
    render(
      <PitchRangeControls
        range={{ lowMidi: 48, highMidi: 72 }}
        selectedPresetId="middle"
        canShiftDown
        canShiftUp
        currentMidi={60}
        {...callbacks}
      />,
    );
    expect(
      screen.getByRole('group', { name: 'Visible graph range' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C2–C4' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'C3–C5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Current graph range: C3–C5.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset graph range' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'C2–C4' }));
    expect(callbacks.onSelectPreset).toHaveBeenCalledWith('low');
  });

  it('disables outward shifts at limits and invokes valid actions', () => {
    render(
      <PitchRangeControls
        range={{ lowMidi: 36, highMidi: 60 }}
        selectedPresetId="low"
        canShiftDown={false}
        canShiftUp
        currentMidi={null}
        {...callbacks}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Shift graph down one octave' }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Shift graph up one octave' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset graph range' }));
    expect(callbacks.onShiftUp).toHaveBeenCalled();
    expect(callbacks.onReset).toHaveBeenCalled();
  });

  it('shows above and below status but no message for in-range or absent pitch', () => {
    const { rerender } = render(
      <PitchRangeControls
        range={{ lowMidi: 48, highMidi: 72 }}
        selectedPresetId="middle"
        canShiftDown
        canShiftUp
        currentMidi={47.9}
        {...callbacks}
      />,
    );
    expect(
      screen.getByText('Current pitch is below the visible graph range.'),
    ).toBeInTheDocument();
    rerender(
      <PitchRangeControls
        range={{ lowMidi: 48, highMidi: 72 }}
        selectedPresetId="middle"
        canShiftDown
        canShiftUp
        currentMidi={72.1}
        {...callbacks}
      />,
    );
    expect(
      screen.getByText('Current pitch is above the visible graph range.'),
    ).toBeInTheDocument();
    rerender(
      <PitchRangeControls
        range={{ lowMidi: 48, highMidi: 72 }}
        selectedPresetId="middle"
        canShiftDown
        canShiftUp
        currentMidi={60}
        {...callbacks}
      />,
    );
    expect(screen.queryByText(/Current pitch is (above|below)/)).toBeNull();
  });
});
