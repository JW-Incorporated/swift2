import { expect, test as base, type Page } from '@playwright/test';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const FIXED_TIME = new Date('2026-01-01T12:00:00Z');

/**
 * Auto-fixture: aborts and records any non-local request, records pageerror and
 * console.error, and fails the test if either fired. Installs a fixed clock.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
      });
      await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        const local =
          LOCAL_HOSTS.has(url.hostname) || ['data:', 'blob:', 'about:'].includes(url.protocol);
        if (local) return route.continue();
        problems.push(`external request blocked: ${url.href}`);
        return route.abort();
      });
      await page.clock.install({ time: FIXED_TIME });
      await use();
      expect(problems, 'page must load with no errors and no external requests').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Load the test page and block until it is genuinely rendered (never a blank-page pass). */
export async function openParityPage(page: Page, query = ''): Promise<void> {
  await page.goto(`/${query}`);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.evaluate(async () => {
    await document.fonts.load('700 16px "WP04 Playfair"');
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => document.fonts.check('700 16px "WP04 Playfair"'))).toBe(true);
  await expect(page.getByText('Row 50', { exact: true })).toHaveCount(1);
}

export async function openDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open dialog' }).click();
  await expect(page.locator('[role="dialog"][data-state="open"]')).toBeVisible();
}

export async function scrollListToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const list = document.querySelector('ul');
    if (list) list.scrollTop = list.scrollHeight;
  });
  await expect(page.getByText('Row 50', { exact: true })).toBeInViewport();
}
