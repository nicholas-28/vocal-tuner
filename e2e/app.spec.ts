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
  await expect(page.getByLabel('Empty semitone grid')).toBeVisible();
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
