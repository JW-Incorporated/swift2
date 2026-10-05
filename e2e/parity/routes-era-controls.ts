import type { AOnlyRoute } from './routes';
import { expect, type Page } from '@playwright/test';

// Era-stream controls (device report: "filter pills float oddly", "track guide button non-functional"): FilterBar pill
// states, the Track guide entry bar and its overlay, TrackFivePill, ClusterCard and the doorway cards. All `sides: 'both'`.
// `prepare` runs on BOTH sides, so every expect() below is a behavioural a-and-b assertion on top of the pixel compare.
const CLIP = '[data-parity-clip]';
const FILTERBAR = '[data-ll-filterbar]';
const GUIDE_BUTTON = 'button[aria-label^="Track guide:"]';
const GUIDE_DIALOG = '[role="dialog"][aria-label$="track guide"]';
const TRACK_FIVE_PILL = '[role="dialog"] span[title^="Track five is traditionally"]';

const show = async (page: Page, selector: string): Promise<void> => {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await expect(el).toBeVisible();
  await el.evaluate((node) => node.setAttribute('data-parity-clip', ''));
};

const pick = async (page: Page, label: string): Promise<void> => {
  const chip = page.locator(`${FILTERBAR} button:has-text("${label}")`).first();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
};
const pickFashion = (page: Page): Promise<void> => pick(page, 'Fashion');

/** Scrolls well into the stream so the bar is stuck, then asserts it sits flush under the TopBar (the "floats oddly" symptom). */
const stickFilterBar = async (page: Page): Promise<void> => {
  await page.locator('[data-ll-item]').nth(6).scrollIntoViewIfNeeded();
  await expect
    .poll(async () =>
      page.evaluate(
        ([bar, top]) => {
          const b = document.querySelector(bar!)?.getBoundingClientRect();
          const t = document.querySelector(top!)?.getBoundingClientRect();
          return b && t ? Math.abs(b.top - t.bottom) <= 1 : false;
        },
        [FILTERBAR, '[data-ll-topbar]'],
      ),
    )
    .toBe(true);
  await show(page, FILTERBAR);
};

export const ERA_CONTROL_ROUTES: readonly AOnlyRoute[] = [
  {
    name: 'era-filterbar-default',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, FILTERBAR),
  },
  {
    name: 'era-filterbar-selected',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: async (page) => {
      await pickFashion(page);
      await show(page, FILTERBAR);
    },
  },
  {
    name: 'era-filterbar-sticky',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: async (page) => {
      await pickFashion(page);
      await stickFilterBar(page);
    },
  },
  {
    name: 'era-track-guide-bar',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, GUIDE_BUTTON),
  },
  {
    name: 'era-track-guide-open',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: GUIDE_DIALOG,
    prepare: async (page) => {
      const button = page.locator(GUIDE_BUTTON).first();
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await expect(page.locator(GUIDE_DIALOG)).toBeVisible();
    },
  },
  {
    name: 'era-track-five-pill',
    path: '/?guide=fearless',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, TRACK_FIVE_PILL),
  },
  {
    name: 'era-cluster-card',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    // Unfiltered, doorways are spaced between the release-day moments and break the same-day run; a topic filter drops them.
    prepare: async (page) => {
      await pick(page, 'Music');
      await show(page, '[data-ll-item^="era-cluster-"]');
    },
  },
  {
    name: 'era-doorway-thread',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, '[data-ll-item^="era-thread-"]'),
  },
  {
    name: 'era-doorway-egg',
    path: '/',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (page) => show(page, '[data-ll-item^="era-egg-"]'),
  },
];
