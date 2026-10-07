import { BASE, type Side } from './env';
import { FONT_CSS_PATH } from './harness';
import type { AOnlyRoute, RouteLike } from './routes';
import { hydrated, quiet, settle } from './wait';
import { expect, type Page } from '@playwright/test';

/** Open a route on one side and block until it is genuinely rendered and font-normalised. */
export async function openRoute(page: Page, side: Side, route: RouteLike, inset?: string): Promise<void> {
  const query = inset ? `${route.path.includes('?') ? '&' : '?'}inset=${inset}` : '';
  await page.goto(`${BASE[side]}${route.path}${query}`);
  await page.addStyleTag({ url: FONT_CSS_PATH });
  await page.evaluate(async () => {
    await document.fonts.load('16px "ParityFont"');
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => document.fonts.check('16px "ParityFont"'))).toBe(true);
  const root = page.locator(route.root).first();
  await expect(root).toBeVisible();
  if (route.name === 'home') await expect(root.locator('li').first()).toBeVisible();
  else await expect(root.getByRole('heading').first()).toBeVisible();
  await hydrated(page, route);
  await settle(page, route.root);
  await quiet(page, route);
  await settle(page, route.root);
}

/** Open an A-only route (or its side-b twin once flipped to 'both'), run its prepare step, and settle. */
export async function openAOnlyRoute(page: Page, route: AOnlyRoute, side: Side = 'a', inset?: string): Promise<void> {
  await route.init?.(page);
  await openRoute(page, side, route, inset);
  if (!route.prepare) return;
  await route.prepare(page);
  const root = route.clip ?? route.root;
  await settle(page, root);
  await quiet(page, { root });
  await settle(page, root);
}

/** The short static /support page on side a: its footer is the stable place to capture the web footer (the home stream is ~67k px and grows lazily). */
export const FOOTER_SELECTOR = 'footer';
export async function openSupportFooter(page: Page): Promise<void> {
  await page.goto(`${BASE.a}/support`);
  await page.addStyleTag({ url: FONT_CSS_PATH });
  await page.evaluate(async () => {
    await document.fonts.load('16px "ParityFont"');
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => document.fonts.check('16px "ParityFont"'))).toBe(true);
  await expect(page.locator(FOOTER_SELECTOR).first()).toBeVisible();
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps$'));
  }, FOOTER_SELECTOR);
  await page.locator(FOOTER_SELECTOR).first().scrollIntoViewIfNeeded();
  await settle(page, FOOTER_SELECTOR);
  await quiet(page, { root: FOOTER_SELECTOR });
  await settle(page, FOOTER_SELECTOR);
}
