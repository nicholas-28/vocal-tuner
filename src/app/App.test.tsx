import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
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
        'Your microphone audio will be processed locally on this device.',
      ),
    ).toBeInTheDocument();
  });
});
