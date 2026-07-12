import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCanvasViewport } from './useCanvasViewport';

let observerCallback: ResizeObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();

class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    observerCallback = callback;
  }
  observe = observe;
  disconnect = disconnect;
}

function Harness() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const { elementRef, size } = useCanvasViewport<HTMLDivElement>();
  return (
    <div>
      <div data-testid="target" ref={elementRef} />
      <output data-testid="size">{JSON.stringify(size)}</output>
      <output data-testid="renders">{renderCount.current}</output>
    </div>
  );
}

describe('useCanvasViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1.5,
    });
  });

  it('starts at zero, observes sizes, ignores duplicates, and disconnects', () => {
    const { unmount } = render(<Harness />);
    expect(screen.getByTestId('size')).toHaveTextContent(
      JSON.stringify({
        widthCssPx: 0,
        heightCssPx: 0,
        devicePixelRatio: 1,
      }),
    );
    expect(observe).toHaveBeenCalledWith(screen.getByTestId('target'));

    const entry = { contentRect: { width: 320, height: 400 } };
    act(() =>
      observerCallback([entry as ResizeObserverEntry], {} as ResizeObserver),
    );
    expect(screen.getByTestId('size')).toHaveTextContent(
      JSON.stringify({
        widthCssPx: 320,
        heightCssPx: 400,
        devicePixelRatio: 1.5,
      }),
    );
    const stableRenderCount = screen.getByTestId('renders').textContent;
    act(() =>
      observerCallback([entry as ResizeObserverEntry], {} as ResizeObserver),
    );
    expect(screen.getByTestId('renders')).toHaveTextContent(
      stableRenderCount ?? '',
    );
    act(() =>
      observerCallback(
        [
          {
            contentRect: { width: 360, height: 420 },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      ),
    );
    expect(screen.getByTestId('size')).toHaveTextContent('360');
    expect(screen.getByTestId('size')).toHaveTextContent('420');
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('falls back to element and window measurements without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        width: 300,
        height: 380,
      } as DOMRect);
    const { unmount } = render(<Harness />);
    expect(screen.getByTestId('size')).toHaveTextContent('300');
    expect(screen.getByTestId('size')).toHaveTextContent('380');
    rect.mockReturnValue({ width: 340, height: 410 } as DOMRect);
    act(() => window.dispatchEvent(new Event('resize')));
    expect(screen.getByTestId('size')).toHaveTextContent('340');
    expect(screen.getByTestId('size')).toHaveTextContent('410');
    unmount();
    rect.mockRestore();
  });
});
