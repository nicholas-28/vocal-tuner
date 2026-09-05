import { expect, test } from '@playwright/test';

type AudioProbeWindow = Window & {
  __audioProbe: {
    contexts: number;
    resumes: number;
    oscillatorStarts: number;
    allowResume: boolean;
    copiedReport: string;
    waveform: 'active' | 'silent';
    getUserMediaRequests: number;
    audioSessionAssignments: string[];
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
      waveform: 'active',
      getUserMediaRequests: 0,
      audioSessionAssignments: [] as string[],
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
    class MockAnalyser extends MockNode {
      fftSize = 1024;
      smoothingTimeConstant = 0;
      getFloatTimeDomainData(buffer: Float32Array) {
        for (let index = 0; index < buffer.length; index += 1)
          buffer[index] =
            probe.waveform === 'active' ? (index % 2 === 0 ? 0.1 : -0.1) : 0;
      }
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
      setPeriodicWave() {
        this.type = 'custom';
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
      createAnalyser() {
        return new MockAnalyser();
      }
      createMediaStreamSource() {
        return new MockNode();
      }
      createPeriodicWave() {
        return {} as PeriodicWave;
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
    let audioSessionType = 'auto';
    const audioSession = {
      get type() {
        return audioSessionType;
      },
      set type(value: string) {
        audioSessionType = value;
        probe.audioSessionAssignments.push(value);
      },
      state: 'inactive',
    };
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: audioSession,
    });
    class MockTrack extends EventTarget {
      readyState: MediaStreamTrackState = 'live';
      stop() {
        this.readyState = 'ended';
        audioSession.state = 'inactive';
      }
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          probe.getUserMediaRequests += 1;
          audioSessionType = 'play-and-record';
          audioSession.state = 'active';
          const track = new MockTrack();
          return { getTracks: () => [track] };
        },
      },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: () => 'blob:local-native-a4',
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: () => undefined,
    });
    class MockNativeAudio extends EventTarget {
      currentTime = 0;
      paused = true;
      preload = '';
      error = null;
      constructor(readonly src: string) {
        super();
      }
      async play() {
        this.paused = false;
        setTimeout(() => {
          this.dispatchEvent(new Event('playing'));
          this.currentTime = 0.5;
          this.dispatchEvent(new Event('timeupdate'));
          this.currentTime = 1;
          this.paused = true;
          this.dispatchEvent(new Event('ended'));
        }, 20);
      }
      pause() {
        this.paused = true;
      }
      removeAttribute() {}
      load() {}
    }
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      value: MockNativeAudio,
    });
    Object.defineProperty(window, '__audioProbe', {
      configurable: true,
      value: probe,
    });
  });
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/?audioDiagnostics=1');

  const panel = page
    .getByText('Reference audio diagnostics', { exact: true })
    .locator('..');
  await expect(panel).toContainText('ConstructorwebkitAudioContext');
  await expect(panel).toContainText('Backendweb-audio');
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
  await expect(panel).toContainText('Rendering clockadvanced');
  await expect(
    page.getByLabel('Persistent drone path signal result'),
  ).toContainText('Digital signal before destination: Active');
  await expect(panel).toContainText('after drone context creation');
  await expect(panel).toContainText('after drone resume');
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.getUserMediaRequests,
    ),
  ).toBe(0);
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.audioSessionAssignments,
    ),
  ).toEqual([]);

  await page.evaluate(() =>
    (window as AudioProbeWindow).__audioProbe.context?.interrupt(),
  );
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference audio paused by the browser. Tap the selected note to restart.',
  );
  await expect(panel).toContainText('Explicit reactivationrequired');
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing C4',
  );
  await expect(panel).toContainText('before drone retry');
  await expect(panel).toContainText('after drone retry');

  const cSharp4 = page.locator('.reference-key[data-midi="61"]');
  const d4 = page.locator('.reference-key[data-midi="62"]');
  await page.evaluate(() => {
    (
      document.querySelector('.reference-key[data-midi="61"]') as HTMLElement
    )?.click();
    (
      document.querySelector('.reference-key[data-midi="62"]') as HTMLElement
    )?.click();
  });
  await expect(d4).toHaveAttribute('data-sounding', 'true');
  await expect(cSharp4).not.toHaveAttribute('data-sounding');
  await expect(d4).not.toHaveAttribute('data-pressed');
  await c4.click();
  await expect(c4).toHaveAttribute('data-sounding', 'true');

  await c4.dispatchEvent('pointerdown', { pointerId: 41 });
  await expect(c4).toHaveAttribute('data-pressed', 'true');
  const contextsBeforePageHide = await page.evaluate(
    () => (window as AudioProbeWindow).__audioProbe.contexts,
  );
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(c4).not.toHaveAttribute('data-pressed');
  await expect(c4).not.toHaveAttribute('data-sounding');
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference audio paused by the browser. Tap the selected note to restart.',
  );
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.contexts,
    ),
  ).toBe(contextsBeforePageHide);
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing C4',
  );
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.contexts,
    ),
  ).toBe(contextsBeforePageHide + 1);
  await expect(
    page.getByText(/Diagnostic actions unavailable: Stop the reference drone/),
  ).toBeVisible();
  await c4.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'stopped',
  );

  const engineTestButton = page.getByRole('button', {
    name: 'Play 1-second output test',
  });
  await engineTestButton.click();
  await expect(
    page.getByLabel('Engine output test signal result'),
  ).toContainText('Digital signal before destination: Active');
  await expect(engineTestButton).toBeEnabled({ timeout: 2500 });

  await page.evaluate(() => {
    (window as AudioProbeWindow).__audioProbe.waveform = 'silent';
  });
  const directButton = page.getByRole('button', {
    name: 'Play direct Web Audio test',
  });
  await directButton.click();
  await expect(page.getByLabel('Direct Web Audio signal result')).toContainText(
    'Digital signal before destination: Silent',
    { timeout: 2500 },
  );
  await expect(directButton).toBeEnabled({ timeout: 2500 });
  await page.evaluate(() => {
    (window as AudioProbeWindow).__audioProbe.waveform = 'active';
  });
  const constantButton = page.getByRole('button', {
    name: 'Play Web Audio test with constant gain',
  });
  await constantButton.click();
  await expect(page.getByLabel('Constant gain signal result')).toContainText(
    'Digital signal before destination: Active',
    { timeout: 2500 },
  );
  await expect(constantButton).toBeEnabled({ timeout: 2500 });

  await page.getByRole('button', { name: 'Play native audio test' }).click();
  const nativeSection = page
    .getByText('Native media comparison', { exact: true })
    .locator('..');
  await expect(nativeSection).toContainText('Statussucceeded');

  const generationBefore = await panel.textContent();
  const recreateButton = page.getByRole('button', {
    name: 'Recreate audio output context',
  });
  await recreateButton.click();
  await expect(
    page.getByLabel('Recreated context signal result'),
  ).toContainText('Digital signal before destination: Active', {
    timeout: 2500,
  });
  await expect(recreateButton).toBeEnabled({ timeout: 2500 });
  expect(await panel.textContent()).not.toBe(generationBefore);

  await page.getByRole('button', { name: 'C2–C4' }).click();
  const c2 = page.getByRole('button', {
    name: 'Reference note C2, 65.4 hertz',
  });
  await c2.click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing C2',
  );
  await expect(panel).toContainText('Timbrelow-harmonic-support');
  await expect(panel).toContainText('1× 65.41 Hz');
  await c2.click();

  await page.getByRole('button', { name: 'Start microphone' }).click();
  await expect(page.getByLabel('Microphone status')).toContainText(
    'Microphone active',
  );
  await expect(panel).toContainText('after getUserMedia resolved');
  await expect(panel).toContainText('after microphone AudioContext starts');
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await expect(page.getByLabel('Microphone status')).toContainText(
    'Microphone inactive',
  );
  await expect(panel).toContainText('after microphone Stop');

  const sessionExperiment = page.getByRole('button', {
    name: 'Prepare playback and recreate output context',
  });
  await sessionExperiment.click();
  await expect(sessionExperiment).toBeEnabled({ timeout: 2500 });
  await expect(
    page.getByLabel('Audio-session experiment result'),
  ).toContainText('prepared; play-and-record → playback');
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.audioSessionAssignments,
    ),
  ).toEqual(['playback', 'play-and-record']);

  await page
    .getByRole('group', { name: 'Persistent drone audible' })
    .getByRole('button', { name: 'No', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Direct Web Audio audible' })
    .getByRole('button', { name: 'No', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Native audio audible' })
    .getByRole('button', { name: 'Yes', exact: true })
    .click();
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
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.copiedReport,
    ),
  ).toContain('Persistent drone: no');
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.copiedReport,
    ),
  ).toContain('AudioSession preparation: not-requested');
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.copiedReport,
    ),
  ).toContain('diagnostic session preparation: prepared');
  expect(
    await page.evaluate(
      () => (window as AudioProbeWindow).__audioProbe.copiedReport,
    ),
  ).toContain('Selected backend: web-audio');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('reference keys accept immediate mixed input without duplicate keyboard clicks', async ({
  page,
}) => {
  // Keep this input regression silent; selection is independent of audio support.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');
  const c4 = page.locator('.reference-key[data-midi="60"]');
  const g4 = page.locator('.reference-key[data-midi="67"]');
  await page.evaluate(() => {
    const keys = document.querySelector('.reference-keyboard')!;
    keys.setAttribute('data-observed-clicks', '0');
    keys.addEventListener('click', () => {
      keys.setAttribute(
        'data-observed-clicks',
        String(Number(keys.getAttribute('data-observed-clicks')) + 1),
      );
    });
  });
  await c4.focus();
  await page.keyboard.press('Space');
  await expect(c4).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.reference-keyboard')).toHaveAttribute(
    'data-observed-clicks',
    '0',
  );
  await g4.click();
  await expect(g4).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('.reference-keyboard')).toHaveAttribute(
    'data-observed-clicks',
    '1',
  );
  await c4.tap();
  await expect(c4).toHaveAttribute('aria-pressed', 'true');
});

test('offline WebKit release stays continuous and is silent before source termination', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    // No live destination: constant input exposes the envelope itself.
    // Engine unit coverage asserts this same anchor/ramp/stop schedule.
    const context = new OfflineAudioContext(1, 48000, 48000);
    const source = context.createConstantSource();
    const gain = context.createGain();
    source.connect(gain).connect(context.destination);
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(1, 0.05);
    source.start();
    const paused = context.suspend(0.5);
    const rendered = context.startRendering();
    await paused;
    const start = context.currentTime;
    const held = gain.gain.value;
    gain.gain.cancelAndHoldAtTime(start);
    gain.gain.setValueAtTime(held, start);
    gain.gain.linearRampToValueAtTime(0, start + 0.12);
    source.stop(start + 0.12 + 128 / context.sampleRate);
    await context.resume();
    const samples = (await rendered).getChannelData(0);
    const at = Math.round(start * context.sampleRate);
    return {
      before: samples[at - 1],
      start: samples[at],
      middle: samples[at + 2880],
      silentPeak: Math.max(...samples.slice(at + 5760).map(Math.abs)),
    };
  });
  expect(result.before).toBeCloseTo(1, 6);
  expect(result.start).toBeCloseTo(result.before!, 6);
  expect(result.middle).toBeCloseTo(0.5, 6);
  expect(result.silentPeak).toBeLessThan(0.000001);
});
