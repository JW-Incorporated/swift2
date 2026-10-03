import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACEHOLDER_PNG } from './placeholder';
import { expect, test as base, type Page, type TestInfo } from '@playwright/test';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const ERA_ART_ORIGIN = 'https://www.longlivets.com';
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
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
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
        const era = url.origin === ERA_ART_ORIGIN ? /^\/eras\/([\w-]+\.png)$/.exec(url.pathname) : null;
        if (era) {
          // Era art is the app's one app-relative network asset (resolveUrl): serve the REAL bytes, not the grey stub, and do not record it as external.
          return route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: readFileSync(resolve(repo, 'apps/web/public/eras', era[1]!)),
          });
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
      await use();
      expect(problems, 'page must load with no errors and no unexpected external requests').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Open a route on one side and block until it is genuinely rendered and font-normalised. */
export async function openRoute(page: Page, side: Side, route: Route, inset?: string): Promise<void> {
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

/** Hydration effects (client-only text) land after React owns the DOM: wait until the root's text and size hold still. */
async function quiet(page: Page, route: Route): Promise<void> {
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
async function hydrated(page: Page, route: Route): Promise<void> {
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

/** PNG of the shared content root: its top CLIP_HEIGHT css px (a full era stream is ~67k px tall). */
export async function captureRoot(page: Page, route: Route): Promise<Buffer> {
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
