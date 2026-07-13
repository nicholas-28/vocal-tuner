import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CentsMeter } from './CentsMeter';

describe('CentsMeter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the full scale, in-tune zone, raw classification, and marker', async () => {
    const { container } = render(
      <CentsMeter
        rawCents={4}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    expect(screen.getByText('In tune', { selector: 'p' })).toBeInTheDocument();
    for (const label of ['-50', '-25', '0', '+25', '+50'])
      expect(screen.getByText(label)).toBeInTheDocument();
    expect(
      container.querySelector('.cents-meter__in-tune-zone'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(container.querySelector('.cents-meter__marker')).toHaveStyle({
        left: '54%',
      }),
    );
    expect(
      screen.getByRole('meter', { name: 'Nearest-note cents meter' }),
    ).toHaveAttribute(
      'aria-valuetext',
      'Pitch is +4.0 cents, in tune with the nearest note.',
    );
  });

  it.each([
    [-12, 'Flat', '38%'],
    [12, 'Sharp', '62%'],
  ] as const)('shows %s raw cents as %s', async (rawCents, label, left) => {
    const { container } = render(
      <CentsMeter
        rawCents={rawCents}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    expect(screen.getByText(label, { selector: 'p' })).toBeInTheDocument();
    await waitFor(() =>
      expect(container.querySelector('.cents-meter__marker')).toHaveStyle({
        left,
      }),
    );
  });

  it('freezes and dims the marker during brief uncertainty', async () => {
    const { container, rerender } = render(
      <CentsMeter
        rawCents={10}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    const marker = container.querySelector('.cents-meter__marker');
    await waitFor(() => expect(marker).toHaveStyle({ left: '60%' }));
    rerender(
      <CentsMeter
        rawCents={10}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="uncertain"
      />,
    );
    expect(marker).toHaveStyle({ left: '60%' });
    expect(container.querySelector('.cents-meter')).toHaveClass(
      'cents-meter--uncertain',
    );
    expect(
      screen.getByRole('meter', { name: 'Nearest-note cents meter' }),
    ).toHaveAttribute(
      'aria-valuetext',
      'Last measured pitch was +10.0 cents sharp of the nearest note and is briefly uncertain.',
    );
  });

  it('keeps the scale but hides the marker when no pitch is present', () => {
    const { container } = render(
      <CentsMeter
        rawCents={null}
        noteMidi={null}
        timestampMs={null}
        continuityStatus="unvoiced"
      />,
    );
    expect(screen.getByText('No pitch', { selector: 'p' })).toBeInTheDocument();
    expect(container.querySelector('.cents-meter__marker')).toHaveAttribute(
      'data-visible',
      'false',
    );
    expect(
      screen.getByRole('meter', { name: 'Nearest-note cents meter' }),
    ).toHaveAttribute('aria-valuetext', 'No pitch detected.');
  });

  it('exposes reduced-motion mode without removing meter information', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { container } = render(
      <CentsMeter
        rawCents={20}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    expect(container.querySelector('.cents-meter')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );
    expect(screen.getByText('Sharp', { selector: 'p' })).toBeInTheDocument();
  });
});
