import { BASE, expect, openRoute, ROUTES, test } from './helpers';

// Behavioural a-vs-b: tapping a search result closes the search dialog on both sides and leaves the same URL query (the first hit may be an in-page era jump).
const SEARCH_DIALOG = '[role="dialog"][aria-label="Search the archive"]';
const SEARCH_OPEN_BUTTON = 'button[aria-label="Search the archive (press /)"]';

test('search result tap navigates identically on a and b', async ({ pages }) => {
  const landed: Record<'a' | 'b', string> = { a: '', b: '' };
  for (const side of ['a', 'b'] as const) {
    const page = pages[side];
    await openRoute(page, side, ROUTES[0]);
    await page.locator(SEARCH_OPEN_BUTTON).first().click();
    await page.locator(`${SEARCH_DIALOG} [role="combobox"]`).fill('fearless');
    const option = page.locator(`${SEARCH_DIALOG} [role="listbox"] [role="option"]`).first();
    await expect(option).toBeVisible();
    await option.click();
    await expect(page.locator(SEARCH_DIALOG)).toBeHidden();
    landed[side] = new URL(page.url()).search;
    expect(page.url().startsWith(BASE[side])).toBe(true);
  }
  expect(landed.b, 'b lands on the same URL query as a').toBe(landed.a);
});
