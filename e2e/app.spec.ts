import { expect, test } from '@playwright/test';

test('loads the initial tuner screen', async ({ page }) => {
  await page.addInitScript(() => {
    const droneMock = {
      allowResume: false,
      contexts: 0,
      resumes: 0,
      oscillatorStarts: 0,
    };
    Object.defineProperty(window, '__droneMock', {
      configurable: true,
      value: droneMock,
    });
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
    class MockAudioNode {
      connect() {}
      disconnect() {}
    }
    class MockGainNode extends MockAudioNode {
      gain = new MockAudioParam();
    }
    class MockOscillatorNode extends MockAudioNode {
      type = 'sine';
      frequency = new MockAudioParam();
      onended: (() => void) | null = null;
      start() {
        droneMock.oscillatorStarts += 1;
      }
      stop() {
        queueMicrotask(() => this.onended?.());
      }
    }
    class MockAudioContext extends EventTarget {
      state = 'suspended';
      currentTime = 0;
      destination = new MockAudioNode();
      constructor() {
        super();
        droneMock.contexts += 1;
      }
      createGain() {
        return new MockGainNode();
      }
      createOscillator() {
        return new MockOscillatorNode();
      }
      async resume() {
        droneMock.resumes += 1;
        if (droneMock.allowResume) {
          this.state = 'running';
          this.dispatchEvent(new Event('statechange'));
          setTimeout(() => {
            this.currentTime += 0.05;
          }, 10);
        }
      }
      async close() {
        this.state = 'closed';
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });
  });
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/?droneDiagnostics=1&centsMeterDemo=1');

  await expect(
    page.getByRole('heading', { name: 'Vocal Tuner' }),
  ).toBeVisible();
  await expect(page.getByLabel('Deployment build information')).toContainText(
    /^v0\.0\.0 · unknown/,
  );
  await expect(
    page.getByRole('button', { name: 'Start microphone' }),
  ).toBeVisible();
  await expect(page.getByLabel('Current note: unavailable')).toHaveText('—');
  await expect(
    page.locator('.readout__continuity', { hasText: 'No pitch' }),
  ).toBeVisible();
  await expect(page.getByText('unvoiced', { exact: true })).toBeVisible();
  await expect(page.getByText('— Hz')).toBeVisible();
  await expect(page.getByText('— cents')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Target guidance' }),
  ).toBeVisible();
  await expect(
    page.getByText(/Select a reference note to enable target guidance/),
  ).toBeVisible();
  const practicePanel = page.getByRole('region', {
    name: 'Practice session',
  });
  await expect(practicePanel).toBeVisible();
  await expect(
    practicePanel.getByRole('button', { name: 'Start practice' }),
  ).toBeDisabled();
  const centsMeter = page.getByRole('meter', {
    name: 'Nearest-note cents meter',
  });
  await expect(centsMeter).toBeVisible();
  await expect(centsMeter.locator('.cents-meter__tick-labels')).toContainText(
    '-50-250+25+50',
  );
  expect((await centsMeter.boundingBox())?.width).toBeGreaterThan(330);
  const setCentsMeterDemo = async (
    frequencyHz: number | null,
    status: 'unvoiced' | 'voiced' | 'uncertain',
    timestampMs: number | null,
    practiceMicrophoneActive?: boolean,
  ) => {
    await page.evaluate(
      ({ frequencyHz, status, timestampMs, practiceMicrophoneActive }) =>
        window.dispatchEvent(
          new CustomEvent('vocal-tuner:cents-meter-demo', {
            detail: {
              frequencyHz,
              status,
              timestampMs,
              practiceMicrophoneActive,
            },
          }),
        ),
      {
        frequencyHz,
        status,
        timestampMs,
        practiceMicrophoneActive,
      },
    );
  };
  const frequencyAtMidi = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

  await setCentsMeterDemo(frequencyAtMidi(69.04), 'voiced', 100);
  await expect(centsMeter).toHaveAttribute(
    'aria-valuetext',
    'Pitch is +4.0 cents, in tune with the nearest note.',
  );
  await expect(page.locator('.cents-meter__classification')).toHaveText(
    'In tune',
  );
  await setCentsMeterDemo(frequencyAtMidi(68.88), 'voiced', 167);
  await expect(page.locator('.cents-meter__classification')).toHaveText('Flat');
  await setCentsMeterDemo(frequencyAtMidi(69.12), 'voiced', 234);
  await expect(page.locator('.cents-meter__classification')).toHaveText(
    'Sharp',
  );
  const marker = page.locator('.cents-meter__marker');
  const heldMarkerPosition = await marker.evaluate(
    (element) => (element as HTMLElement).style.left,
  );
  await setCentsMeterDemo(frequencyAtMidi(69.12), 'uncertain', 234);
  await expect(centsMeter).toHaveClass(/cents-meter--uncertain/);
  expect(
    await marker.evaluate((element) => (element as HTMLElement).style.left),
  ).toBe(heldMarkerPosition);
  await setCentsMeterDemo(null, 'unvoiced', null);
  await expect(marker).toHaveAttribute('data-visible', 'false');
  await setCentsMeterDemo(frequencyAtMidi(59.49), 'voiced', 300);
  await expect
    .poll(() =>
      marker.evaluate((element) =>
        Number.parseFloat((element as HTMLElement).style.left),
      ),
    )
    .toBeCloseTo(99, 4);
  await setCentsMeterDemo(frequencyAtMidi(59.51), 'voiced', 367);
  await expect
    .poll(() =>
      marker.evaluate((element) =>
        Number.parseFloat((element as HTMLElement).style.left),
      ),
    )
    .toBeCloseTo(1, 4);
  await expect(
    page.getByRole('img', {
      name: 'Live pitch history from C3 to C5 over the last 15 seconds.',
    }),
  ).toBeVisible();
  const canvas = page.getByTestId('pitch-grid-canvas');
  await expect(canvas).toBeVisible();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(0);
  expect(canvasBox?.height).toBeGreaterThan(0);
  const curveCanvas = page.getByTestId('pitch-curve-canvas');
  await expect(curveCanvas).toBeVisible();
  const curveCanvasBox = await curveCanvas.boundingBox();
  expect(curveCanvasBox?.width).toBe(canvasBox?.width);
  expect(curveCanvasBox?.height).toBe(canvasBox?.height);
  const referenceKeyboard = page.getByRole('group', {
    name: 'Reference keyboard',
  });
  await expect(referenceKeyboard).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reference note C4, 261.6 hertz' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reference note A4, 440.0 hertz' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reference note C3, 130.8 hertz' }),
  ).toBeVisible();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone stopped',
  );
  await expect(
    page.getByRole('slider', { name: 'Reference drone volume' }),
  ).toBeVisible();
  await expect(page.getByText(/Headphones are recommended/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Reference note C4, 261.6 hertz' })
    .click();
  await expect(page.getByLabel('Reference note status')).toContainText(
    'Reference note selected: C4, 261.6 Hz',
  );
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'could not start',
  );
  await expect(page.getByText('C4 · 261.6 Hz', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Raise the pitch', { exact: true }),
  ).toBeVisible();
  await expect(
    practicePanel.getByRole('button', { name: 'Start practice' }),
  ).toBeDisabled();
  await expect(
    page.getByLabel('Reference-drone diagnostics values'),
  ).toContainText('suspended');
  expect(
    await page.evaluate(
      () =>
        (
          window as Window & {
            __droneMock: { oscillatorStarts: number };
          }
        ).__droneMock.oscillatorStarts,
    ),
  ).toBe(1);
  await page.evaluate(() => {
    (
      window as Window & {
        __droneMock: { allowResume: boolean };
      }
    ).__droneMock.allowResume = true;
  });
  await page
    .getByRole('button', { name: 'Reference note C4, 261.6 hertz' })
    .click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing C4 at 261.6 Hz',
  );
  await expect(
    page.getByLabel('Reference-drone diagnostics values'),
  ).toContainText('running');
  await expect(
    page.getByLabel('Reference-drone diagnostics values'),
  ).toContainText('0.040');
  await page
    .getByRole('button', {
      name: 'Reference note C4, 261.6 hertz, reference drone sounding',
    })
    .click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone stopped',
  );
  await page
    .getByRole('button', { name: 'Reference note A4, 440.0 hertz' })
    .click();
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing A4 at 440.0 Hz',
  );
  await setCentsMeterDemo(frequencyAtMidi(69), 'voiced', 500);
  const targetMeter = page.getByRole('meter', {
    name: 'Selected-target cents meter',
  });
  await expect(targetMeter).toBeVisible();
  await expect(page.getByText('On target', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Within 10 cents of A4', { exact: true }),
  ).toBeVisible();
  await expect(targetMeter).toHaveAttribute('data-off-scale', 'false');
  await setCentsMeterDemo(frequencyAtMidi(68.8), 'voiced', 700);
  await expect(
    page.getByText('Raise the pitch', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('20.0 cents below A4', { exact: true }),
  ).toBeVisible();
  await setCentsMeterDemo(frequencyAtMidi(69.2), 'voiced', 900);
  await expect(
    page.getByText('Lower the pitch', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('20.0 cents above A4', { exact: true }),
  ).toBeVisible();
  await setCentsMeterDemo(frequencyAtMidi(70), 'voiced', 1100);
  await expect(
    page.getByText('1 semitone above A4', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Different note')).toBeVisible();
  await expect(targetMeter).toHaveAttribute('data-off-scale', 'right');
  await expect(targetMeter).toHaveAttribute('aria-valuenow', '50');
  const targetMarker = page.locator('.target-meter__marker');
  const heldTargetMarkerPosition = await targetMarker.evaluate(
    (element) => (element as HTMLElement).style.left,
  );
  await setCentsMeterDemo(frequencyAtMidi(70), 'uncertain', 1100);
  await expect(page.locator('.target-guidance')).toHaveClass(
    /target-guidance--uncertain/,
  );
  expect(
    await targetMarker.evaluate(
      (element) => (element as HTMLElement).style.left,
    ),
  ).toBe(heldTargetMarkerPosition);
  await setCentsMeterDemo(null, 'unvoiced', null);
  await expect(page.getByText('A4 · 440.0 Hz', { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Target guidance' })
      .getByText('No pitch detected.'),
  ).toBeVisible();
  await expect(targetMeter).toHaveCount(0);
  await setCentsMeterDemo(
    null,
    'unvoiced',
    await page.evaluate(() => performance.now()),
    true,
  );
  const startPractice = practicePanel.getByRole('button', {
    name: 'Start practice',
  });
  await expect(startPractice).toBeEnabled();
  await startPractice.click();
  await expect(practicePanel.getByText('Practice running')).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Reference note A4, 440.0 hertz, reference drone sounding',
    }),
  ).toHaveAttribute('aria-disabled', 'true');

  const publishPracticeObservation = async (
    frequencyHz: number | null,
    status: 'unvoiced' | 'voiced' | 'uncertain',
  ) => {
    await setCentsMeterDemo(
      frequencyHz,
      status,
      await page.evaluate(() => performance.now()),
      true,
    );
  };
  const liveMetrics = practicePanel.getByLabel('Live practice metrics');
  const measuredVoiceValue = liveMetrics
    .getByText('Measured voice', { exact: true })
    .locator('..')
    .locator('dd');
  const onTargetValue = liveMetrics
    .getByText('On target', { exact: true })
    .locator('..')
    .locator('dd');
  await publishPracticeObservation(frequencyAtMidi(69), 'voiced');
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69), 'voiced');
  await expect(measuredVoiceValue).not.toHaveText('0.0 s');
  await expect(onTargetValue).not.toHaveText('0.0 s');
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69.2), 'voiced');
  await expect(
    practicePanel.getByText('Current observation: Off target'),
  ).toBeVisible();
  const onTargetBeforeOffTarget = await onTargetValue.textContent();
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69.2), 'voiced');
  await expect(measuredVoiceValue).not.toHaveText('0.0 s');
  expect(await onTargetValue.textContent()).toBe(onTargetBeforeOffTarget);
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69.2), 'uncertain');
  await expect(
    practicePanel.getByText('Current observation: Briefly uncertain'),
  ).toBeVisible();
  const measuredBeforeUncertainty = await measuredVoiceValue.textContent();
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69.2), 'uncertain');
  expect(await measuredVoiceValue.textContent()).toBe(
    measuredBeforeUncertainty,
  );
  await expect(
    practicePanel.getByText('Current observation: Briefly uncertain'),
  ).toBeVisible();
  await page.waitForTimeout(80);
  await publishPracticeObservation(null, 'unvoiced');
  await expect(
    practicePanel.getByText('Current observation: No pitch detected'),
  ).toBeVisible();
  await page.waitForTimeout(80);
  await publishPracticeObservation(null, 'unvoiced');
  await expect(
    practicePanel.getByRole('heading', { name: 'Session timeline' }),
  ).toHaveCount(0);

  await practicePanel.getByRole('button', { name: 'Pause practice' }).click();
  const frozenMetrics = await liveMetrics.textContent();
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69), 'voiced');
  expect(await liveMetrics.textContent()).toBe(frozenMetrics);
  await practicePanel.getByRole('button', { name: 'Resume practice' }).click();
  await expect(practicePanel.getByText('Practice running')).toBeVisible();
  await publishPracticeObservation(frequencyAtMidi(69), 'voiced');
  await page.waitForTimeout(80);
  await publishPracticeObservation(frequencyAtMidi(69), 'voiced');
  await practicePanel.getByRole('button', { name: 'Finish practice' }).click();
  await expect(practicePanel.getByText('Practice completed')).toBeVisible();
  await expect(
    practicePanel.getByLabel('Completed practice summary'),
  ).toContainText('Measured voice');
  await expect(practicePanel.getByText(/On-target share:/)).toBeVisible();
  const timeline = practicePanel.getByLabel('Practice events');
  await expect(
    practicePanel.getByRole('heading', { name: 'Session timeline' }),
  ).toBeVisible();
  for (const type of [
    'on-target',
    'off-target',
    'uncertain',
    'no-pitch',
    'unobserved',
    'paused',
  ])
    await expect(
      timeline.locator(
        `.practice-timeline__segment[data-event-type="${type}"]`,
      ),
    ).not.toHaveCount(0);
  const firstTimelineEvent = timeline
    .locator('.practice-timeline__segment[data-event-type="on-target"]')
    .first();
  await firstTimelineEvent.click();
  await expect(firstTimelineEvent).toHaveAttribute('aria-expanded', 'true');
  await expect(firstTimelineEvent.getByRole('tooltip')).toBeVisible();
  await expect(firstTimelineEvent).toHaveAttribute(
    'aria-label',
    /for .+\. \d+% of session\./,
  );
  expect(
    await firstTimelineEvent.evaluate(
      (element) => (element.parentElement as HTMLElement).style.width,
    ),
  ).toMatch(/^max\(1px, /);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await practicePanel
      .getByLabel('Timeline legend')
      .evaluate((element) => getComputedStyle(element).flexWrap),
  ).toBe('wrap');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(practicePanel).not.toContainText(
    /score|grade|recording|replay/i,
  );
  await practicePanel.getByRole('button', { name: 'Practice again' }).click();
  await expect(practicePanel.getByText('Practice ready')).toBeVisible();
  await expect(
    practicePanel.getByRole('button', { name: 'Start practice' }),
  ).toBeEnabled();
  await expect(
    page.getByText('Start the microphone to begin pitch history.'),
  ).toBeVisible();
  await expect(page.getByLabel('Pitch history summary')).toContainText('15 s');
  await expect(
    page.getByRole('button', { name: 'Clear history' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Pause history' }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: 'C3–C5' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Shift graph down one octave' }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Shift graph up one octave' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'C2–C4' }).click();
  await expect(
    page.getByRole('img', {
      name: 'Live pitch history from C2 to C4 over the last 15 seconds.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'C2–C4' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Shift graph down one octave' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Reference note C2, 65.4 hertz' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reference note C4, 261.6 hertz' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reference note C5, 523.3 hertz' }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Reference drone status')).toContainText(
    'Reference drone playing A4 at 440.0 Hz',
  );
  await expect(
    page
      .getByRole('region', { name: 'Target guidance' })
      .getByText('A4 · 440.0 Hz', { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText('Reference drone A4 is outside the visible graph range.'),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'History inactive' }),
  ).toBeVisible();
  await expect(
    page.getByRole('status', { name: 'Microphone status' }),
  ).toContainText('Microphone inactive');
  await expect(
    page.getByRole('status', { name: 'Pitch detector status' }),
  ).toContainText('Inactive');
  await expect(
    page.getByRole('meter', { name: 'Microphone input level' }),
  ).toHaveAttribute('aria-valuenow', '0');
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(centsMeter.locator('.cents-meter__tick-labels')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(centsMeter).toHaveAttribute('data-reduced-motion', 'true');
  expect(pageErrors).toEqual([]);
});
