import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { midiNoteToFrequency } from '../music/noteFrequency';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import { TargetPitchGuidance } from './TargetPitchGuidance';

function pitchAtMidi(midi: number) {
  return frequencyToMusicalPitch(midiNoteToFrequency(midi, 440))!;
}

describe('TargetPitchGuidance', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prompts for a target without showing a meter', () => {
    render(
      <TargetPitchGuidance
        selectedMidi={null}
        detectedPitch={null}
        continuityStatus="unvoiced"
        measurementTimestampMs={null}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Target guidance' }),
    ).toBeVisible();
    expect(screen.getByText(/Select a reference note/)).toBeVisible();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('keeps a selected target visible while no pitch is detected', () => {
    render(
      <TargetPitchGuidance
        selectedMidi={69}
        detectedPitch={null}
        continuityStatus="unvoiced"
        measurementTimestampMs={null}
      />,
    );
    expect(screen.getByText('A4 · 440.0 Hz')).toBeVisible();
    expect(screen.getAllByText('No pitch')).toHaveLength(1);
    expect(screen.getByText('No pitch detected.')).toBeVisible();
    expect(screen.queryByText('Raise the pitch')).not.toBeInTheDocument();
  });

  it('shows exact-target identity, direction, and centered meter accessibly', async () => {
    const { container } = render(
      <TargetPitchGuidance
        selectedMidi={69}
        detectedPitch={pitchAtMidi(69)}
        continuityStatus="voiced"
        measurementTimestampMs={100}
      />,
    );
    expect(screen.getByText('On target')).toBeVisible();
    expect(screen.getByText('Within 10 cents of A4')).toBeVisible();
    expect(screen.getByText('Target-note neighborhood')).toBeVisible();
    const meter = screen.getByRole('meter', {
      name: 'Selected-target cents meter',
    });
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(meter).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('On target'),
    );
    await waitFor(() =>
      expect(container.querySelector('.target-meter__marker')).toHaveStyle({
        left: '50%',
      }),
    );
  });

  it.each([
    [68.8, 'Raise the pitch', '20.0 cents below A4'],
    [69.2, 'Lower the pitch', '20.0 cents above A4'],
  ] as const)(
    'uses the correct instruction at MIDI %s',
    async (midi, instruction, distance) => {
      const { container } = render(
        <TargetPitchGuidance
          selectedMidi={69}
          detectedPitch={pitchAtMidi(midi)}
          continuityStatus="voiced"
          measurementTimestampMs={100}
        />,
      );
      expect(screen.getByText(instruction)).toBeVisible();
      expect(screen.getByText(distance)).toBeVisible();
      await waitFor(() => {
        const left = Number.parseFloat(
          (container.querySelector('.target-meter__marker') as HTMLElement)
            .style.left,
        );
        expect(distance.includes('below') ? left < 50 : left > 50).toBe(true);
      });
    },
  );

  it.each([
    [70, 'right', '1 semitone above A4', '50'],
    [68, 'left', '1 semitone below A4', '-50'],
  ] as const)(
    'pins a neighboring note off scale without wrapping',
    async (midi, side, distance, ariaValue) => {
      const { container } = render(
        <TargetPitchGuidance
          selectedMidi={69}
          detectedPitch={pitchAtMidi(midi)}
          continuityStatus="voiced"
          measurementTimestampMs={100}
        />,
      );
      expect(screen.getByText(distance)).toBeVisible();
      expect(screen.getByText('Different note')).toBeVisible();
      const meter = screen.getByRole('meter', {
        name: 'Selected-target cents meter',
      });
      expect(meter).toHaveAttribute('data-off-scale', side);
      expect(meter).toHaveAttribute('aria-valuenow', ariaValue);
      expect(screen.getByText(distance).dataset.targetRelativeCents).toBe(
        midi > 69 ? '100' : '-100',
      );
      await waitFor(() =>
        expect(container.querySelector('.target-meter__marker')).toHaveStyle({
          left: midi > 69 ? '100%' : '0%',
        }),
      );
    },
  );

  it('dims uncertainty while retaining the last accepted measurement', () => {
    const { container } = render(
      <TargetPitchGuidance
        selectedMidi={69}
        detectedPitch={pitchAtMidi(69.15)}
        continuityStatus="uncertain"
        measurementTimestampMs={100}
      />,
    );
    expect(container.querySelector('.target-guidance')).toHaveClass(
      'target-guidance--uncertain',
    );
    expect(screen.getByText(/briefly uncertain/)).toBeVisible();
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('Last measured:'),
    );
  });

  it('exposes reduced-motion mode without removing guidance', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { container } = render(
      <TargetPitchGuidance
        selectedMidi={69}
        detectedPitch={pitchAtMidi(69.2)}
        continuityStatus="voiced"
        measurementTimestampMs={100}
      />,
    );
    expect(container.querySelector('.target-guidance')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );
    expect(screen.getByText('Lower the pitch')).toBeVisible();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });
});
