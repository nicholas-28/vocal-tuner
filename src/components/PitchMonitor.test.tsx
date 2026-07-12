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
        history={{ points: [] }}
        summary={emptySummary}
        active={false}
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
        name: 'Live pitch history from C3 to C5 over the last 15 seconds.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('pitch-grid-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('pitch-curve-canvas')).toBeInTheDocument();
    expect(
      screen.getByText('Start the microphone to begin pitch history.'),
    ).toBeInTheDocument();
  });

  it('reports point types and clears without invoking microphone controls', () => {
    const onClear = vi.fn();
    render(
      <PitchMonitor
        history={{
          points: [
            {
              timestampMs: 100,
              midi: 60,
              frequencyHz: 261.63,
              confidence: 0.9,
              kind: 'pitch',
            },
            {
              timestampMs: 500,
              midi: null,
              frequencyHz: null,
              confidence: 0,
              kind: 'gap',
            },
            {
              timestampMs: 1300,
              midi: 61,
              frequencyHz: 277.18,
              confidence: 0.9,
              kind: 'pitch',
            },
          ],
        }}
        summary={{
          totalPoints: 3,
          pitchPoints: 2,
          gapPoints: 1,
          retainedDurationMs: 1200,
          oldestTimestampMs: 100,
          newestTimestampMs: 1300,
          latestKind: 'pitch',
        }}
        active={true}
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
    expect(screen.queryByText(/begin pitch history/)).not.toBeInTheDocument();
  });
});
