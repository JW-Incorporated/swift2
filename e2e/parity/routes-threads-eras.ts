import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repo } from './env';
import type { AOnlyRoute } from './routes';
import { expect, type Page } from '@playwright/test';

// W5-parity gap: the thread bodies (the lens landing only shows the hero) and every era's landing. Each route is `sides: 'both'`:
// a-vs-b viewport compare, plus the tagged clip compare. `reveal` scrolls the element to the top of the viewport and tags it.
const CLIP = '[data-parity-clip]';
const reveal = async (page: Page, selector: string): Promise<void> => {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  await el.evaluate((node) => node.setAttribute('data-parity-clip', ''));
  // Lazy images and the era-jump landing correction shift layout above the target after the first scroll, so the offset differs run to
  // run: re-scroll until the element sits at the top for several consecutive checks.
  let stable = 0;
  let landed = Number.NaN;
  await expect
    .poll(
      async () => {
        const [before, after] = await el.evaluate((node) => {
          const b = Math.round(node.getBoundingClientRect().top);
          node.scrollIntoView({ block: 'start' });
          return [b, Math.round(node.getBoundingClientRect().top)];
        });
        stable = before === landed ? stable + 1 : 0;
        landed = after;
        return stable >= 6;
      },
      { intervals: [250], timeout: 20_000 },
    )
    .toBe(true);
};

// RunwayThread (?lens=fashion), ProposalThread (?lens=the-proposal) and OwnershipTimeline (inside ?lens=taylors-version): the lens deep link the website uses.
export const THREAD_VIEW_ROUTES: readonly AOnlyRoute[] = [
  { name: 'thread-runway', path: '/?lens=fashion', root: 'main', sides: 'both', clip: CLIP, prepare: (p) => reveal(p, 'main section.era-card') },
  { name: 'thread-proposal', path: '/?lens=the-proposal', root: 'main', sides: 'both', clip: CLIP, prepare: (p) => reveal(p, 'main article.era-card') },
  {
    name: 'thread-ownership-timeline',
    path: '/?lens=taylors-version',
    root: 'main',
    sides: 'both',
    clip: CLIP,
    prepare: (p) => reveal(p, 'section[aria-label="Masters ownership timeline"]'),
  },
];

// The era registry of the frozen fixture (same list the reader renders). tloas is the home route's landing, so it is not repeated.
const ERA_IDS = (JSON.parse(readFileSync(resolve(repo, 'scripts/parity/fixture/content/frozen/eras.json'), 'utf-8')) as { id: string }[])
  .map((e) => e.id)
  .filter((id) => id !== 'tloas');

/** `/?era=<id>` is the era-selector deep link: the stream jumps to that era's section, whose hero is the landing viewport. */
export const ERA_LANDING_ROUTES: readonly AOnlyRoute[] = ERA_IDS.map((id) => ({
  name: `era-landing-${id}`,
  path: `/?era=${id}`,
  root: 'main',
  sides: 'both',
  clip: CLIP,
  prepare: async (page: Page) => {
    await expect(page.locator(`[data-ll-section="${id}"]`)).toBeVisible();
    await reveal(page, `[data-ll-section="${id}"] > div:first-child`);
  },
}));
