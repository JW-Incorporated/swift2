import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * E2E smoke tests for the live web Vault (see playwright.config.ts for the
 * target URL). These are deliberately RESILIENT to content growth: they assert
 * on roles / text and avoid brittle hard-coded counts. They add NO markup to
 * production components: everything is driven through accessible roles/labels
 * that already exist in the UI (dialogs, the "Era timeline" slider, the
 * "Filter" toggle, "Track guide" buttons).
 *
 * The one exception is the tappable moment card, which has no role/label of its
 * own. It is the only full-width, left-aligned button in an era's content
 * column (the era controls are centered pills), so we select it structurally.
 * If a future change gives it a `data-testid`, prefer that here.
 */

// A moment card: the full-width, left-aligned button in the timeline (vs. the
// pill-shaped era controls). Scoped to a given era section or the whole page.
function monthItems(scope: Page | Locator): Locator {
  return scope.locator('button[style*="text-align:left"]');
}

// The reader is a client component that hydrates and then auto-scrolls to the
// most recent era. Wait until it's interactive before poking at it.
async function gotoVault(page: Page) {
  await page.goto('/');
  // Era sections are server-rendered; the slider proves hydration happened.
  await expect(page.getByRole('slider', { name: 'Era timeline' })).toBeVisible();
}

// The internal scroll container (everything scrolls inside it, not the window),
// so "did the page jump?" means "did this element's scrollTop change?".
function scrollTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('.era-skin > div');
    return el ? (el as HTMLElement).scrollTop : -1;
  });
}

test.describe('Vault smoke', () => {
  test('homepage renders multiple eras with known titles', async ({ page }) => {
    await gotoVault(page);

    // Several of the 11 eras are present (allow content to grow; never assert an
    // exact count that a new era would break).
    const eraSections = page.locator('section[data-era]');
    expect(await eraSections.count()).toBeGreaterThanOrEqual(8);

    // Known, stable era titles must appear (server-rendered into the DOM even
    // when scrolled out of view).
    for (const title of ['Fearless', 'Midnights', '1989', 'Lover']) {
      await expect(page.getByRole('heading', { name: new RegExp(`The ${title} era`) })).toHaveCount(
        1,
      );
    }
  });

  test('per-era category filter hides non-matching items without jumping', async ({ page }) => {
    await gotoVault(page);

    // Find the first era that offers a filter with at least two categories, so
    // selecting one category is guaranteed to hide some items.
    const eras = page.locator('section[data-era]');
    const count = await eras.count();

    let target: Locator | null = null;
    let chips: Locator | null = null;
    for (let i = 0; i < count; i += 1) {
      const era = eras.nth(i);
      const filterToggle = era.getByRole('button', { name: /^Filter/ });
      if ((await filterToggle.count()) === 0) continue;
      await filterToggle.first().scrollIntoViewIfNeeded();
      await filterToggle.first().click();
      const group = era.getByRole('group', { name: /Filter .* by category/ });
      const chipButtons = group.getByRole('button');
      if ((await chipButtons.count()) >= 2) {
        target = era;
        chips = chipButtons;
        break;
      }
      // Not enough categories here — collapse and keep looking.
      await filterToggle.first().click();
    }

    expect(target, 'expected at least one era with a 2+ category filter').not.toBeNull();
    const era = target as Locator;
    const chipButtons = chips as Locator;

    const before = await monthItems(era).count();
    expect(before).toBeGreaterThan(0);

    // Record scroll position right before applying the filter.
    const beforeScroll = await scrollTop(page);

    // Select the first category chip and read its label word (the chip is
    // "<emoji> <Label>"; the last span is the plain label) so we can verify what
    // survives the filter.
    const chip = chipButtons.first();
    const label = (await chip.locator('span').last().innerText()).trim();
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    // Fewer items than before, but not zero — non-matching items were hidden in
    // place.
    await expect.poll(async () => monthItems(era).count()).toBeLessThan(before);
    const after = await monthItems(era).count();
    expect(after).toBeGreaterThan(0);

    // Every surviving card carries the selected category's badge.
    for (let i = 0; i < after; i += 1) {
      await expect(monthItems(era).nth(i)).toContainText(label);
    }

    // The scrubber / page did not jump while filtering in place.
    const afterScroll = await scrollTop(page);
    expect(Math.abs(afterScroll - beforeScroll)).toBeLessThanOrEqual(4);
  });

  test('clicking a month item opens the moment detail sheet and closes it', async ({ page }) => {
    await gotoVault(page);

    const item = monthItems(page).first();
    await item.scrollIntoViewIfNeeded();
    const itemTitle = (await item.locator('span').first().innerText()).trim();

    await item.click();

    // The moment sheet is a modal dialog labelled by the item's title. Even a
    // "no extra detail yet" response still opens the sheet.
    const dialog = page.getByRole('dialog', { name: itemTitle });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: itemTitle })).toBeVisible();

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('track guide sheet opens for an album', async ({ page }) => {
    await gotoVault(page);

    const trackButton = page.getByRole('button', { name: /Track guide/ }).first();
    await trackButton.scrollIntoViewIfNeeded();
    await trackButton.click();

    const dialog = page.getByRole('dialog', { name: /track guide/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /track guide/i })).toBeVisible();

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('era scrubber navigates between eras and is reachable while scrolling', async ({ page }) => {
    await gotoVault(page);

    const slider = page.getByRole('slider', { name: 'Era timeline' });
    await expect(slider).toBeVisible();

    // The reader opens on the most recent era.
    const startValue = await slider.getAttribute('aria-valuenow');
    const startAlbum = await slider.getAttribute('aria-valuetext');
    expect(startValue).not.toBeNull();

    // Keyboard nav is the deterministic path (pointer-drag is flaky headless):
    // ArrowUp moves to an earlier era. The scroll-spy then updates the active
    // era indicator.
    await slider.focus();
    await page.keyboard.press('ArrowUp');

    await expect.poll(async () => slider.getAttribute('aria-valuenow')).not.toBe(startValue);
    const movedAlbum = await slider.getAttribute('aria-valuetext');
    expect(movedAlbum).not.toBe(startAlbum);

    // The navigator remains present and reachable at other scroll positions.
    await page.evaluate(() => {
      const el = document.querySelector('.era-skin > div') as HTMLElement | null;
      if (el) el.scrollTop = 0;
    });
    await expect(slider).toBeVisible();
    await page.evaluate(() => {
      const el = document.querySelector('.era-skin > div') as HTMLElement | null;
      if (el) el.scrollTop = el.scrollHeight;
    });
    await expect(slider).toBeVisible();
  });
});
