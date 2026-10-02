import { expect, openDialog, openParityPage, scrollListToBottom, test } from './helpers';

// Baselines are Linux-only (generated in the pinned Playwright container).
test.skip(process.platform !== 'linux', 'visual baselines are Linux-only');

test('home', async ({ page }) => {
  await openParityPage(page);
  await expect(page).toHaveScreenshot('home.png');
});

test('era switched', async ({ page }) => {
  await openParityPage(page);
  await page.getByRole('button', { name: 'Switch era' }).click();
  await expect(page).toHaveScreenshot('era-switched.png');
});

test('dialog open', async ({ page }) => {
  await openParityPage(page);
  await openDialog(page);
  await expect(page).toHaveScreenshot('dialog-open.png');
});

test('list scrolled to bottom', async ({ page }) => {
  await openParityPage(page);
  await scrollListToBottom(page);
  await expect(page).toHaveScreenshot('list-bottom.png');
});
