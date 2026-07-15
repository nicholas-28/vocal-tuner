import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

function BrokenView(): never {
  throw new Error('render detail for developers');
}

describe('AppErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows a calm production-safe fallback and reload action', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();
    render(
      <AppErrorBoundary reload={reload} showDevelopmentDetail={false}>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', {
        name: 'The application needs to reload',
      }),
    ).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Microphone audio was not uploaded or stored.',
    );
    expect(
      screen.queryByLabelText('Development error detail'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reload application' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('shows limited error detail only when development detail is enabled', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AppErrorBoundary reload={vi.fn()} showDevelopmentDetail>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(screen.getByLabelText('Development error detail')).toHaveTextContent(
      'render detail for developers',
    );
  });
});
