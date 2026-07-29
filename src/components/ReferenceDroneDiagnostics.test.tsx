import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudioSessionDiagnosticTimeline } from '../audio/audioSessionDiagnostics';
import { createInitialReferenceDroneDiagnostics } from '../audio/referenceDroneConfig';
import { ReferenceDroneDiagnostics } from './ReferenceDroneDiagnostics';

describe('ReferenceDroneDiagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'audioSession');
  });

  it('keeps AudioSession preparation behind an explicit diagnostic action', async () => {
    const assignments: string[] = [];
    let sessionType = 'auto';
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        get type() {
          return sessionType;
        },
        set type(value: string) {
          sessionType = value;
          assignments.push(value);
        },
        state: 'inactive',
      },
    });
    const recreate = vi.fn(async () => undefined);
    const timeline = createAudioSessionDiagnosticTimeline();

    render(
      <ReferenceDroneDiagnostics
        diagnostics={createInitialReferenceDroneDiagnostics('AudioContext')}
        audioDiagnosticMode
        onRecreateContext={recreate}
        audioSessionTimeline={timeline}
      />,
    );

    expect(assignments).toEqual([]);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Prepare playback and recreate output context',
      }),
    );

    await waitFor(() => expect(recreate).toHaveBeenCalledOnce());
    await waitFor(() => expect(sessionType).toBe('auto'));
    expect(assignments).toEqual(['playback', 'auto']);
    expect(
      screen.getByLabelText('Audio-session experiment result'),
    ).toHaveTextContent('prepared; auto → playback');
    expect(
      timeline.getSnapshot().snapshots.map((entry) => entry.label),
    ).toEqual([
      'page load',
      'before diagnostic session preparation',
      'diagnostic session preparation: prepared',
      'after diagnostic context recreation',
      'after diagnostic session restore',
    ]);
  });

  it('explains why diagnostic actions are disabled', () => {
    const diagnostics = createInitialReferenceDroneDiagnostics('AudioContext');
    diagnostics.engineState = 'playing';
    render(
      <ReferenceDroneDiagnostics
        diagnostics={diagnostics}
        audioDiagnosticMode
      />,
    );

    expect(
      screen.getByText(/Diagnostic actions unavailable:/),
    ).toHaveTextContent(
      'Diagnostic actions unavailable: Stop the reference drone or current Web Audio test first.',
    );
    expect(
      screen.getByRole('button', { name: 'Play direct Web Audio test' }),
    ).toHaveAttribute('aria-describedby', 'audio-actions-disabled-reason');
  });
});
