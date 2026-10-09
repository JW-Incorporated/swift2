import type { AOnlyRoute } from './routes';
import { expect } from '@playwright/test';

const SEARCH_DIALOG = '[role="dialog"][aria-label="Search the archive"]';
const SEARCH_OPEN_BUTTON = 'button[aria-label="Search the archive (press /)"]';

/** Search empty-state surfaces beyond search-open / search-results (routes.ts): the no-match message, both sides, clip a-vs-b. */
export const SEARCH_ROUTES: readonly AOnlyRoute[] = [
  {
    name: 'search-no-results',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: SEARCH_DIALOG,
    prepare: async (page) => {
      await page.locator(SEARCH_OPEN_BUTTON).first().click();
      await page.locator(`${SEARCH_DIALOG} [role="combobox"]`).fill('zzzqxjv');
      await expect(page.locator(SEARCH_DIALOG).getByText(/No matches for/)).toBeVisible();
    },
  },
];
