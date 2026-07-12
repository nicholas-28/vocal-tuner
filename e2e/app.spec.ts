import { expect, test } from '@playwright/test';

test('loads the initial tuner screen', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Vocal Tuner' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start microphone' }),
  ).toBeVisible();
  await expect(page.getByLabel('Empty semitone grid')).toBeVisible();
});
