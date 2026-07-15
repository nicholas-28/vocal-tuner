import { expect, test } from '@playwright/test';

type AudioProbeWindow = Window & {
  __audioProbe: {
    contexts: number;
    resumes: number;
    oscillatorStarts: number;
    allowResume: boolean;
    copiedReport: string;
    context: { interrupt: () => void } | null;
  };
};

test('mobile WebKit keeps reference audio inside explicit activation and exposes recovery diagnostics', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = {
      contexts: 0,
      resumes: 0,
      oscillatorStarts: 0,
      allowResume: false,
      copiedReport: '',
      context: null as MockAudioContext | null,
    };
    class MockAudioParam {
      value = 0;
      cancelAndHoldAtTime() {}
      cancelScheduledValues() {}
      setValueAtTime(value: number) {
        this.value = value;
      }
      linearRampToValueAtTime(value: number) {
        this.value = value;
      }
      setTargetAtTime(value: number) {
        this.value = value;
      }
    }
    class MockNode {
      channelCount = 2;
      connect() {
        return this;
      }
      disconnect() {}
    }
    class MockGain extends MockNode {
      gain = new MockAudioParam();
    }
    class MockOscillator extends MockNode {
      type = 'sine';
      frequency = new MockAudioParam();
      onended: (() => void) | null = null;
      start() {
        probe.oscillatorStarts += 1;
      }
      stop() {
        queueMicrotask(() => this.onended?.());
      }
    }
    class MockAudioContext extends EventTarget {
      state = 'suspended';
      sampleRate = 48_000;
      baseLatency = 0.01;
      destination = new MockNode();
      private runningAt = 0;
      constructor() {
        super();
        probe.contexts += 1;
        probe.context = this;
      }
      get currentTime() {
        return this.state === 'running'
          ? (performance.now() - this.runningAt) / 1000
          : 0;
      }
      createGain() {
        return new MockGain();
      }
      createOscillator() {
        return new MockOscillator();
      }
      async resume() {
        probe.resumes += 1;
        if (probe.allowResume) {
          this.state = 'running';
          this.runningAt = performance.now();
          this.dispatchEvent(new Event('statechange'));
        }
      }
      async close() {
        this.state = 'closed';
        this.dispatchEvent(new Event('statechange'));
      }
      async suspend() {
        this.state = 'suspended';
        this.dispatchEvent(new Event('statechange'));
      }
      interrupt() {
        this.state = 'interrupted';
        this.dispatchEvent(new Event('statechange'));
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: MockAudioContext,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (report: string) => {
          probe.copiedReport = report;
        },
      },
    });
    Object.defineProperty(window, '__audioProbe', {
      configurable: true,
      value: probe,
    });
  });
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/?audioDiagnostics=1');

  const diagnostics = page.getByLabel('Reference-drone diagnostics values');
  await expect(diagnostics).toContainText('ConstructorwebkitAudioContext');
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.contexts,
    ),
  ).toBe(0);

  const c4 = page.getByRole('button', {
    name: 'Reference note C4, 261.6 hertz',
  });
  await c4.focus();
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.contexts,
    ),
  ).toBe(0);
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'audio output stayed suspended',
  );
  expect(
    await page.evaluate(() => (window as AudioProbeWindow).__audioProbe),
  ).toMatchObject({
    contexts: 1,
    resumes: 1,
    oscillatorStarts: 1,
  });
  await page.evaluate(() => {
    (window as AudioProbeWindow).__audioProbe.allowResume = true;
  });
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing C4',
  );
  await expect(diagnostics).toContainText('Rendering clockadvanced');

  await page.evaluate(() =>
    (window as AudioProbeWindow).__audioProbe.context?.interrupt(),
  );
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'interrupted',
  );
  await expect(diagnostics).toContainText('Explicit reactivationrequired');
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing C4',
  );
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'stopped',
  );

  await page.getByRole('button', { name: 'Play 1-second output test' }).click();
  await expect(diagnostics).toContainText('Output testplaying');
  await expect(diagnostics).toContainText('Output testsucceeded', {
    timeout: 2500,
  });
  await page
    .getByRole('button', { name: 'Copy audio diagnostic report' })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'report copied' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.copiedReport,
    ),
  ).toContain('Constructor: webkitAudioContext');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
});
