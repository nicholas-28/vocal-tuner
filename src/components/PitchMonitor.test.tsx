import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PitchHistorySummary } from '../types/pitchHistory';
import { PitchMonitor } from './PitchMonitor';

const emptySummary: PitchHistorySummary = {
  totalPoints: 0,
  pitchPoints: 0,
  gapPoints: 0,
  retainedDurationMs: 0,
  oldestTimestampMs: null,
  newestTimestampMs: null,
  latestKind: null,
};

describe('PitchMonitor history diagnostics', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  it('shows an empty summary and disabled clear control', () => {
    render(
      <PitchMonitor
        summary={emptySummary}
        durationMs={15_000}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Pitch history summary')).toHaveTextContent(
      'Maximum15 s',
    );
    expect(
      screen.getByRole('button', { name: 'Clear history' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('img', {
        name: 'Pitch grid from C3 to C5. Live pitch curve is not yet displayed.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('pitch-grid-canvas')).toBeInTheDocument();
    expect(
      screen.getByText('Pitch curve will be added in Issue 008.'),
    ).toBeInTheDocument();
  });

  it('reports point types and clears without invoking microphone controls', () => {
    const onClear = vi.fn();
    render(
      <PitchMonitor
        summary={{
          totalPoints: 3,
          pitchPoints: 2,
          gapPoints: 1,
          retainedDurationMs: 1200,
          oldestTimestampMs: 100,
          newestTimestampMs: 1300,
          latestKind: 'pitch',
        }}
        durationMs={15_000}
        onClear={onClear}
      />,
    );
    expect(screen.getByLabelText('Pitch history summary')).toHaveTextContent(
      '2 / 1',
    );
    expect(screen.getByLabelText('Pitch history summary')).toHaveTextContent(
      '0–1200 ms',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
