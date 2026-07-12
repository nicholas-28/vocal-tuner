import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PitchDiagnostics as Diagnostics } from '../types/pitch';
import { createPitchDetection } from '../test/pitchFixture';
import { PitchDiagnostics } from './PitchDiagnostics';
import { TunerReadout } from './TunerReadout';

describe('pitch diagnostics UI', () => {
  const detected: Diagnostics = {
    state: 'detected',
    cadenceHz: 15,
    detection: createPitchDetection({
      timestampMs: 100,
      frequencyHz: 220.04,
      rawCandidateFrequencyHz: 220.04,
      confidence: 0.96,
      rawConfidence: 0.96,
      rms: 0.1234,
      analysisDurationMs: 1.25,
    }),
  };

  it('shows the raw frequency while preserving note and cents placeholders', () => {
    render(<TunerReadout frequencyHz={220.04} />);
    expect(screen.getByText('220.0 Hz')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Current note: unavailable'),
    ).toHaveTextContent('—');
    expect(screen.getByText('— cents')).toBeInTheDocument();
  });

  it('shows confidence, signal, computation time, cadence, and status', () => {
    render(
      <PitchDiagnostics diagnostics={detected} microphoneState="active" />,
    );
    expect(
      screen.getByRole('status', { name: 'Pitch detector status' }),
    ).toHaveTextContent('Stable input');
    expect(screen.getAllByText('96%')).toHaveLength(2);
    expect(screen.getByText('0.123')).toBeInTheDocument();
    expect(screen.getByText('1.3 ms')).toBeInTheDocument();
    expect(screen.getByText('15.0 Hz')).toBeInTheDocument();
    expect(screen.getByText('4096 / 85.3 ms')).toBeInTheDocument();
  });

  it('shows listening before the first active result', () => {
    render(
      <PitchDiagnostics
        diagnostics={{ state: 'inactive', detection: null, cadenceHz: null }}
        microphoneState="active"
      />,
    );
    expect(
      screen.getByRole('status', { name: 'Pitch detector status' }),
    ).toHaveTextContent('Listening');
  });

  it('shows the exact rejection stage and raw candidate', () => {
    render(
      <PitchDiagnostics
        diagnostics={{
          state: 'low-confidence',
          cadenceHz: 12,
          detection: createPitchDetection({
            frequencyHz: null,
            confidence: 0,
            rawCandidateFrequencyHz: 219.8,
            rawConfidence: 0.62,
            rejectionReason: 'yin-threshold',
          }),
        }}
        microphoneState="active"
      />,
    );
    expect(screen.getByText('219.8 Hz')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(
      screen.getByText('Candidate above YIN threshold'),
    ).toBeInTheDocument();
  });
});
