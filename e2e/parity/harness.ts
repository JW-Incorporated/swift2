import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ERA_ART_ORIGIN, FIXED_TIME, LOCAL_HOSTS, repo, type Side } from './env';
import { PLACEHOLDER_PNG } from './placeholder';
import { expect, test as base, type Page } from '@playwright/test';

const externalImages = new WeakMap<Page, Set<string>>();
/** External image URLs requested since the last call (sorted); resets the record. */
export function takeExternalImages(page: Page): string[] {
  const seen = externalImages.get(page) ?? new Set<string>();
  externalImages.set(page, new Set());
  return [...seen].sort();
}

export const FONT_CSS_PATH = '/__parity/normalize.css';
export const CAPTURE_CSS_PATH = '/__parity/capture.css';
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
    const era = url.origin === ERA_ART_ORIGIN ?/^\/(eras\/[\w-]+\.png|threads\/[\w-]+\.jpg)$/.exec(url.pathname) : null;
    if (era) {
      // Era art is the app's one app-relative network asset (resolveUrl): serve the REAL bytes, not the grey stub, and do not record it as external.
      const file = resolve(repo, 'apps/web/public', era[1]!);
      if (!existsSync(file)) {
        problems.push(`missing era asset ${era[1]}`);
        return route.fulfill({ status: 404 });
      }
      return route.fulfill({ status: 200, contentType: era[1]!.endsWith('.jpg') ? 'image/jpeg' : 'image/png', body: readFileSync(file) });
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

/** Served same-origin (style-src 'self'): an injected <style> would need bypassing the web build's CSP. */
function captureCss(r: string): string {
  return (
    `header, header *, footer, footer * { visibility: hidden !important; }` +
    ` ${r} header, ${r} header *, ${r} footer, ${r} footer * { visibility: visible !important; }`
  );
}
