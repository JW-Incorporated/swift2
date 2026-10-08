import { BASE } from './env';
import { A_ONLY_ROUTES, A_ONLY_ROUTES_BETA, ROUTES, type AOnlyRoute } from './routes';
import { settle } from './wait';
import type { Page } from '@playwright/test';

/** One chrome-included whole-viewport compare: a route, then a scroll position ('bottom' = document foot, where the footer sits). */
export interface ChromeCase {
  readonly name: string;
  readonly route: AOnlyRoute;
  readonly scroll: number | 'bottom';
}

const byName = (name: string): AOnlyRoute =>
  [...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA].find((r) => r.name === name) ?? (() => { throw new Error(`parity: no route ${name}`); })();

/** Home (top and an era stream scrolled), the item dialog, threads (top and foot, where the footer shows) and merch (top). Merch's foot is left out: it ends on the Submit-a-link block, an accepted divergence. */
export const CHROME_CASES: readonly ChromeCase[] = [
  { name: 'home', route: ROUTES[0], scroll: 0 },
  { name: 'home-scrolled', route: ROUTES[0], scroll: 800 },
  { name: 'item', route: ROUTES[1], scroll: 0 },
  { name: 'threads', route: byName('threads'), scroll: 0 },
  { name: 'threads-foot', route: byName('threads'), scroll: 'bottom' },
  { name: 'merch', route: byName('merch'), scroll: 0 },
];

const ENV_INSET = /env\(safe-area-inset-(top|right|bottom|left)\)/g;
// In html / js / flight only inline-style VALUES are rewritten (preceded by a quote, colon or space): the same text inside a
// Tailwind class name (after + or ,) must stay, or the class stops matching its stylesheet rule.
const ENV_INSET_VALUE = /(?<=["':\s])env\(safe-area-inset-(top|right|bottom|left)\)/g;
const REWRITABLE = /html|css|javascript|x-component/;

/**
 * Side a's equivalent of side b's `?inset=t,r,b,l`: Chromium and WebKit desktop emulation cannot set `env(safe-area-inset-*)`,
 * so every a-origin html / css / js / flight response has the literal `env(safe-area-inset-X)` replaced by the pixel value
 * (what a notched device resolves it to). Must run before `page.goto`; later routes win over the harness's catch-all.
 */
export async function emulateInsetsOnA(page: Page, insets: string): Promise<void> {
  const [t, r, b, l] = insets.split(',').map(Number);
  const px: Record<string, number> = { top: t!, right: r!, bottom: b!, left: l! };
  await page.route(
    (u) => u.origin === BASE.a && !/^\/(__parity|vault\/live|_vercel|favicon)/.test(u.pathname),
    async (route) => {
      const res = await route.fetch();
      if (!REWRITABLE.test(res.headers()['content-type'] ?? '')) return route.fallback();
      const re = /css/.test(res.headers()['content-type'] ?? '') ? ENV_INSET : ENV_INSET_VALUE;
      const body = (await res.text()).replace(re,(_m, side: string) => `${px[side]}px`);
      return route.fulfill({ response: res, body });
    },
  );
  // The native host's clearance (the web has no status bar: the browser's own chrome does that job). The same rules as
  // reader-spike.css, installed before hydration as a constructable sheet (allowed under side a's CSP, unlike a <style>
  // tag): a late CSSOM write would not re-run FilterBar's ResizeObserver, which watches the content box, not the padding.
  const css =
    `.era-shell{padding-left:${l}px;padding-right:${r}px}` +
    `header[data-ll-topbar]{padding-top:${t}px;background:linear-gradient(var(--era-bg),var(--era-bg)) top / 100% ${t}px no-repeat}`;
  await page.addInitScript((rules) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(rules);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }, css);
}

/** Scroll the window to a fixed offset (or the document foot) and wait for it to hold. */
export async function scrollTo(page: Page, scroll: number | 'bottom'): Promise<void> {
  if (scroll === 0) return;
  await page.evaluate((y) => window.scrollTo(0, y === 'bottom' ? document.documentElement.scrollHeight : y), scroll);
  await page.waitForFunction(() => {
    const w = window as unknown as { __sy?: { y: number; n: number } };
    const y = Math.round(window.scrollY);
    w.__sy = w.__sy?.y === y ? { y, n: w.__sy.n + 1 } : { y, n: 0 };
    return w.__sy.n >= 5;
  }, undefined, { polling: 100 });
  await settle(page, 'body');
}
