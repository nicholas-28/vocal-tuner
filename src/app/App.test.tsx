import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
  });

  it('renders the initial tuner placeholders', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Vocal Tuner' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Current note: unavailable'),
    ).toHaveTextContent('—');
    expect(screen.getByText('— Hz')).toBeInTheDocument();
    expect(screen.getByText('— cents')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start microphone' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your microphone audio is processed locally on this device and is not uploaded.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Microphone status' }),
    ).toHaveTextContent('Microphone inactive');
    expect(
      screen.getByRole('meter', { name: 'Microphone input level' }),
    ).toHaveAttribute('aria-valuenow', '0');
    expect(
      screen.getByRole('button', { name: 'Clear history' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Pause history' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'C3–C5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Reset graph range' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('img', {
        name: 'Live pitch history from C3 to C5 over the last 15 seconds.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('pitch-curve-canvas')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reference note A4, 440.0 hertz' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'No reference note selected',
    );
    expect(
      screen.getByText('Start the microphone to begin pitch history.'),
    ).toBeInTheDocument();
  });

  it('shows an accessible unsupported state', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start microphone' }));

    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: 'Microphone status' }),
      ).toHaveTextContent('Microphone unsupported'),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This browser does not support microphone access.',
    );
    expect(
      screen.getByRole('button', { name: 'Start microphone' }),
    ).toBeEnabled();
  });

  it('disables the control and changes its label while requesting', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(() => new Promise(() => undefined)) },
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start microphone' }));

    const button = await screen.findByRole('button', {
      name: 'Allow microphone…',
    });
    expect(button).toBeDisabled();
    expect(
      screen.getByRole('status', { name: 'Microphone status' }),
    ).toHaveTextContent('Requesting access');
  });

  it('changes and resets graph range without touching microphone state', () => {
    render(<App />);
    const c5 = screen.getByRole('button', {
      name: 'Reference note C5, 523.3 hertz',
    });
    fireEvent.pointerDown(c5, { pointerId: 1 });
    fireEvent.pointerUp(c5, { pointerId: 1 });
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'Reference note selected: C5',
    );
    fireEvent.click(screen.getByRole('button', { name: 'C2–C4' }));
    expect(screen.getByRole('button', { name: 'C2–C4' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('img', {
        name: 'Live pitch history from C2 to C4 over the last 15 seconds.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Microphone status' }),
    ).toHaveTextContent('Microphone inactive');
    expect(
      screen.getByRole('button', { name: 'Reference note C2, 65.4 hertz' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Reference note status')).toHaveTextContent(
      'No reference note selected',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset graph range' }));
    expect(screen.getByRole('button', { name: 'C3–C5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
