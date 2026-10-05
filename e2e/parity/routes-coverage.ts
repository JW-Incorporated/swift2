import { fixture, FIXED_TIME } from './env';
import { A_ONLY_ROUTES, A_ONLY_ROUTES_BETA, FOLLOW_CLIP, LEGAL_MAIN, LIGHTBOX_CLIP, RAIL_CLIP, ROUTES, SCRUBBER_CLIP, serveLegalOnB, type AOnlyRoute } from './routes';
import { PLACEHOLDER_PNG } from './placeholder';
import { assertNoBaselineCollisions } from './sides';
import { expect, type Page } from '@playwright/test';

// W5-parity coverage routes: surfaces that had no a-vs-b comparison (a-only element clips, or nothing). Each is `sides: 'both'`,
// so it gets the a-vs-b viewport compare, a-<name>.png (clip) and b-<name>(-viewport).png baselines. An element `clip` is scrolled
// into view by `prepare` first (captureElement clips the viewport).
const ITEM = `/?item=${fixture.itemId}`;
const ITEM_SOCIAL_PATH = '/?item=vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own';
const DIALOG = '[role="dialog"]';

/** Tags a Playwright-selected element as the clip (CSS-only machinery such as settle cannot take :has-text) and scrolls it into view. */
export const PARITY_CLIP = '[data-parity-clip]';
const show = async (page: Page, selector: string): Promise<void> => {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  await el.scrollIntoViewIfNeeded();
  await el.evaluate((node) => node.setAttribute('data-parity-clip', ''));
};

export const COUNTDOWN_CLIP = '[data-ll-countdown-banner]';
export const ERA_SECRET_CLIP = 'section[aria-label^="Era secret"]';

/** One live countdown (3d 4h after the fixed clock) in the stubbed /vault/live payload: the only way the frozen fixture renders CountdownBanner. */
const COUNTDOWN_ITEM = {
  id: 'parity-countdown',
  observedOn: '2025-12-31',
  eraId: 'tloas',
  category: 'announcement',
  tags: [],
  headline: 'Something is coming',
  summary: 'A countdown is live on the official site.',
  detail: 'A countdown is live on the official site.',
  status: 'reported',
  confidence: 'medium',
  sourceTier: 'press',
  sources: [{ name: 'Official site', url: 'https://www.taylorswift.com/' }],
  symbols: [],
  entities: [],
  heat: 1,
  lastCheckedOn: '2025-12-31',
  expiresAt: '2026-02-01T00:00:00Z',
  updatedAt: '2025-12-31T12:00:00Z',
  redlineOk: true,
  countdownTargetAt: new Date(FIXED_TIME.getTime() + (3 * 24 + 4) * 3_600_000).toISOString(),
};

export const ERA_SELECTOR_CLIP = '[role="dialog"][aria-labelledby="era-selector-title"]';
export const SHARE_MENU_CLIP = '[role="group"][aria-label="Share this moment as an image"]';
export const CLOWN_FULLSCREEN_CLIP = 'div.fixed.inset-0:has(button[aria-label="Exit full screen"])';
export const FEEDBACK_DIALOG_CLIP = '[role="dialog"][aria-label="Send feedback"]';
export const LOVE_ENTRY_CLIP = 'div:has(> button[aria-expanded="true"])';

export const COVERAGE_ROUTES: readonly AOnlyRoute[] = [
  {
    name: 'countdown-banner',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: COUNTDOWN_CLIP,
    // Registered after the harness stub, so it answers first on either origin (local hosts and side b's canonical origin).
    init: async (page) => {
      await page.route(
        (u) => u.pathname.startsWith('/vault/live'),
        (route) => route.fulfill({ json: { items: [COUNTDOWN_ITEM], theories: [], signals: [] } }),
      );
    },
    prepare: async (page) => {
      await expect(page.locator(COUNTDOWN_CLIP)).toBeVisible();
    },
  },
  {
    name: 'era-secret',
    path: '/?era=fearless',
    root: 'main',
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: (page) => show(page, ERA_SECRET_CLIP),
  },
  {
    name: 'era-selector',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: ERA_SELECTOR_CLIP,
    prepare: async (page) => {
      await page.locator('button[aria-label$="open the eras menu"]').first().dispatchEvent('click');
      await expect(page.locator(ERA_SELECTOR_CLIP)).toBeVisible();
    },
  },
  {
    name: 'item-lightbox',
    path: ITEM,
    root: DIALOG,
    sides: 'both',
    clip: LIGHTBOX_CLIP,
    prepare: async (page) => {
      await page.locator('[role="dialog"] button[aria-label="View photo full screen"]').first().click();
      await expect(page.locator(LIGHTBOX_CLIP)).toBeVisible();
    },
  },
  {
    name: 'item-share-menu',
    path: ITEM,
    root: DIALOG,
    sides: 'both',
    clip: SHARE_MENU_CLIP,
    // Opening the menu prefetches both card images (a fetch, not an <img>): answer them on either origin so neither side hits the network.
    init: async (page) => {
      await page.route(
        (u) => u.pathname === '/api/share-card',
        (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PLACEHOLDER_PNG }),
      );
    },
    prepare: async (page) => {
      await page.locator('[role="dialog"] button[aria-label="Share this moment as an image"]').first().click();
      await expect(page.locator(SHARE_MENU_CLIP)).toBeVisible();
    },
  },
  {
    name: 'clownbot-expanded',
    path: '/?mode=clownbot',
    root: 'main',
    sides: 'both',
    clip: CLOWN_FULLSCREEN_CLIP,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Expand to full screen' }).click();
      await expect(page.locator(CLOWN_FULLSCREEN_CLIP)).toBeVisible();
    },
  },
  {
    name: 'love-story-entry',
    path: '/?lens=love-story',
    root: 'main',
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: async (page) => {
      await page.locator('main button[aria-expanded="false"]').first().click();
      await show(page, LOVE_ENTRY_CLIP);
    },
  },
  {
    name: 'item-social-rail',
    path: ITEM_SOCIAL_PATH,
    root: DIALOG,
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: (page) => show(page, RAIL_CLIP),
  },
  {
    name: 'item-social-follow',
    path: ITEM_SOCIAL_PATH,
    root: DIALOG,
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: (page) => show(page, FOLLOW_CLIP),
  },
  {
    name: 'lens-fashion-scrubber',
    path: '/?lens=fashion',
    root: 'main',
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: (page) => show(page, SCRUBBER_CLIP),
  },
  {
    name: 'theory-guide-card',
    path: '/?theories=fearless',
    root: '[role="dialog"][aria-label$="theories and easter eggs"]',
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: (page) => show(page, '[role="dialog"] ol:not(:has(ol)) > li:nth-child(2)'),
  },
  {
    name: 'theory-guide-thread',
    path: '/?theories=fearless',
    root: 'main',
    sides: 'both',
    prepare: async (page) => {
      await page.locator('[role="dialog"]').getByRole('button', { name: /see the whole story|explore Threads/ }).first().click();
      await expect(page.locator('main').getByRole('heading').first()).toBeVisible();
    },
  },
  {
    name: 'decode-reveal',
    path: '/?lens=hidden-clues',
    root: 'main',
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Decode the payoff' }).first().click();
      await show(page, 'article:has(button:has-text("Hide the payoff"))');
    },
  },
  {
    name: 'support-footer',
    path: '/support',
    root: LEGAL_MAIN,
    init: serveLegalOnB,
    sides: 'both',
    clip: PARITY_CLIP,
    prepare: async (page) => {
      await show(page, 'footer');
      const d = await page.evaluate(() => { const f=document.querySelectorAll('footer'); return JSON.stringify({n:f.length,r:[...f].map(e=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height]}),vh:innerHeight,vw:innerWidth,sy:scrollY,dh:document.documentElement.scrollHeight,path:location.pathname}); });
      throw new Error('DEBUGFOOTER '+d);
    },
  },
  {
    name: 'feedback-dialog-open',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: FEEDBACK_DIALOG_CLIP,
    prepare: async (page) => {
      await page.locator('button[aria-label="Send feedback"]').first().dispatchEvent('click');
      await expect(page.locator(FEEDBACK_DIALOG_CLIP)).toBeVisible();
    },
  },
];

/** Every route beyond the two base routes: the lists the a-vs-b, baseline and plumbing specs iterate. */
export const EXTRA_ROUTES: readonly AOnlyRoute[] = [...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA, ...COVERAGE_ROUTES];
assertNoBaselineCollisions(ROUTES, EXTRA_ROUTES);
