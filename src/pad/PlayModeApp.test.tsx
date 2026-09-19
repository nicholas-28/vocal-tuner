import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayModeApp } from './PlayModeApp';

describe('PlayModeApp', () => {
  it('renders the isolated play mode placeholder', () => {
    render(<PlayModeApp />);

    expect(
      screen.getByRole('heading', { name: 'Play Mode' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  });
});
