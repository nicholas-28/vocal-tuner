import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CentsMeter } from './CentsMeter';

describe('CentsMeter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('anchors tension at the center and keeps the accessible value bounded', () => {
    const { container } = render(
      <CentsMeter
        rawCents={75}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
      'data-endpoint',
      '100',
    );
    expect(container.querySelector('.cents-meter__center')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      'Pitch is +75.0 cents sharp of the nearest note. Beyond the displayed ±50-cent scale.',
    );
    expect(
      screen.getByText('Sharp · beyond scale', { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it('renders the full scale, in-tune zone, raw classification, and tension', async () => {
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
      expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
        'data-endpoint',
        '54',
      ),
    );
    expect(
      screen.getByRole('meter', { name: 'Nearest-note cents meter' }),
    ).toHaveAttribute(
      'aria-valuetext',
      'Pitch is +4.0 cents, in tune with the nearest note.',
    );
  });

  it.each([
    [-12, 'Flat', '38'],
    [12, 'Sharp', '62'],
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
      expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
        'data-endpoint',
        left,
      ),
    );
  });

  it('freezes and dims the tension during brief uncertainty', async () => {
    const { container, rerender } = render(
      <CentsMeter
        rawCents={10}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    const tension = container.querySelector('.cents-meter__tension');
    await waitFor(() => expect(tension).toHaveAttribute('data-endpoint', '60'));
    rerender(
      <CentsMeter
        rawCents={10}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="uncertain"
      />,
    );
    expect(tension).toHaveAttribute('data-endpoint', '60');
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

  it('keeps the scale but hides the tension when no pitch is present', () => {
    const { container } = render(
      <CentsMeter
        rawCents={null}
        noteMidi={null}
        timestampMs={null}
        continuityStatus="unvoiced"
      />,
    );
    expect(screen.getByText('No pitch', { selector: 'p' })).toBeInTheDocument();
    expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
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
  it.each([-5, 0, 5])(
    'keeps the center calm within the inclusive tolerance (%s)',
    (rawCents) => {
      render(
        <CentsMeter
          rawCents={rawCents}
          noteMidi={69}
          timestampMs={100}
          continuityStatus="voiced"
        />,
      );
      expect(screen.getByRole('meter')).toHaveClass('cents-meter--in-tune');
      expect(
        Number(
          screen
            .getByRole('meter')
            .querySelector('.cents-meter__tension')
            ?.getAttribute('data-endpoint'),
        ),
      ).toBeCloseTo(50 + rawCents, 8);
    },
  );

  it.each([null, NaN, Infinity])(
    'hides held geometry for invalid voiced cents %s',
    (rawCents) => {
      const { container, rerender } = render(
        <CentsMeter
          rawCents={20}
          noteMidi={69}
          timestampMs={100}
          continuityStatus="voiced"
        />,
      );
      rerender(
        <CentsMeter
          rawCents={rawCents}
          noteMidi={69}
          timestampMs={167}
          continuityStatus="voiced"
        />,
      );
      expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
        'data-visible',
        'false',
      );
      expect(screen.getByRole('meter')).not.toHaveAttribute('aria-valuenow');
      expect(screen.getByRole('meter')).not.toHaveClass('cents-meter--in-tune');
    },
  );

  it('does not invent a held displacement when mounted during uncertainty', () => {
    const { container } = render(
      <CentsMeter
        rawCents={10}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="uncertain"
      />,
    );
    expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
      'data-visible',
      'false',
    );
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('Last measured'),
    );
  });

  it('clears immediately on silence even if a caller retains cents', () => {
    const { container, rerender } = render(
      <CentsMeter
        rawCents={0}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    rerender(
      <CentsMeter
        rawCents={0}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="unvoiced"
      />,
    );
    expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
      'data-visible',
      'false',
    );
    expect(screen.getByRole('meter')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('meter')).not.toHaveClass('cents-meter--in-tune');
  });

  it('uses direct accepted updates through zero with reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { container, rerender } = render(
      <CentsMeter
        rawCents={-20}
        noteMidi={69}
        timestampMs={100}
        continuityStatus="voiced"
      />,
    );
    for (const [rawCents, timestampMs] of [
      [0, 167],
      [20, 234],
    ]) {
      rerender(
        <CentsMeter
          rawCents={rawCents}
          noteMidi={69}
          timestampMs={timestampMs}
          continuityStatus="voiced"
        />,
      );
      expect(container.querySelector('.cents-meter__tension')).toHaveAttribute(
        'data-endpoint',
        String(50 + rawCents),
      );
      expect(screen.getByRole('meter')).toHaveAttribute(
        'aria-valuenow',
        String(rawCents),
      );
    }
  });
});
