import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { startPitchAnalysis } from '../audio/pitchAnalysis';
import { createPitchDetection } from '../test/pitchFixture';
import { installReferenceDroneAudioMock } from '../test/referenceDroneAudioMock';
import type { RawPitchDetection } from '../types/pitch';
import { App } from './App';

vi.mock(import('../audio/pitchAnalysis'), async (importOriginal) => ({
  ...(await importOriginal()),
  startPitchAnalysis: vi.fn(),
}));

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
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('clears live pitch and guidance, stops history, and pauses practice after analysis failure', async () => {
  let now = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  let publish!: (d: RawPitchDetection) => void;
  let fail!: () => void;
  const stop = vi.fn().mockResolvedValue(undefined);
  const track = Object.assign(new EventTarget(), {
    stop: vi.fn(),
    readyState: 'live',
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }),
    },
  });
  vi.mocked(startPitchAnalysis).mockImplementation(
    (_stream, detection, error) => {
      publish = detection;
      fail = error;
      return {
        stop,
        diagnostics: {
          contextState: 'running',
          sampleRate: 48000,
          destinationChannelCount: 2,
          destinationConnected: false,
        },
      };
    },
  );
  render(<App />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Reference note A4, 440.0 hertz' }),
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start microphone' }));
  });
  act(() =>
    publish(
      createPitchDetection({
        frequencyHz: 440,
        timestampMs: performance.now(),
      }),
    ),
  );
  expect(screen.getByLabelText('Current note: A4')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Start practice' }));
  expect(screen.getByText('Practice running')).toBeInTheDocument();
  now += 100;
  act(() =>
    publish(createPitchDetection({ frequencyHz: 440, timestampMs: now })),
  );
  now += 100;
  expect(screen.getByText('On target', { selector: 'p' })).toBeInTheDocument();
  const historyBefore = screen.getByLabelText(
    'Pitch history summary',
  ).textContent;
  await act(async () => fail());
  expect(screen.getByLabelText('Microphone status')).toHaveTextContent(
    'Microphone error',
  );
  expect(
    screen.getByLabelText('Current note: unavailable'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Pitch detector status')).toHaveTextContent(
    'error',
  );
  expect(
    screen.queryByText('On target', { selector: 'p' }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Pitch history status')).toHaveTextContent(
    'History inactive',
  );
  expect(screen.getByText('Practice paused')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Resume practice' }),
  ).toBeDisabled();
  expect(track.stop).toHaveBeenCalledOnce();
  expect(stop).toHaveBeenCalledOnce();
  const metrics = screen.getByLabelText('Live practice metrics').textContent;
  now += 1000;
  act(() =>
    publish(createPitchDetection({ frequencyHz: 440, timestampMs: now })),
  );
  expect(screen.getByLabelText('Live practice metrics').textContent).toBe(
    metrics,
  );
  expect(screen.getByLabelText('Pitch history summary').textContent).toBe(
    historyBefore,
  );
  expect(
    screen.getByLabelText('Current note: unavailable'),
  ).toBeInTheDocument();
  expect(screen.getByText('Practice paused')).toBeInTheDocument();
});
