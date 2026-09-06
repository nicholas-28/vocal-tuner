import { expect, test } from '@playwright/test';

test('production deployment loads safely without activating public mock flags', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const permissionProbe = { requests: 0 };
    Object.defineProperty(window, '__permissionProbe', {
      configurable: true,
      value: permissionProbe,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          permissionProbe.requests += 1;
          throw new DOMException(
            'Not allowed in smoke test',
            'NotAllowedError',
          );
        },
      },
    });
  });
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto(
    '/deployment/smoke?droneDiagnostics=1&droneDebug=1&centsMeterDemo=1&audioDiagnostics=1',
  );

  await expect(
    page.getByRole('heading', { name: 'Vocal Tuner' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start microphone' }),
  ).toBeVisible();
  await expect(page.getByLabel('Current note: unavailable')).toHaveText('—');
  await expect(
    page.getByRole('group', { name: 'Reference keyboard' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Practice session' }),
  ).toBeVisible();
  await expect(page.getByLabel('Pitch detector diagnostics')).toHaveCount(0);
  await expect(
    page.getByText('Reference-drone diagnostics', { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Deployment build information')).toHaveCount(0);
  await expect(
    page.getByText('Reference audio diagnostics', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play 1-second output test' }),
  ).toBeVisible();

  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('vocal-tuner:cents-meter-demo', {
        detail: {
          frequencyHz: 440,
          status: 'voiced',
          timestampMs: 100,
          practiceMicrophoneActive: true,
        },
      }),
    ),
  );
  await expect(page.getByLabel('Current note: unavailable')).toHaveText('—');
  await expect(
    page.getByRole('button', { name: 'Start practice' }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        (
          window as Window & {
            __permissionProbe: { requests: number };
          }
        ).__permissionProbe.requests,
    ),
  ).toBe(0);

  const manifestResponse = await page.request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  expect(await manifestResponse.json()).toMatchObject({
    name: 'Vocal Tuner',
    display: 'standalone',
  });

  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(await page.locator('html').innerHTML()).not.toMatch(
    /\/Users\/|[A-Za-z]:\\Users\\|token|secret/i,
  );
  await expect(
    page.getByText('Pitch analysis performance', { exact: true }),
  ).toBeVisible();
  await page.goto('/');
  await expect(
    page.getByText('Pitch analysis performance', { exact: true }),
  ).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
