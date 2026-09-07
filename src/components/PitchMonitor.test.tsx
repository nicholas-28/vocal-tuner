import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import type { PitchHistorySummary } from '../types/pitchHistory';
import {
  installReferenceDroneAudioMock,
  TestReferenceDroneAudioContext,
} from '../test/referenceDroneAudioMock';
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

const defaultRangeProps = {
  visibleRange: { lowMidi: 48, highMidi: 72 },
  selectedRangePresetId: 'middle' as const,
  canShiftRangeDown: true,
  canShiftRangeUp: true,
  currentMidi: null,
  onSelectRangePreset: vi.fn(),
  onShiftRangeDown: vi.fn(),
  onShiftRangeUp: vi.fn(),
  onResetRange: vi.fn(),
  detectedPitch: null,
  continuityStatus: 'unvoiced' as const,
  measurementTimestampMs: null,
  observationTimestampMs: null,
};

describe('PitchMonitor history diagnostics', () => {
  beforeEach(() => {
    installReferenceDroneAudioMock();
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
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
        sessionVersion={0}
        toEffectiveTimestamp={(timestamp) => timestamp}
        durationMs={15_000}
        onClear={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        {...defaultRangeProps}
      />,
    );
    expect(screen.getByLabelText('Pitch history summary')).toHaveTextContent(
      'Maximum15 s',
    );
    expect(
      screen.getByRole('button', { name: 'Clear history' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Pause history' }),
    ).toBeDisabled();
    expect(screen.getByLabelText('Pitch history status')).toHaveTextContent(
      'History inactive',
    );
    expect(
      screen.getByRole('img', {
        name: 'Live pitch history from C3 to C5 over the last 15 seconds.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('pitch-grid-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('pitch-curve-canvas')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Reference keyboard' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reference note C3, 130.8 hertz' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Start the microphone to begin pitch history.'),
    ).toBeInTheDocument();
  });

  it('creates and starts audio exactly once on completed activation, not focus or press', async () => {
    render(
      <PitchMonitor
        history={{ points: [] }}
        summary={emptySummary}
        active={false}
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
        sessionVersion={0}
        toEffectiveTimestamp={(timestamp) => timestamp}
        durationMs={15_000}
        onClear={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        {...defaultRangeProps}
      />,
    );
    const c4 = screen.getByRole('button', {
      name: 'Reference note C4, 261.6 hertz',
    });
    c4.focus();
    fireEvent.keyDown(c4, { key: 'ArrowUp' });
    expect(TestReferenceDroneAudioContext.instances).toHaveLength(0);
    fireEvent.pointerDown(c4, { pointerId: 5, pointerType: 'touch' });
    fireEvent.pointerUp(c4, { pointerId: 5, pointerType: 'touch' });
    expect(TestReferenceDroneAudioContext.instances).toHaveLength(0);
    fireEvent.click(c4);
    expect(TestReferenceDroneAudioContext.instances).toHaveLength(1);
    expect(
      TestReferenceDroneAudioContext.instances[0]?.oscillators,
    ).toHaveLength(1);
    expect(
      TestReferenceDroneAudioContext.instances[0]?.oscillators[0]?.started,
    ).toBe(true);
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'playing C4',
      ),
    );
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
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
        sessionVersion={1}
        toEffectiveTimestamp={(timestamp) => timestamp}
        durationMs={15_000}
        onClear={onClear}
        onPause={vi.fn()}
        onResume={vi.fn()}
        {...defaultRangeProps}
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
    expect(screen.getByLabelText('Pitch history summary')).toHaveTextContent(
      'Capturerecording',
    );
  });

  it('announces paused history and describes the frozen graph', () => {
    render(
      <PitchMonitor
        history={{ points: [] }}
        summary={emptySummary}
        active
        captureState={{
          status: 'paused',
          accumulatedPausedDurationMs: 5000,
          pauseStartedSourceMs: 6000,
          frozenEffectiveTimeMs: 1000,
        }}
        sessionVersion={1}
        toEffectiveTimestamp={() => 1000}
        durationMs={15_000}
        onClear={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        {...defaultRangeProps}
      />,
    );
    expect(screen.getByLabelText('Pitch history status')).toHaveTextContent(
      'History paused',
    );
    expect(
      screen.getByRole('button', { name: 'Resume history' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('img', {
        name: 'Pitch history paused. Showing the last captured 15 seconds from C3 to C5.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('History is paused.')).toBeInTheDocument();
  });

  it('updates the shared graph description without changing history diagnostics', () => {
    render(
      <PitchMonitor
        history={{ points: [] }}
        summary={emptySummary}
        active={false}
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
        sessionVersion={0}
        toEffectiveTimestamp={(timestamp) => timestamp}
        durationMs={15_000}
        onClear={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        {...defaultRangeProps}
        visibleRange={{ lowMidi: 36, highMidi: 60 }}
        selectedRangePresetId="low"
      />,
    );
    expect(
      screen.getByRole('img', {
        name: 'Live pitch history from C2 to C4 over the last 15 seconds.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Pitch history summary')).toHaveTextContent(
      'Total0',
    );
    expect(
      screen.getByRole('button', { name: 'Reference note C2, 65.4 hertz' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
    ).not.toBeInTheDocument();
  });

  it('keeps reference selection independent from Clear, Pause, and Stop', async () => {
    const onClear = vi.fn();
    const history = {
      points: [
        {
          timestampMs: 100,
          midi: 69,
          frequencyHz: 440,
          confidence: 0.95,
          kind: 'pitch' as const,
        },
      ],
    };
    const summary = {
      ...emptySummary,
      totalPoints: 1,
      pitchPoints: 1,
      retainedDurationMs: 0,
      oldestTimestampMs: 100,
      newestTimestampMs: 100,
      latestKind: 'pitch' as const,
    };
    const sharedProps = {
      history,
      summary,
      sessionVersion: 1,
      toEffectiveTimestamp: (timestamp: number) => timestamp,
      durationMs: 15_000,
      onClear,
      onPause: vi.fn(),
      onResume: vi.fn(),
      ...defaultRangeProps,
    };
    const { rerender } = render(
      <PitchMonitor
        {...sharedProps}
        active
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
      />,
    );
    const a4 = screen.getByRole('button', {
      name: 'Reference note A4, 440.0 hertz',
    });
    fireEvent.pointerDown(a4, { pointerId: 9 });
    fireEvent.pointerUp(a4, { pointerId: 9 });
    fireEvent.click(a4);
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'Reference drone playing A4 at 440.0 Hz',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(a4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
      'Reference drone playing A4 at 440.0 Hz',
    );
    expect(screen.getByText('A4 · 440.0 Hz')).toBeInTheDocument();
    expect(screen.getByText('No pitch detected.')).toBeInTheDocument();

    rerender(
      <PitchMonitor
        {...sharedProps}
        active
        captureState={{
          status: 'paused',
          accumulatedPausedDurationMs: 0,
          pauseStartedSourceMs: 100,
          frozenEffectiveTimeMs: 100,
        }}
      />,
    );
    expect(a4).toHaveAttribute('aria-pressed', 'true');
    rerender(
      <PitchMonitor
        {...sharedProps}
        active={false}
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
      />,
    );
    expect(a4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
      'Reference drone playing A4 at 440.0 Hz',
    );

    rerender(
      <PitchMonitor
        {...sharedProps}
        active
        captureState={{
          status: 'recording',
          accumulatedPausedDurationMs: 0,
          resumeBoundaryEffectiveMs: null,
        }}
      />,
    );
    expect(a4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('A4 · 440.0 Hz')).toBeInTheDocument();
  });

  it('keeps target guidance independent from drone playback and visible range', async () => {
    const sharedProps = {
      history: { points: [] },
      summary: emptySummary,
      active: false,
      captureState: {
        status: 'recording' as const,
        accumulatedPausedDurationMs: 0,
        resumeBoundaryEffectiveMs: null,
      },
      sessionVersion: 0,
      toEffectiveTimestamp: (timestamp: number) => timestamp,
      durationMs: 15_000,
      onClear: vi.fn(),
      onPause: vi.fn(),
      onResume: vi.fn(),
      ...defaultRangeProps,
      detectedPitch: frequencyToMusicalPitch(440),
      continuityStatus: 'voiced' as const,
      measurementTimestampMs: 100,
    };
    const { rerender } = render(<PitchMonitor {...sharedProps} />);
    const a4 = screen.getByRole('button', {
      name: 'Reference note A4, 440.0 hertz',
    });
    fireEvent.click(a4);
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'Reference drone playing A4 at 440.0 Hz',
      ),
    );
    expect(screen.getByText('On target')).toBeInTheDocument();

    fireEvent.click(a4);
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'Reference drone stopped',
      ),
    );
    expect(a4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('On target')).toBeInTheDocument();

    rerender(
      <PitchMonitor
        {...sharedProps}
        visibleRange={{ lowMidi: 36, highMidi: 60 }}
        selectedRangePresetId="low"
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Reference note A4, 440.0 hertz' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('A4 · 440.0 Hz')).toHaveLength(2);
    expect(screen.getByText('On target')).toBeInTheDocument();
  });

  it('keeps practice independent from history and drone and auto-pauses on microphone Stop', async () => {
    const onClear = vi.fn();
    const onPause = vi.fn();
    const sharedProps = {
      history: {
        points: [
          {
            timestampMs: 100,
            midi: 69,
            frequencyHz: 440,
            confidence: 0.95,
            kind: 'pitch' as const,
          },
        ],
      },
      summary: {
        ...emptySummary,
        totalPoints: 1,
        pitchPoints: 1,
        oldestTimestampMs: 100,
        newestTimestampMs: 100,
        latestKind: 'pitch' as const,
      },
      captureState: {
        status: 'recording' as const,
        accumulatedPausedDurationMs: 0,
        resumeBoundaryEffectiveMs: null,
      },
      sessionVersion: 1,
      toEffectiveTimestamp: (timestamp: number) => timestamp,
      durationMs: 15_000,
      onClear,
      onPause,
      onResume: vi.fn(),
      ...defaultRangeProps,
    };
    const { rerender } = render(<PitchMonitor {...sharedProps} active />);
    const a4 = screen.getByRole('button', {
      name: 'Reference note A4, 440.0 hertz',
    });
    fireEvent.click(a4);
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'Reference drone playing A4 at 440.0 Hz',
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Stop reference drone' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'Reference drone stopped',
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start practice' }));
    expect(screen.getByText('Practice running')).toBeInTheDocument();
    expect(a4).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'Reference note C4, 261.6 hertz' }),
    );
    expect(a4).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause history' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(onPause).toHaveBeenCalledOnce();
    expect(screen.getByText('Practice running')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Start selected drone' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Reference drone status')).toHaveTextContent(
        'Reference drone playing A4 at 440.0 Hz',
      ),
    );
    expect(screen.getByText('Practice running')).toBeInTheDocument();

    rerender(<PitchMonitor {...sharedProps} active={false} />);
    await waitFor(() =>
      expect(screen.getByText('Practice paused')).toBeInTheDocument(),
    );
    expect(screen.getByText(/microphone stopped/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Resume practice' }),
    ).toBeDisabled();

    rerender(<PitchMonitor {...sharedProps} active />);
    expect(screen.getByText('Practice paused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume practice' }));
    expect(screen.getByText('Practice running')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finish practice' }));
    expect(screen.getByText('Practice completed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Not enough measured voice to calculate time in the target band.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
    expect(screen.getByText('Practice ready')).toBeInTheDocument();
    expect(
      screen.getByText('Selected target: A4 · 440.0 Hz'),
    ).toBeInTheDocument();
  });
});
