import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PitchHistoryControls } from './PitchHistoryControls';

describe('PitchHistoryControls', () => {
  it('disables pause before a session and keeps Clear independent', () => {
    render(
      <PitchHistoryControls
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
        sessionActive={false}
        historyEmpty={false}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Pause history' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear history' })).toBeEnabled();
  });

  it('invokes Resume without invoking Clear while paused', () => {
    const onResume = vi.fn();
    const onClear = vi.fn();
    render(
      <PitchHistoryControls
        captureState={{
          status: 'paused',
          accumulatedPausedDurationMs: 1000,
          pauseStartedSourceMs: 2000,
          frozenEffectiveTimeMs: 1000,
        }}
        sessionActive
        historyEmpty
        onPause={vi.fn()}
        onResume={onResume}
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Resume history' }));
    expect(onResume).toHaveBeenCalledOnce();
    expect(onClear).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Clear history' }),
    ).toBeDisabled();
  });

  it('invokes Pause while an active session is recording', () => {
    const onPause = vi.fn();
    render(
      <PitchHistoryControls
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
        sessionActive
        historyEmpty
        onPause={onPause}
        onResume={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pause history' }));
    expect(onPause).toHaveBeenCalledOnce();
  });
});
