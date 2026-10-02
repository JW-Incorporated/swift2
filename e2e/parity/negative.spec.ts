import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Page, TestInfo } from '@playwright/test';
import { expect, openParityPage, test } from './helpers';

// Proves the tolerance catches real regressions and ignores sub-pixel noise.
// Self-referential (reference captured on this machine), so it runs on any OS
// and needs no committed PNGs. Mutations come from the ?mutate= hook that lives
// only in apps/mobile/index.web.tsx.
const OPTS = { maxDiffPixels: 200, threshold: 0.2 };

/** True when the mutated page still matches the unmutated reference within tolerance. */
async function matchesReference(page: Page, testInfo: TestInfo, mutate: string): Promise<boolean> {
  const name = `negative-${mutate}.png`;
  const refPath = testInfo.snapshotPath(name);
  await openParityPage(page);
  mkdirSync(dirname(refPath), { recursive: true });
  writeFileSync(
    refPath,
    await page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' }),
  );
  try {
    await openParityPage(page, `?mutate=${mutate}`);
    await expect(page.getByRole('button', { name: 'Switch era' })).toBeVisible();
    return await expect(page)
      .toHaveScreenshot(name, OPTS)
      .then(
        () => true,
        () => false,
      );
  } finally {
    unlinkSync(refPath);
  }
}

test.describe('tolerance', () => {
  test('a 4px shift of one small element fails', async ({ page }, testInfo) => {
    expect(await matchesReference(page, testInfo, 'shift')).toBe(false);
  });

  test('a single colour change fails', async ({ page }, testInfo) => {
    expect(await matchesReference(page, testInfo, 'colour')).toBe(false);
  });

  test('a sub-pixel blur passes', async ({ page }, testInfo) => {
    expect(await matchesReference(page, testInfo, 'blur')).toBe(true);
  });
});
