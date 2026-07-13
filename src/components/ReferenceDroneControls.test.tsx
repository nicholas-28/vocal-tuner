import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialReferenceDroneDiagnostics } from '../audio/referenceDroneConfig';
import type { ReferenceDroneSnapshot } from '../types/referenceDrone';
import { ReferenceDroneControls } from './ReferenceDroneControls';
import { ReferenceDroneDiagnostics } from './ReferenceDroneDiagnostics';
import { ReferenceDroneStatus } from './ReferenceDroneStatus';

const stopped: ReferenceDroneSnapshot = {
  status: 'stopped',
  activeMidi: null,
  frequencyHz: null,
  volume: 0.25,
  errorCode: null,
  diagnostics: createInitialReferenceDroneDiagnostics(),
};

describe('reference drone controls and status', () => {
  it('offers explicit start, stop, volume, and headphone guidance', () => {
    const onStartSelected = vi.fn();
    const onVolumeChange = vi.fn();
    const { rerender } = render(
      <ReferenceDroneControls
        snapshot={stopped}
        selectedMidi={null}
        onStartSelected={onStartSelected}
        onStop={vi.fn()}
        onVolumeChange={onVolumeChange}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Start selected drone' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Stop reference drone' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('slider', { name: 'Reference drone volume' }),
    ).toHaveValue('25');
    expect(screen.getByText(/Headphones are recommended/)).toBeInTheDocument();

    rerender(
      <ReferenceDroneControls
        snapshot={stopped}
        selectedMidi={60}
        onStartSelected={onStartSelected}
        onStop={vi.fn()}
        onVolumeChange={onVolumeChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Start selected drone' }),
    );
    expect(onStartSelected).toHaveBeenCalledWith(60);
    fireEvent.change(
      screen.getByRole('slider', { name: 'Reference drone volume' }),
      { target: { value: '0' } },
    );
    expect(onVolumeChange).toHaveBeenCalledWith(0);
  });

  it('describes playing, outside-range, stopped, and error states', () => {
    const { rerender } = render(
      <ReferenceDroneStatus
        snapshot={{
          ...stopped,
          status: 'playing',
          activeMidi: 69,
          frequencyHz: 440,
        }}
        range={{ lowMidi: 36, highMidi: 60 }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Reference drone playing A4 at 440.0 Hz',
    );
    expect(
      screen.getByText(/A4 is outside the visible graph range/),
    ).toBeVisible();

    rerender(
      <ReferenceDroneStatus
        snapshot={stopped}
        range={{ lowMidi: 48, highMidi: 72 }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Reference drone stopped',
    );
    rerender(
      <ReferenceDroneStatus
        snapshot={{ ...stopped, status: 'error', errorCode: 'unavailable' }}
        range={{ lowMidi: 48, highMidi: 72 }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Reference drone unavailable',
    );
    rerender(
      <ReferenceDroneStatus
        snapshot={{
          ...stopped,
          status: 'error',
          errorCode: 'context-not-running',
        }}
        range={{ lowMidi: 48, highMidi: 72 }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'audio output stayed suspended',
    );
  });

  it('renders compact transition diagnostics without audio-rate state', () => {
    render(
      <ReferenceDroneDiagnostics
        diagnostics={{
          ...createInitialReferenceDroneDiagnostics(),
          contextState: 'running',
          engineState: 'playing',
          voiceState: 'started',
          oscillatorStarted: true,
          graphConnected: true,
          destinationConnected: true,
          midiNote: 60,
          frequencyHz: 261.6256,
          voiceGainTarget: 1,
          masterGain: 0.04,
          effectiveGain: 0.04,
          lastCommand: 'play:60',
        }}
      />,
    );
    expect(screen.getByText('Reference-drone diagnostics')).toBeInTheDocument();
    const values = screen.getByLabelText('Reference-drone diagnostics values');
    expect(values).toHaveTextContent('Contextrunning');
    expect(values).toHaveTextContent('Engineplaying');
    expect(values).toHaveTextContent('Oscillator startedyes');
    expect(values).toHaveTextContent('Frequency261.63 Hz');
    expect(values).toHaveTextContent('Effective gain0.040');
  });
});
