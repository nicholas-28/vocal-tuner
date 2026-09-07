import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import { TunerReadout } from './TunerReadout';

describe('TunerReadout', () => {
  it('renders musical pitch and an accessible signed cents indicator', () => {
    const { container } = render(
      <TunerReadout
        pitch={frequencyToMusicalPitch(442)}
        measurementTimestampMs={100}
      />,
    );
    expect(screen.getByLabelText('Current note: A4')).toHaveTextContent('A4');
    expect(screen.getByText('Pitch detected')).toBeInTheDocument();
    expect(screen.queryByText('Stable')).not.toBeInTheDocument();
    expect(screen.getByText('442.0 Hz')).toBeInTheDocument();
    expect(screen.getByText('+7.9 cents')).toBeInTheDocument();
    expect(
      screen.getByRole('meter', { name: 'Nearest-note cents meter' }),
    ).toHaveAttribute(
      'aria-valuetext',
      'Pitch is +7.9 cents, in tune with the nearest note.',
    );
    const tension = container.querySelector<SVGElement>(
      '.cents-meter__tension',
    );
    expect(
      Number.parseFloat(tension?.getAttribute('data-endpoint') ?? ''),
    ).toBeCloseTo(57.8514, 4);
  });

  it('returns every musical value and the tension to neutral without pitch', () => {
    const { container } = render(<TunerReadout pitch={null} />);
    expect(
      screen.getByLabelText('Current note: unavailable'),
    ).toHaveTextContent('—');
    expect(screen.getByText('— Hz')).toBeInTheDocument();
    expect(screen.getByText('— cents')).toBeInTheDocument();
    expect(
      screen.getByRole('meter', { name: 'Nearest-note cents meter' }),
    ).not.toHaveAttribute('aria-valuenow');
    expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
      'data-visible',
      'false',
    );
  });

  it('marks a retained measurement as briefly uncertain', () => {
    render(
      <TunerReadout
        pitch={frequencyToMusicalPitch(220)}
        continuityStatus="uncertain"
        lastAcceptedAgeMs={67}
        measurementTimestampMs={100}
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
