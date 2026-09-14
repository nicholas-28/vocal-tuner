import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { startPitchAnalysis } from '../audio/pitchAnalysis';
import type { PitchMonitor } from '../components/PitchMonitor';
import { createPitchDetection } from '../test/pitchFixture';
import type { RawPitchDetection } from '../types/pitch';
import { App } from './App';

let graph: ComponentProps<typeof PitchMonitor>;
vi.mock('../components/PitchMonitor', () => ({
  PitchMonitor: (props: ComponentProps<typeof PitchMonitor>) => {
    graph = props;
    return null;
  },
}));
vi.mock(import('../audio/pitchAnalysis'), async (original) => ({
  ...(await original()),
  startPitchAnalysis: vi.fn(),
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('keeps rejected observations in render-only metadata, freezes it during Pause, and resets at Clear/Start', async () => {
  let now = 100;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  let observation!: (d: RawPitchDetection) => void,
    presentation!: (d: RawPitchDetection) => void;
  vi.stubGlobal('AudioContext', class {});
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => ({
        getTracks: () => [
          Object.assign(new EventTarget(), {
            readyState: 'live',
            stop: vi.fn(),
          }),
        ],
      }),
    },
  });
  vi.mocked(startPitchAnalysis).mockImplementation(
    (_stream, onDetection, _error, onObservation) => {
      observation = onObservation!;
      presentation = onDetection;
      return {
        stop: async () => {},
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
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Start microphone' })),
  );
  const voiced = createPitchDetection({ timestampMs: 100, frequencyHz: 440 });
  act(() => {
    observation(voiced);
    presentation(voiced);
  });
  expect(graph.durationMs).toBe(30_000);
  const history = graph.history;
  now = 133;
  act(() =>
    observation(
      createPitchDetection({
        timestampMs: now,
        frequencyHz: null,
        rejectionReason: 'low-confidence',
      }),
    ),
  );
  expect(graph.history).toBe(history);
  expect(graph.curveBreaks!.between(100, 167)).toBe(true);
  const next = createPitchDetection({ timestampMs: 167, frequencyHz: 440 });
  now = 167;
  act(() => {
    observation(next);
    presentation(next);
  });
  const captured = graph.history;
  expect(captured.points.every((point) => point.kind === 'pitch')).toBe(true);
  act(() => graph.onZoomRange(12));
  act(() => graph.onCenterRange(69));
  expect(graph.history).toBe(captured);
  expect(graph.visibleRange).toEqual({ lowMidi: 63, highMidi: 75 });
  now = 200;
  act(() => graph.onPause());
  const count = graph.curveBreaks!.count;
  now = 300;
  act(() =>
    observation(
      createPitchDetection({
        timestampMs: now,
        rejectionReason: 'silence',
        frequencyHz: null,
      }),
    ),
  );
  expect(graph.curveBreaks!.count).toBe(count);
  now = 400;
  act(() => graph.onResume());
  now = 433;
  act(() =>
    observation(
      createPitchDetection({
        timestampMs: now,
        rejectionReason: 'silence',
        frequencyHz: null,
      }),
    ),
  );
  expect(graph.curveBreaks!.between(200, 234)).toBe(true); // Pause duration removed only on the existing effective clock.
  act(() => graph.onClear());
  expect(graph.history.points).toHaveLength(0);
  expect(graph.curveBreaks!.count).toBe(0);
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Stop microphone' })),
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Start microphone' })),
  );
  expect(graph.curveBreaks!.count).toBe(0);
});
