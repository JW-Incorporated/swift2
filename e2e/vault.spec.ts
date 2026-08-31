import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * E2E smoke tests for the live web Vault (see playwright.config.ts for the
 * target URL). These are deliberately RESILIENT to content growth: they assert
 * on roles / text and avoid brittle hard-coded counts. They add NO markup to
 * production components: everything is driven through accessible roles/labels
 * that already exist in the UI (dialogs, the era timeline scrubber, the
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
  // Was a heuristic on inline style ("the only full-width left-aligned
  // button"). That matched ZERO elements after the feed moved to a tier-driven
  // grid, and the heuristic was always going to be fragile. Every card now
  // carries `data-ll-item`, which is exactly the stable hook the original
  // comment here asked a future change to provide.
  return scope.locator('[data-ll-item]');
}

// A genuine moment card only — excludes the egg/thread "doorway" cards
// (DoorwayCard.tsx) that deliberately share `data-ll-item` and the same card
// silhouette so the timeline scrubber measures them as real rail anchors too.
// A doorway opens TheoryGuide or switches to Threads mode, not a MomentDetail
// sheet named after its own heading, so picking `monthItems().first()`
// indiscriminately breaks whenever content ordering puts a doorway first.
function realMomentItems(scope: Page | Locator): Locator {
  return monthItems(scope).filter({
    hasNotText: /See this in Theories & eggs|Follow this thread/,
  });
}

// The reader is a client component that hydrates and then auto-scrolls to the
// most recent era. Wait until it's interactive before poking at it.
async function gotoVault(page: Page) {
  await page.goto('/');
  // This used to wait on the nav-mode tablist's "Eras" tab. That tablist
  // (TopBar's ModeToggle) is wrapped in `hidden md:block` — mobile gets the
  // BottomNav rail instead, whose buttons carry no `role="tab"` at all — so
  // the locator could never match on the mobile-chrome project, by design,
  // on every run. The "open the eras menu" button is the one hydration
  // signal both layouts always render unconditionally: its label only
  // reflects the real current era once the client store has hydrated, so
  // its presence proves interactivity, on both mobile and desktop.
  await expect(page.getByRole('button', { name: /open the eras menu/i })).toBeVisible();
}

/**
 * Step into an era via the "Choose an era" overlay, where the timeline and
 * its scrubber live. Matches the scrubber by SUFFIX so the era name can
 * change without breaking this again.
 *
 * There is no more separate era-chooser landing page (LongLive.tsx, R1
 * 2026-08-14: "the front door is now the era stream itself") — you land
 * straight inside the current era, and EraGrid's tiles only exist inside
 * this dialog now. Scoped to the dialog so an era name that also shows up
 * in ordinary vault content (a thread, a moment's text) can't match instead.
 */
async function enterEra(page: Page, name = 'Showgirl') {
  await page.getByRole('button', { name: /open the eras menu/i }).click();
  const selector = page.getByRole('dialog', { name: 'Choose an era' });
  await expect(selector).toBeVisible();
  await selector.getByRole('button', { name: new RegExp(`^${name}`, 'i') }).first().click();
  await expect(page.getByRole('slider', { name: /timeline scrubber$/i })).toBeVisible();
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

    // There is no more separate era-chooser landing page (LongLive.tsx, R1
    // 2026-08-14) — the front door is the current era's stream, and the
    // one-button-per-era grid now lives inside the "Choose an era" dialog.
    // Scoped to the dialog: the background stream stays mounted behind it,
    // and moment cards/threads can carry these same names or 4-digit years
    // in their own text.
    await page.getByRole('button', { name: /open the eras menu/i }).click();
    const selector = page.getByRole('dialog', { name: 'Choose an era' });
    await expect(selector).toBeVisible();

    // Count the chooser entries without pinning an exact number so a new era
    // cannot break it.
    const eraButtons = selector.getByRole('button', { name: /\d{4}/ });
    expect(await eraButtons.count()).toBeGreaterThanOrEqual(8);

    // Known, stable era names must be offered.
    for (const title of ['Fearless', 'Midnights', '1989', 'Lover']) {
      await expect(
        selector.getByRole('button', { name: new RegExp(`^${title}`, 'i') }).first(),
      ).toBeVisible();
    }
  });

  test('per-era category filter hides non-matching items without jumping', async ({ page }) => {
    await gotoVault(page);

    // R2 (FilterBar.tsx): category filtering is no longer a per-era "Filter"
    // toggle that expands into a chip group scoped to that era's section.
    // It's now ONE global sticky bar — role="group", aria-label "Filter the
    // timeline" — mounted once by EraStream with an always-visible "All"
    // chip plus one chip per topic tag. No toggle to find or expand; that's
    // what the 45s timeout on `getByRole('button', { name: /^Filter/ })` was
    // actually waiting on — a button that no longer exists. The filter still
    // applies within whichever era section is on screen, so scope the
    // before/after item counts to it, same as before.
    const filterBar = page.getByRole('group', { name: 'Filter the timeline' });
    await expect(filterBar).toBeVisible();

    const chipButtons = filterBar.getByRole('button');
    expect(
      await chipButtons.count(),
      'expected the "All" chip plus 2+ category chips',
    ).toBeGreaterThanOrEqual(3);

    const era = page.locator('section[data-ll-section]').first();
    await expect(era).toBeVisible();

    const before = await monthItems(era).count();
    expect(before).toBeGreaterThan(0);

    // Record scroll position right before applying the filter.
    const beforeScroll = await scrollTop(page);

    // Chip 0 is "All" (clears the set) — skip it and pick the first real
    // category chip, then read its label so we can verify what survives.
    const chip = chipButtons.nth(1);
    const label = (await chip.innerText()).trim();
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    // Fewer items than before, but not zero — non-matching items were hidden in
    // place.
    await expect.poll(async () => monthItems(era).count()).toBeLessThan(before);
    const after = await monthItems(era).count();
    expect(after).toBeGreaterThan(0);

    // At least one surviving card shows the selected category's badge, so we
    // know the RIGHT category survived rather than an arbitrary subset.
    //
    // This deliberately no longer asserts on EVERY surviving card. The tiered
    // grid (#1017 / the founder's "smaller size for fluff, more screen for big
    // events") renders no TagRow on the compact tier, so a small card that
    // matches the filter correctly still shows no badge to match against. The
    // old every-card loop encoded a single-tier layout and would now fail on
    // correct behaviour.
    await expect(monthItems(era).filter({ hasText: label }).first()).toBeVisible();

    // Toggling the chip back off restores the full set — the items were hidden
    // in place, not dropped. This is the part the every-card loop was really
    // protecting, and it holds regardless of which tier renders a badge.
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => monthItems(era).count()).toBe(before);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');

    // The scrubber / page did not jump while filtering in place.
    const afterScroll = await scrollTop(page);
    expect(Math.abs(afterScroll - beforeScroll)).toBeLessThanOrEqual(4);
  });

  test('merch All items clears an active product-kind filter', async ({ page }) => {
    await gotoVault(page);

    // The desktop tab rail and mobile primary navigation both expose the same
    // accessible Merch control, so this covers both Playwright viewports.
    await page.getByRole('button', { name: 'Merch' }).click();

    const allItems = page.getByRole('button', { name: 'All items' });
    const dresses = page.getByRole('button', { name: 'Dresses' });
    await expect(allItems).toBeVisible();
    await expect(dresses).toBeVisible();
    await expect(allItems).toHaveAttribute('aria-pressed', 'true');

    await dresses.click();
    await expect(dresses).toHaveAttribute('aria-pressed', 'true');
    await expect(allItems).toHaveAttribute('aria-pressed', 'false');

    await allItems.click();
    await expect(dresses).toHaveAttribute('aria-pressed', 'false');
    await expect(allItems).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking a month item opens the moment detail sheet and closes it', async ({ page }) => {
    await gotoVault(page);
    await enterEra(page);

    // `.first()` on ALL `data-ll-item` cards is content-order-dependent: an
    // egg/thread doorway card can sort first, and clicking one opens
    // TheoryGuide (or switches to Threads mode) instead of a MomentDetail
    // sheet named after itself — that mismatch, not a broken sheet, is what
    // made this locator time out. realMomentItems excludes those doorways.
    const item = realMomentItems(page).first();
    await item.scrollIntoViewIfNeeded();
    // The card's TITLE, via its heading. This used to read `span` #1, which is
    // the DATE ("December 25") — MomentMeta renders the date label first. So
    // the test then waited 15s for a dialog named after a date and timed out on
    // every run, while the sheet itself opened correctly. Every card tier
    // (event / compact / default) puts the title in an h3, so this holds across
    // the tier-driven grid rather than depending on span order within it.
    const itemTitle = (await item.getByRole('heading').first().innerText()).trim();

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
    await enterEra(page);

    const trackButton = page.getByRole('button', { name: /Track guide/ }).first();
    await trackButton.scrollIntoViewIfNeeded();
    await trackButton.click();

    const dialog = page.getByRole('dialog', { name: /track guide/i });
    // The dialog's accessible NAME is "<era> track guide"; its headings are the
    // album and its song titles, so asserting a /track guide/ heading inside it
    // was checking for something that never existed.
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading').first()).toBeVisible();

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('era scrubber navigates between eras and is reachable while scrolling', async ({ page }) => {
    await gotoVault(page);
    await enterEra(page);

    const slider = page.getByRole('slider', { name: /timeline scrubber$/i });
    await expect(slider).toBeVisible();

    // The reader opens on the most recent era.
    const startValue = await slider.getAttribute('aria-valuenow');
    // aria-valuetext is a MONTH ("Jul 2026"), not an album/era name — the
    // `startAlbum` naming this replaces dated from when it was the latter.
    const startMonth = await slider.getAttribute('aria-valuetext');
    expect(startValue).not.toBeNull();

    // Keyboard nav is the deterministic path (pointer-drag is flaky headless).
    //
    // ArrowDOWN, not Up. The rail is oriented newest-at-top, so ArrowUp steps
    // toward `end` (newer) via Math.min(end, ...) — and the reader opens ALREADY
    // at the newest date, which makes ArrowUp a no-op there. The test pressed
    // ArrowUp and then waited for a value change that could never come. The old
    // comment here asserted the opposite of what the component does.
    await slider.focus();
    await page.keyboard.press('ArrowDown');

    await expect.poll(async () => slider.getAttribute('aria-valuenow')).not.toBe(startValue);

    // The month label needs MORE than one press. A step is span/24, so inside a
    // dense era a single step often lands in the same month — asserting a
    // changed month after one ArrowDown failed on correct behaviour. Keep
    // stepping until the label moves, which is the real claim: scrubbing
    // actually travels through time.
    await expect
      .poll(
        async () => {
          const now = await slider.getAttribute('aria-valuetext');
          if (now !== startMonth) return now;
          await page.keyboard.press('ArrowDown');
          return startMonth;
        },
        { timeout: 15_000 },
      )
      .not.toBe(startMonth);

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
