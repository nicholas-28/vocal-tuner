import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TargetPracticeSessionModel } from '../hooks/useTargetPracticeSession';
import type {
  ActivePracticeSession,
  PracticeSessionSummary,
} from '../types/practiceSession';
import { TargetPracticeSession } from './TargetPracticeSession';

const target = { midiNote: 69, label: 'A4', frequencyHz: 440 };

const session: ActivePracticeSession = {
  sessionId: 1,
  target,
  startedAtMs: 0,
  lastProcessedAtMs: 3000,
  currentObservation: { kind: 'on-target', targetRelativeCents: 4 },
  observationStartedAtMs: 2900,
  activeElapsedMs: 3000,
  measurableVoicedMs: 2000,
  onTargetMs: 1200,
  offTargetMs: 800,
  uncertainMs: 300,
  noPitchMs: 500,
  unobservedMs: 200,
  pauseCount: 0,
  pitchMeanCents: -4,
  pitchM2CentsSquaredMs: 8000,
  timelineEvents: [],
};

function model(
  overrides: Partial<TargetPracticeSessionModel> = {},
): TargetPracticeSessionModel {
  return {
    state: { status: 'idle' },
    displaySession: null,
    selectedTarget: null,
    microphoneActive: false,
    controls: {
      canStart: false,
      canPause: false,
      canResume: false,
      canFinish: false,
      canReset: false,
    },
    targetSelectionLocked: false,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    finish: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

describe('TargetPracticeSession', () => {
  it('explains idle preconditions and disables Start without them', () => {
    render(<TargetPracticeSession model={model()} />);
    expect(
      screen.getByRole('heading', { name: 'Practice session' }),
    ).toBeVisible();
    expect(screen.getByText('Practice ready')).toBeVisible();
    expect(screen.getByText(/Select a reference note/)).toBeVisible();
    expect(
      screen.getByText('Start the microphone to begin practice.'),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Start practice' }),
    ).toBeDisabled();
  });

  it('starts only when target and microphone preconditions are available', () => {
    const start = vi.fn();
    render(
      <TargetPracticeSession
        model={model({
          selectedTarget: target,
          microphoneActive: true,
          controls: {
            canStart: true,
            canPause: false,
            canResume: false,
            canFinish: false,
            canReset: false,
          },
          start,
        })}
      />,
    );
    expect(screen.getByText('Selected target: A4 · 440.0 Hz')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Start practice' }));
    expect(start).toHaveBeenCalledOnce();
  });

  it('shows locked target, live metrics, observation, and explicit controls while running', () => {
    const pause = vi.fn();
    const finish = vi.fn();
    render(
      <TargetPracticeSession
        model={model({
          state: { status: 'running', session },
          displaySession: session,
          selectedTarget: target,
          microphoneActive: true,
          targetSelectionLocked: true,
          controls: {
            canStart: false,
            canPause: true,
            canResume: false,
            canFinish: true,
            canReset: false,
          },
          pause,
          finish,
        })}
      />,
    );
    expect(screen.getByText('Practice running')).toBeVisible();
    expect(screen.getByText(/Practice target locked to A4/)).toBeVisible();
    expect(screen.getByLabelText('Live practice metrics')).toHaveTextContent(
      'Time in ±10-cent band60.0%',
    );
    expect(
      screen.getByLabelText('Pitch center and variation'),
    ).toHaveTextContent('Average offset-4.0 centsPitch spread2.0 cents');
    expect(screen.getByText(/Time in this band is not a grade/)).toBeVisible();
    expect(screen.getByText('Current observation: On target')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Pause practice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish practice' }));
    expect(pause).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledOnce();
  });

  it('explains microphone auto-pause and disables Resume until capture returns', () => {
    render(
      <TargetPracticeSession
        model={model({
          state: {
            status: 'paused',
            paused: {
              session: { ...session, pauseCount: 1 },
              pausedAtMs: 3000,
              reason: 'microphone-stopped',
            },
          },
          displaySession: { ...session, pauseCount: 1 },
          selectedTarget: target,
          targetSelectionLocked: true,
          controls: {
            canStart: false,
            canPause: false,
            canResume: false,
            canFinish: true,
            canReset: false,
          },
        })}
      />,
    );
    expect(screen.getByText('Practice paused')).toBeVisible();
    expect(screen.getByText(/microphone stopped/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Resume practice' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Finish practice' }),
    ).toBeEnabled();
  });

  it('shows a neutral completed summary and Practice again', () => {
    const reset = vi.fn();
    const summary: PracticeSessionSummary = {
      ...session,
      completedAtMs: 5000,
      wallElapsedMs: 5000,
      onTargetShare: 0.6,
      pauseCount: 1,
      timelineEvents: [
        { startTimestamp: 0, endTimestamp: 1200, type: 'on-target' },
        { startTimestamp: 1200, endTimestamp: 2000, type: 'off-target' },
        { startTimestamp: 2000, endTimestamp: 2300, type: 'uncertain' },
        { startTimestamp: 2300, endTimestamp: 2800, type: 'no-pitch' },
        { startTimestamp: 2800, endTimestamp: 3000, type: 'unobserved' },
        { startTimestamp: 3000, endTimestamp: 5000, type: 'paused' },
      ],
    };
    render(
      <TargetPracticeSession
        model={model({
          state: { status: 'completed', summary },
          selectedTarget: target,
          controls: {
            canStart: false,
            canPause: false,
            canResume: false,
            canFinish: false,
            canReset: true,
          },
          reset,
        })}
      />,
    );
    expect(screen.getByText('Practice completed')).toBeVisible();
    expect(screen.getByText('Time in ±10-cent band: 60.0%')).toBeVisible();
    expect(
      screen.getByLabelText('Completed practice summary'),
    ).toHaveTextContent(
      'Briefly uncertain0.3 sNo pitch0.5 sUnobserved0.2 sPauses1',
    );
    expect(document.body).not.toHaveTextContent(/score|recording|replay/i);
    expect(
      screen.getByRole('heading', { name: 'Session timeline' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Practice events').children).toHaveLength(6);
    expect(
      screen.getByRole('button', {
        name: 'On target for 1.2 seconds. 24% of session.',
      }),
    ).toHaveTextContent('On target1.2 s24%');
    const timelineEvent = screen.getByRole('button', {
      name: 'On target for 1.2 seconds. 24% of session.',
    });
    fireEvent.click(timelineEvent);
    expect(timelineEvent).toHaveAttribute('aria-expanded', 'true');
    expect(
      timelineEvent.getElementsByClassName('practice-timeline__tooltip')[0],
    ).toHaveAttribute('data-visible');
    fireEvent.click(timelineEvent);
    expect(timelineEvent).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByLabelText('Timeline legend')).toHaveTextContent(
      'On targetOff targetUncertainNo pitchUnobservedPaused',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('does not fabricate a zero share with no measured voice', () => {
    const summary: PracticeSessionSummary = {
      ...session,
      measurableVoicedMs: 0,
      onTargetMs: 0,
      offTargetMs: 0,
      completedAtMs: 1000,
      wallElapsedMs: 1000,
      onTargetShare: null,
      timelineEvents: [
        { startTimestamp: 0, endTimestamp: 1000, type: 'no-pitch' },
      ],
    };
    render(
      <TargetPracticeSession
        model={model({ state: { status: 'completed', summary } })}
      />,
    );
    expect(
      screen.getByText(
        'Not enough measured voice to calculate time in the target band.',
      ),
    ).toBeVisible();
    expect(screen.queryByText(/0\.0%/)).not.toBeInTheDocument();
  });
});
