import { expect, test } from '@playwright/test';

test('loads the initial tuner screen', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Vocal Tuner' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start microphone' }),
  ).toBeVisible();
  await expect(page.getByLabel('Current note: unavailable')).toHaveText('—');
  await expect(page.getByText('— Hz')).toBeVisible();
  await expect(page.getByText('— cents')).toBeVisible();
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
  await expect(
    page.getByText('Start the microphone to begin pitch history.'),
  ).toBeVisible();
  await expect(page.getByLabel('Pitch history summary')).toContainText('15 s');
  await expect(
    page.getByRole('button', { name: 'Clear history' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('status', { name: 'Microphone status' }),
  ).toContainText('Microphone inactive');
  await expect(
    page.getByRole('status', { name: 'Pitch detector status' }),
  ).toContainText('Inactive');
  await expect(
    page.getByRole('meter', { name: 'Microphone input level' }),
  ).toHaveAttribute('aria-valuenow', '0');
});
