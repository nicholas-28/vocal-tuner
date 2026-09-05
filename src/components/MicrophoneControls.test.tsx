import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MicrophoneControls, MicrophoneStatus } from './MicrophoneControls';

describe('microphone UI', () => {
  it.each([
    ['idle', 'Start microphone', false],
    ['requesting', 'Allow microphone…', true],
    ['active', 'Stop microphone', false],
    ['stopping', 'Stopping microphone…', true],
    ['denied', 'Start microphone', false],
    ['unsupported', 'Start microphone', false],
    ['no-device', 'Start microphone', false],
    ['error', 'Start microphone', false],
  ] as const)('renders the %s control state', (state, label, disabled) => {
    render(
      <MicrophoneControls state={state} onStart={vi.fn()} onStop={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: label });
    expect(button).toHaveProperty('disabled', disabled);
  });

  it('uses stop only for the active state', () => {
    const onStart = vi.fn();
    const onStop = vi.fn();
    render(
      <MicrophoneControls state="active" onStart={onStart} onStop={onStop} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Stop microphone' }));
    expect(onStop).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('announces status and exposes the normalized input level', () => {
    render(<MicrophoneStatus state="active" inputLevel={0.25} />);
    expect(
      screen.getByRole('status', { name: 'Microphone status' }),
    ).toHaveTextContent('Microphone active');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0.25');
  });
  it('can cancel acquisition while the permission request is pending', () => {
    const onStop = vi.fn();
    const onStart = vi.fn();
    render(
      <MicrophoneControls
        state="requesting"
        onStart={onStart}
        onStop={onStop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel microphone' }));
    expect(onStop).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });
});
