import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BASE, type Side } from './env';
import { CAPTURE_CSS_PATH } from './harness';
import type { Route, RouteLike } from './routes';
import { CLIP_HEIGHT, imagesReady, settle } from './wait';
import { expect, type Page, type TestInfo } from '@playwright/test';

/** PNG of an element below the fold: scrolled into view first, then `locator.screenshot` (its box can sit outside the viewport clip). */
export async function captureLocator(page: Page, selector: string): Promise<Buffer> {
  const loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  await imagesReady(page, 'body');
  return loc.screenshot({ scale: 'css' });
}

/** The song overlay's one-time swipe hint shows for 3 s after mount, so which capture catches it is a race; never part of a viewport capture. */
const TRANSIENT_HINT = 'div.fixed.bottom-6[aria-live="polite"]';

/** PNG of the viewport at scroll top: where the safe-area insets show (body top padding, nav bottom padding). */
/** `hideSelectors` are hidden (not masked: a mask rectangle moves with its element and would expose different pixels beneath). */
export async function captureViewport(page: Page, hideSelectors: string[] = []): Promise<Buffer> {
  if (hideSelectors.length) await page.addStyleTag({ content: `${hideSelectors.join(',')}{visibility:hidden!important}` });
  await imagesReady(page, 'body');
  // CSSOM write, not a stylesheet: side a's CSP blocks inline style tags.
  await page.evaluate((sel) => document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.style.setProperty('visibility', 'hidden')), TRANSIENT_HINT);
  return page.screenshot({ scale: 'css' });
}

export type Clip = { x: number; y: number; width: number; height: number };

/** Bounding box of one element in page coordinates (feed it back to captureElement to hold the clip fixed across a mutation). */
export async function elementBox(page: Page, selector: string): Promise<Clip> {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`parity: ${selector} has no box`);
  return box;
}

/** PNG clipped to an element's bounding box (or a given clip), so the pixel ratio applies to that small area, not the whole viewport. */
export async function captureElement(page: Page, selector: string, clip?: Clip): Promise<Buffer> {
  await imagesReady(page, 'body');
  return page.screenshot({ clip: clip ?? (await elementBox(page, selector)), scale: 'css' });
}

/** PNG of the shared content root: its top CLIP_HEIGHT css px (a full era stream is ~67k px tall). */
export async function captureRoot(page: Page, route: RouteLike): Promise<Buffer> {
  // Web-only chrome (TopBar and its fixed timeline rail, footer) is not part of the shared root; the app host supplies its own.
  // A stylesheet, not inline styles: the rail re-renders (and sets its own visibility) after hydration.
  await page.addStyleTag({ url: `${CAPTURE_CSS_PATH}?root=${encodeURIComponent(route.root)}` });
  await imagesReady(page, route.root);
  const box = await page.locator(route.root).first().boundingBox();
  if (!box) throw new Error(`parity: ${route.root} has no box`);
  return page.screenshot({
    clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, CLIP_HEIGHT) },
    scale: 'css',
  });
}

/** The equivalence hash the running side reports: (a) from the server's baked modules via /parity-probe, (b) from the DOM entry's probe. */
export async function runtimeHash(page: Page, side: Side): Promise<{ hash?: string; version?: string }> {
  if (side === 'a') {
    const res = await page.request.get(`${BASE.a}/parity-probe`);
    if (!res.ok()) throw new Error(`parity: /parity-probe answered ${res.status()} (is PARITY_PROBE=1 set?)`);
    return { hash: ((await res.json()) as { hash: string }).hash };
  }
  type Probe = { version?: string; snapshot?: { hash: string } };
  const read = () => page.evaluate(() => (window as unknown as { __probe?: Probe }).__probe ?? null);
  await expect.poll(async () => (await read())?.snapshot?.hash, 'b reports its snapshot').toBeTruthy();
  const probe = await read();
  return { hash: probe?.snapshot?.hash, version: probe?.version };
}

export const PIXEL_OPTS = { threshold: 0.3, maxDiffPixelRatio: 0.001 };

/** True when `actual` matches `ref` within the pixel tolerance (ref goes through a temp snapshot file). */
export async function pixelMatches(
  testInfo: TestInfo,
  name: string,
  ref: Buffer,
  actual: Buffer,
): Promise<boolean> {
  const file = `${name}.png`;
  const refPath = testInfo.snapshotPath(file);
  mkdirSync(dirname(refPath), { recursive: true });
  writeFileSync(refPath, ref);
  try {
    expect(actual).toMatchSnapshot(file, PIXEL_OPTS);
    return true;
  } catch {
    return false;
  } finally {
    unlinkSync(refPath);
  }
}

export type Mutation = 'shift' | 'colour' | 'remove' | 'text';

/** Deliberate regressions for the negative specs; each targets the first suitable element under the root. */
export async function mutate(page: Page, route: Route, kind: Mutation): Promise<void> {
  await page.locator(route.root).first().evaluate((root, k) => {
    const first = (sel: string) => root.querySelector(sel) as HTMLElement | null;
    const el = first('h1,h2,h3,h4');
    if (!el) throw new Error(`parity mutate: no target for ${k}`);
    if (k === 'shift') {
      el.style.position = 'relative';
      el.style.left = '4px';
    }
    if (k === 'colour') el.style.color = '#2f6f4f';
    if (k === 'remove') el.remove();
    if (k === 'text') el.textContent = `${el.textContent ?? ''} (changed)`;
  }, kind);
  await settle(page, route.root);
}
