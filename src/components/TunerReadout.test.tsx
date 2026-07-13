import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import { TunerReadout } from './TunerReadout';

describe('TunerReadout', () => {
  it('renders musical pitch and an accessible signed cents indicator', () => {
    const { container } = render(
      <TunerReadout pitch={frequencyToMusicalPitch(442)} />,
    );
    expect(screen.getByLabelText('Current note: A4')).toHaveTextContent('A4');
    expect(screen.getByText('442.0 Hz')).toBeInTheDocument();
    expect(screen.getByText('+7.9 cents')).toBeInTheDocument();
    expect(
      screen.getByRole('meter', { name: 'Cents deviation' }),
    ).toHaveAttribute('aria-valuetext', '+7.9 cents');
    const marker = container.querySelector<HTMLElement>(
      '.tuning-indicator__marker',
    );
    expect(Number.parseFloat(marker?.style.left ?? '')).toBeCloseTo(57.8514, 4);
  });

  it('returns every musical value and the marker to neutral without pitch', () => {
    const { container } = render(<TunerReadout pitch={null} />);
    expect(
      screen.getByLabelText('Current note: unavailable'),
    ).toHaveTextContent('—');
    expect(screen.getByText('— Hz')).toBeInTheDocument();
    expect(screen.getByText('— cents')).toBeInTheDocument();
    expect(
      screen.getByRole('meter', { name: 'Cents deviation' }),
    ).toHaveAttribute('aria-valuenow', '0');
    expect(container.querySelector('.tuning-indicator__marker')).toHaveStyle({
      left: '50%',
    });
  });

  it('marks a retained measurement as briefly uncertain', () => {
    render(
      <TunerReadout
        pitch={frequencyToMusicalPitch(220)}
        continuityStatus="uncertain"
        lastAcceptedAgeMs={67}
      />,
    );
    expect(
      screen.getByText('Briefly uncertain · last measured 67 ms ago'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Current note: A3, briefly uncertain'),
    ).toBeInTheDocument();
  });
});
