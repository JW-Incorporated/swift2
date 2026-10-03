import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_ORIGIN } from '../../apps/web/lib/canonical-origin';
import { PLACEHOLDER_PNG } from './placeholder';
import { expect, test as base, type Page, type TestInfo } from '@playwright/test';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
export const ERA_ART_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || CANONICAL_ORIGIN;
const FIXED_TIME = new Date('2026-01-01T12:00:00Z');
const A_PORT = Number(process.env.PARITY_A_PORT ?? 4174);
const B_PORT = Number(process.env.PARITY_PORT ?? 4173);

export type Side = 'a' | 'b';
const externalImages = new WeakMap<Page, Set<string>>();
/** External image URLs requested since the last call (sorted); resets the record. */
export function takeExternalImages(page: Page): string[] {
  const seen = externalImages.get(page) ?? new Set<string>();
  externalImages.set(page, new Set());
  return [...seen].sort();
}
export interface Fixture {
  bundleVersion: string;
  hash: string;
  itemId: string;
}
export const fixture: Fixture = JSON.parse(
  readFileSync(resolve(repo, 'scripts/parity/fixture/fixture.json'), 'utf-8'),
);

/** Side a is the Next web build; side b is the app's DOM entry exported for a browser. */
export const BASE: Record<Side, string> = {
  a: `http://127.0.0.1:${A_PORT}`,
  b: `http://127.0.0.1:${B_PORT}`,
};

/** `root` is the element both sides share: the era stream (`main`) or the open moment (`dialog`). */
export const ROUTES = [
  { name: 'home', path: '/', root: 'main' },
  { name: 'item', path: `/?item=${fixture.itemId}`, root: '[role="dialog"]' },
] as const;
export type Route = (typeof ROUTES)[number];
type RouteLike = { readonly name: string; readonly path: string; readonly root: string };

const frozenTracks = JSON.parse(
  readFileSync(resolve(repo, 'scripts/parity/fixture/content/frozen/tracks.json'), 'utf-8'),
) as { eraId: string; tracks: { trackNumber?: number; title: string }[] }[];
// Mirrors trackKey() in packages/experience/src/track-guide.ts; importing @swift2/experience needs sync:content's generated files, which the baseline job does not run.
const SONG_TRACK = frozenTracks.find((e) => e.eraId === 'fearless')!.tracks[1]!;
const SONG_KEY = `fearless::${SONG_TRACK.trackNumber ?? 'x'}::${SONG_TRACK.title}`;

/** Side-a-only baselines (One UI PR0, WP2.5-2.8): surfaces side b does not render yet. `prepare` runs after the route settles; `clip` (when set) is captured instead of the root. */
export interface AOnlyRoute extends RouteLike {
  prepare?: (page: Page) => Promise<void>;
  clip?: string;
}
const threadLens = (id: string): AOnlyRoute => ({ name: `lens-${id}`, path: `/?lens=${id}`, root: 'main' });
const SEARCH_DIALOG = '[role="dialog"][aria-label="Search the archive"]';
const SEARCH_OPEN_BUTTON = 'button[aria-label="Search the archive (press /)"]';
export const A_ONLY_ROUTES: readonly AOnlyRoute[] = [
  { name: 'item-video', path: '/?item=vault-tloas-the-fate-of-ophelia-video-premieres', root: '[role="dialog"]' },
  {
    name: 'item-social',
    path: '/?item=vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own',
    root: '[role="dialog"]',
  },
  { name: 'threads', path: '/?mode=threads', root: 'main' },
  threadLens('love-story'),
  threadLens('fashion'),
  threadLens('taylors-version'),
  threadLens('easter-eggs'),
  threadLens('hidden-clues'),
  threadLens('the-proposal'),
  {
    name: 'crossing',
    path: '/?mode=threads',
    root: 'main',
    prepare: async (page) => {
      await page.getByRole('button', { name: /Where threads cross/ }).first().click();
    },
  },
  { name: 'guide', path: '/?guide=fearless', root: '[role="dialog"][aria-label$="track guide"]' },
  {
    name: 'song',
    path: `/?song=${encodeURIComponent(SONG_KEY)}`,
    root: '[role="dialog"][aria-label$="song detail"]',
  },
  { name: 'theories', path: '/?theories=fearless', root: '[role="dialog"][aria-label$="theories and easter eggs"]' },
  {
    name: 'search-open',
    path: '/',
    root: 'main',
    clip: SEARCH_DIALOG,
    prepare: async (page) => {
      await page.locator(SEARCH_OPEN_BUTTON).first().click();
      await expect(page.locator(SEARCH_DIALOG)).toBeVisible();
    },
  },
  {
    name: 'search-results',
    path: '/',
    root: 'main',
    clip: SEARCH_DIALOG,
    prepare: async (page) => {
      await page.locator(SEARCH_OPEN_BUTTON).first().click();
      await page.locator(`${SEARCH_DIALOG} [role="combobox"]`).fill('fearless');
      await expect(page.locator(`${SEARCH_DIALOG} [role="listbox"] [role="option"]`).first()).toBeVisible();
    },
  },
];

/** Element-clip selectors for the A-only captures (existing roles, aria labels and headings only). */
export const ITEM_SOCIAL = A_ONLY_ROUTES[1]!;
export const RAIL_CLIP = '.era-card:has(> div:has-text("Keep reading"))';
export const FOLLOW_CLIP = '.era-card:has(> div:has-text("Part of a bigger story"))';
export const LIGHTBOX_CLIP = '[role="dialog"][aria-label="Photo viewer"]';
export const SCRUBBER_CLIP = '[role="slider"][aria-label="Career timeline"]';
export const SONG_NAV_CLIP = '[role="dialog"][aria-label$="song detail"] nav[aria-label="Track overlay navigation"]';
export const SEARCH_ROW_CLIP = `${SEARCH_DIALOG} div:has(> [role="combobox"])`;

/** Simulated native safe-area insets per project (top, right, bottom, left); side b only. */
const REAL_INSETS: Record<string, string> = {
  'pixel-7': '24,0,48,0',
  'iphone-15': '59,0,34,0',
  'ipad-pro-11-portrait': '24,0,20,0',
  'ipad-pro-11-landscape': '24,0,20,0',
};
export const realInsets = (testInfo: TestInfo): string => REAL_INSETS[testInfo.project.name] ?? '0,0,0,0';

const FONT_CSS_PATH = '/__parity/normalize.css';
const CAPTURE_CSS_PATH = '/__parity/capture.css';
const PARITY_FONT_CSS = (() => {
  const css = readFileSync(resolve(repo, 'apps/mobile/dom/shared-ui-test.css'), 'utf-8');
  const uri = /url\((data:font\/woff2;base64,[A-Za-z0-9+/=]+)\)/.exec(css)?.[1];
  if (!uri) throw new Error('parity: the DOM entry data-URI font was not found in shared-ui-test.css');
  return (
    `@font-face { font-family: "ParityFont"; font-weight: 100 900; src: url(${uri}) format("woff2"); }` +
    ` * { font-family: "ParityFont" !important; }` +
    ` html { scroll-behavior: auto !important; }` +
    // Playwright's own animations/caret screenshot options inject an inline <style> that WebKit refuses under the web build's CSP.
    ` *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`
  );
})();


/**
 * Auto-fixture shared by both sides: fixed clock, stubbed /vault/live, no
 * analytics or external host (images get the placeholder; anything else is a
 * failure), first-visit flags set, and any pageerror or console.error fails.
 */
async function arm(page: Page, problems: string[]): Promise<void> {
  externalImages.set(page, new Set());
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push('http ' + res.status() + ' ' + res.url());
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
  });
  await page.route('**/*', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (LOCAL_HOSTS.has(url.hostname)) {
      if (url.pathname === FONT_CSS_PATH) return route.fulfill({ contentType: 'text/css', body: PARITY_FONT_CSS });
      if (url.pathname === CAPTURE_CSS_PATH) {
        return route.fulfill({ contentType: 'text/css', body: captureCss(url.searchParams.get('root') ?? '') });
      }
      if (url.pathname === '/favicon.ico') return route.fulfill({ status: 204 });
      if (url.pathname.startsWith('/_vercel/')) {
        return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
      }
      if (url.pathname.startsWith('/vault/live')) {
        return route.fulfill({ json: { items: [], theories: [], signals: [] } });
      }
      return route.continue();
    }
    if (['data:', 'blob:', 'about:'].includes(url.protocol)) return route.continue();
    if (url.origin === ERA_ART_ORIGIN && url.pathname.startsWith('/vault/live')) {
      // Side b resolves the live-data fetch (resolveUrl) to the canonical origin: same stub as the local hosts.
      return route.fulfill({ json: { items: [], theories: [], signals: [] } });
    }
    const era = url.origin === ERA_ART_ORIGIN ?/^\/eras\/([\w-]+\.png)$/.exec(url.pathname) : null;
    if (era) {
      // Era art is the app's one app-relative network asset (resolveUrl): serve the REAL bytes, not the grey stub, and do not record it as external.
      const file = resolve(repo, 'apps/web/public/eras', era[1]!);
      if (!existsSync(file)) {
        problems.push(`missing era asset ${era[1]}`);
        return route.fulfill({ status: 404 });
      }
      return route.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(file) });
    }
    if (req.resourceType() === 'image') {
      externalImages.get(page)?.add(url.href);
      return route.fulfill({ status: 200, contentType: 'image/png', body: PLACEHOLDER_PNG });
    }
    problems.push(`external ${req.resourceType()} request blocked: ${url.href}`);
    return route.abort();
  });
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ll-feedback-dismissed-v1', '1');
      localStorage.setItem('ll-track-swipe-hint-seen-v1', '1');
    } catch {
      /* storage is shimmed or absent on some hosts */
    }
  });
  await page.clock.setFixedTime(FIXED_TIME);
}

export const test = base.extend<{ guard: void; problems: string[]; pages: Record<Side, Page> }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures must destructure their arguments
  problems: async ({}, use) => {
    await use([]);
  },
  guard: [
    async ({ page, problems }, use) => {
      await arm(page, problems);
      await use();
      expect(problems, 'page must load with no errors and no unexpected external requests').toEqual([]);
    },
    { auto: true },
  ],
  // Side a is the test's own page; side b gets its own browser context (same device options), armed identically and
  // sharing the problems list. Separate contexts matter: WebKit's memory cache served side b images side a had
  // already fetched, hiding b's requests from the route handler when both sides shared one page (docs/one-ui/parity.md).
  // b's context closes in teardown, which runs before the auto guard's final expect.
  pages: async (
    { page, browser, problems, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, bypassCSP, reducedMotion, locale, timezoneId },
    use,
  ) => {
    const ctxB = await browser.newContext({
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      bypassCSP,
      reducedMotion,
      locale,
      timezoneId,
    });
    const pageB = await ctxB.newPage();
    await arm(pageB, problems);
    await use({ a: page, b: pageB });
    await ctxB.close();
  },
});

export { expect };

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

/** Open an A-only route, run its prepare step, and settle. */
export async function openAOnlyRoute(page: Page, route: AOnlyRoute): Promise<void> {
  await openRoute(page, 'a', route);
  if (!route.prepare) return;
  await route.prepare(page);
  const root = route.clip ?? route.root;
  await settle(page, root);
  await quiet(page, { root });
  await settle(page, root);
}

/** PNG of an element below the fold: scrolled into view first, then `locator.screenshot` (its box can sit outside the viewport clip). */
export async function captureLocator(page: Page, selector: string): Promise<Buffer> {
  const loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  await imagesReady(page, 'body');
  return loc.screenshot({ scale: 'css' });
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

/** Hydration effects (client-only text) land after React owns the DOM: wait until the root's text and size hold still. */
async function quiet(page: Page, route: { root: string }): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const w = window as unknown as { __quiet?: { sig: string; n: number } };
      const el = document.querySelector(sel) as HTMLElement | null;
      const sig = el ? `${el.innerText.slice(0, 3000)}|${Math.round(el.getBoundingClientRect().height)}` : '';
      w.__quiet = w.__quiet?.sig === sig ? { sig, n: w.__quiet.n + 1 } : { sig, n: 0 };
      return w.__quiet.n >= 5;
    },
    route.root,
    { polling: 100 },
  );
}

/** Wait for React to own the page (the web build is server-rendered; hydration swaps client-only text). */
async function hydrated(page: Page, route: RouteLike): Promise<void> {
  await page.waitForFunction((sel) => {
    const owned = (el: Element | null) =>
      !!el && Object.keys(el).some((k) => k.startsWith('__reactProps$'));
    const root = document.querySelector(sel);
    return owned(root) && owned(root?.querySelector('button') ?? null);
  }, route.root);
}

const CLIP_HEIGHT = 480;
const IMAGE_TIMEOUT_MS = 10_000;

/**
 * Block until every image the capture can show is loaded and decoded: <img> and CSS background-image
 * in the root's first screen. A broken, undecodable or stuck image fails the test naming its URL, so it
 * can never be baked into a baseline unpainted (or silently pass).
 */
export async function imagesReady(page: Page, rootSel: string): Promise<void> {
  const problems = await page.evaluate(
    async ({ sel, clip, timeout }) => {
      const root = (document.querySelector(sel) ?? document.body) as HTMLElement;
      const limit = Math.max(window.innerHeight, root.getBoundingClientRect().top + window.scrollY + clip);
      const inRegion = (el: Element) => {
        const r = el.getBoundingClientRect();
        return (
          r.bottom + window.scrollY > 0 &&
          r.top + window.scrollY < limit &&
          r.right > 0 &&
          r.left < window.innerWidth
        );
      };
      const failed: string[] = [];
      const pending = new Set<string>();
      const jobs: Promise<void>[] = [];
      const track = (url: string, job: Promise<void>) => {
        pending.add(url);
        jobs.push(
          job.then(
            () => void pending.delete(url),
            (e: unknown) => {
              pending.delete(url);
              failed.push(`${url} (${e instanceof Error ? e.message : String(e)})`);
            },
          ),
        );
      };
      for (const img of Array.from(root.querySelectorAll('img')).filter(inRegion)) {
        if (img.loading === 'lazy') img.loading = 'eager';
        track(
          img.currentSrc || img.src || '(no src)',
          (async () => {
            if (!img.complete) {
              await new Promise<void>((ok, bad) => {
                img.addEventListener('load', () => ok(), { once: true });
                img.addEventListener('error', () => bad(new Error('load error')), { once: true });
                if (img.complete) ok();
              });
            }
            if (img.naturalWidth === 0) throw new Error('broken image');
            // decode() can reject for an SVG with no intrinsic size; a complete image with a width is loaded.
            await img.decode().catch((e: unknown) => {
              if (!(img.complete && img.naturalWidth > 0)) throw e;
            });
          })(),
        );
      }
      const bgUrls = new Set<string>();
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))].filter(inRegion)) {
        for (const m of getComputedStyle(el).backgroundImage.matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g)) {
          const u = m[1] ?? m[2] ?? m[3];
          if (u) bgUrls.add(new URL(u, document.baseURI).href);
        }
      }
      for (const url of bgUrls) {
        track(
          url,
          (async () => {
            const bg = new Image();
            bg.src = url;
            await bg.decode().catch((e: unknown) => {
              if (!(bg.complete && bg.naturalWidth > 0)) throw e;
            });
          })(),
        );
      }
      let timer = 0;
      const timedOut = new Promise<void>((r) => {
        timer = window.setTimeout(r, timeout);
      });
      await Promise.race([Promise.all(jobs), timedOut]);
      window.clearTimeout(timer);
      for (const u of pending) failed.push(`${u} (still loading after ${timeout} ms)`);
      return failed;
    },
    { sel: rootSel, clip: CLIP_HEIGHT, timeout: IMAGE_TIMEOUT_MS },
  );
  expect(problems, 'parity: every image in the capture region must load and decode').toEqual([]);
}

/** Wait for every image to paint, then for layout to be quiet for two frames. */
async function settle(page: Page, rootSel = 'body'): Promise<void> {
  await imagesReady(page, rootSel);
  await page.evaluate(
    () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  );
}

/** Served same-origin (style-src 'self'): an injected <style> would need bypassing the web build's CSP. */
function captureCss(r: string): string {
  return (
    `header, header *, footer, footer * { visibility: hidden !important; }` +
    ` ${r} header, ${r} header *, ${r} footer, ${r} footer * { visibility: visible !important; }`
  );
}

/** PNG of the viewport at scroll top: where the safe-area insets show (body top padding, nav bottom padding). */
export async function captureViewport(page: Page): Promise<Buffer> {
  await imagesReady(page, 'body');
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
