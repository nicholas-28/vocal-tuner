import { act, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createPitchSource } from '../pitch/pitchSource';
import { createPitchDetection } from '../test/pitchFixture';
import { useLiveCentsMarker } from './useLiveCentsMarker';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('updates SVG between React publications, never re-renders, hides rejection/staleness, and cancels/unsubscribes', () => {
  let now = 100,
    id = 0,
    renders = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key));
  const producer = createPitchSource();
  producer.beginSession(1);
  const subscribe = vi.fn(producer.source.subscribe);
  const source = { ...producer.source, subscribe };
  function Marker() {
    renders++;
    const ref = useLiveCentsMarker(source, false);
    return (
      <svg ref={ref}>
        <path />
      </svg>
    );
  }
  const view = render(<Marker />);
  const svg = view.container.querySelector('svg')!;
  expect(svg.dataset.visible).toBe('false');
  act(() => {
    producer.publish(createPitchDetection({ timestampMs: 100 }), 1);
  });
  expect(svg.dataset.visible).toBe('true');
  expect(renders).toBe(1);
  now = 134;
  act(() => {
    producer.publish(
      createPitchDetection({
        timestampMs: 134,
        rejectionReason: 'low-confidence',
      }),
      1,
    );
  });
  expect(svg.dataset.visible).toBe('false');
  expect(frames.size).toBe(0);
  now = 167;
  act(() => {
    producer.publish(createPitchDetection({ timestampMs: 167 }), 1);
  });
  now = 418;
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((cb) => cb(now));
  });
  expect(svg.dataset.visible).toBe('false');
  expect(renders).toBe(1);
  now = 450;
  act(() => {
    producer.publish(createPitchDetection({ timestampMs: 450 }), 1);
  });
  view.unmount();
  expect(frames.size).toBe(0);
  now = 500;
  producer.publish(createPitchDetection({ timestampMs: 500 }), 1);
  expect(frames.size).toBe(0);
  expect(subscribe).toHaveBeenCalledOnce();
});
