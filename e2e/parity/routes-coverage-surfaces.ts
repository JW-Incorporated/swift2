import { stubBridgeApiOnB } from './b-api';
import type { AOnlyRoute } from './routes';
import { expect, type Page } from '@playwright/test';

// Sub-surface clips (moment banner/rumors/shop, merch style + submit form, clown board, mood song card). Each is `sides: 'both'`
// with a `clip` tagged by `show` (same machinery as routes-coverage.ts, kept local so the two files do not import each other).
// The only third-party content is the mood card's YouTube poster, which the harness already answers with the grey placeholder.
const CLIP = '[data-parity-clip]';
// Scrolling lands the clip, but the viewport baseline also shows lazy images above and below it: load every image first, then
// scroll again, so the viewport capture cannot depend on when those images painted.
const loadAllImages = (page: Page): Promise<void> =>
  page.evaluate(async () => {
    const imgs = Array.from(document.images);
    for (const img of imgs) if (img.loading === 'lazy') img.loading = 'eager';
    await Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
  });
const show = async (page: Page, selector: string): Promise<void> => {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  await loadAllImages(page);
  await el.scrollIntoViewIfNeeded();
  await el.evaluate((node) => node.setAttribute('data-parity-clip', ''));
};

// tloas items from the frozen fixture: reputable_reporting + one rumor, and an item with three products.
const RUMOR_ITEM = '/?item=vault-tloas-a-tented-lawn-in-rhode-island-two-weeks-before-the-wedding';
const SHOP_ITEM = '/?item=vault-tloas-her-first-night-out-as-a-newlywed-a-lavender-minidress-and-a';

const MOOD_ANSWER =
  JSON.stringify({
    kind: 'matches',
    intro: 'Parity fixture intro, fixed for the screenshot.',
    picks: [
      {
        slug: 'parity-song',
        title: 'Parity Song',
        eraId: 'fearless',
        youtubeId: 'aaaaaaaaaaa',
        oneLiner: 'A fixed one-liner for the song card.',
        score: 0.9,
      },
    ],
  }) + '\n';

export const SURFACE_COVERAGE_ROUTES: readonly AOnlyRoute[] = [
  {
    name: 'moment-confidence-banner',
    path: RUMOR_ITEM,
    root: '[role="dialog"]',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, '[role="note"][aria-label^="Reported"]'),
  },
  {
    name: 'moment-rumor-section',
    path: RUMOR_ITEM,
    root: '[role="dialog"]',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, 'section[aria-label^="What\'s rumored"]'),
  },
  {
    name: 'moment-shop-the-look',
    path: SHOP_ITEM,
    root: '[role="dialog"]',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, '.era-card:has(> ul a[aria-label^="Shop "])'),
  },
  {
    name: 'merch-style-section',
    path: '/?mode=merch',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, '#merch-style'),
  },
  {
    name: 'merch-submit-link-form',
    path: '/?mode=merch',
    root: 'main',
    sides: 'both',
    // Accepted divergence: the app hands off to the website's form (Turnstile cannot run in the DOM host); see docs/one-ui/parity.md.
    divergent: true,
    clip: CLIP,
    prepare: (page) => show(page, 'section:has(> h2:text-is("Found something we should add?"))'),
  },
  {
    name: 'clown-board',
    path: '/?mode=clownbot',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, 'section[aria-label="Clown board"]'),
  },
  {
    name: 'mood-song-card',
    path: '/?mode=mood',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    init: (page) => stubBridgeApiOnB(page, { '/api/mood': MOOD_ANSWER }),
    prepare: async (page) => {
      await page.route('**/api/mood', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: MOOD_ANSWER }));
      await page.locator('#mood-input').fill('parity mood');
      await page.getByRole('button', { name: 'Find songs' }).click();
      await show(page, 'section[aria-label="Songs that match"] article');
      // Focus-neutral capture: the composer's focus-within ring plus a platform focus difference after submit.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    },
  },
];
