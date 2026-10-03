import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { expect, test as base, type Page, type TestInfo } from '@playwright/test';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const FIXED_TIME = new Date('2026-01-01T12:00:00Z');
const A_PORT = Number(process.env.PARITY_A_PORT ?? 4174);
const B_PORT = Number(process.env.PARITY_PORT ?? 4173);

export type Side = 'a' | 'b';
export interface Fixture {
  bundleVersion: string;
  hash: string;
  itemId: string;
}
export const fixture: Fixture = JSON.parse(
  readFileSync(resolve(repo, 'apps/mobile/dist/parity-fixture/fixture.json'), 'utf-8'),
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

const PARITY_FONT_CSS = (() => {
  const css = readFileSync(resolve(repo, 'apps/mobile/dom/shared-ui-test.css'), 'utf-8');
  const uri = /url\((data:font\/woff2;base64,[A-Za-z0-9+/=]+)\)/.exec(css)?.[1];
  if (!uri) throw new Error('parity: the DOM entry data-URI font was not found in shared-ui-test.css');
  return (
    `@font-face { font-family: "ParityFont"; font-weight: 100 900; src: url(${uri}) format("woff2"); }` +
    ` * { font-family: "ParityFont" !important; }` +
    ` html { scroll-behavior: auto !important; }`
  );
})();

/** One fixed 640x360 grey PNG answers every external image (both sides see identical pixels). */
const PLACEHOLDER_PNG = (() => {
  const w = 640;
  const h = 360;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 0x5a)]);
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: h }, () => row)))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
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
        if (req.resourceType() === 'image') {
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
  await page.addStyleTag({ content: PARITY_FONT_CSS });
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
  await settle(page);
  await quiet(page, route);
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

/** Wait for in-view images to finish and for layout to be quiet for two frames. */
async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((i) => {
        const r = i.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      })
      .every((i) => i.complete),
  );
  await page.evaluate(
    () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  );
}

const CLIP_HEIGHT = 480;

/** PNG of the shared content root: its top CLIP_HEIGHT css px (a full era stream is ~67k px tall). */
export async function captureRoot(page: Page, route: Route): Promise<Buffer> {
  // Web-only chrome (TopBar and its fixed timeline rail, footer) is not part of the shared root; the app host supplies its own.
  // A stylesheet, not inline styles: the rail re-renders (and sets its own visibility) after hydration.
  const r = route.root;
  await page.addStyleTag({
    content:
      `header, header *, footer, footer * { visibility: hidden !important; }` +
      ` ${r} header, ${r} header *, ${r} footer, ${r} footer * { visibility: visible !important; }`,
  });
  const box = await page.locator(route.root).first().boundingBox();
  if (!box) throw new Error(`parity: ${route.root} has no box`);
  return page.screenshot({
    clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, CLIP_HEIGHT) },
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
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

export interface StructNode {
  role: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Landmarks, lists and headings under the shared root, DOM order, root-relative integer css px. */
export async function collectStructure(page: Page, route: Route): Promise<StructNode[]> {
  return page.locator(route.root).first().evaluate((root) => {
    const ROLES = ['main', 'navigation', 'banner', 'article', 'list', 'listitem', 'heading'];
    const IMPLICIT: Record<string, string> = {
      MAIN: 'main',
      NAV: 'navigation',
      HEADER: 'banner',
      ARTICLE: 'article',
      UL: 'list',
      OL: 'list',
      LI: 'listitem',
      H1: 'heading',
      H2: 'heading',
      H3: 'heading',
      H4: 'heading',
      H5: 'heading',
      H6: 'heading',
    };
    const origin = root.getBoundingClientRect();
    const out: StructNode[] = [];
    for (const el of Array.from(root.querySelectorAll('*'))) {
      const explicit = el.getAttribute('role');
      const role = explicit && ROLES.includes(explicit) ? explicit : IMPLICIT[el.tagName];
      if (!role || el.getClientRects().length === 0) continue;
      const r = el.getBoundingClientRect();
      out.push({
        role,
        text: ((el as HTMLElement).innerText ?? '').replace(/\s+/g, ' ').trim().normalize('NFC'),
        x: Math.round(r.x - origin.x),
        y: Math.round(r.y - origin.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
    return out;
  });
}

export const EDGE_TOLERANCE = 2;

/** Differences between two structures; empty means they agree. */
export function diffStructure(a: StructNode[], b: StructNode[]): string[] {
  const problems: string[] = [];
  const count = (nodes: StructNode[]) => {
    const n: Record<string, number> = {};
    for (const x of nodes) n[x.role] = (n[x.role] ?? 0) + 1;
    return JSON.stringify(Object.entries(n).sort());
  };
  if (a.length !== b.length || count(a) !== count(b)) {
    problems.push(`count: a=${count(a)} b=${count(b)}`);
    return problems;
  }
  for (let i = 0; i < a.length; i++) {
    const p = a[i]!;
    const q = b[i]!;
    if (p.role !== q.role) problems.push(`#${i} role ${p.role} != ${q.role}`);
    if (p.text !== q.text) {
      let at = 0;
      while (at < p.text.length && p.text[at] === q.text[at]) at++;
      problems.push();
    }
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      if (Math.abs(p[k] - q[k]) > EDGE_TOLERANCE) problems.push(`#${i} ${p.role} ${k} ${p[k]} vs ${q[k]}`);
    }
    if (problems.length >= 10) break;
  }
  return problems;
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
  await settle(page);
}
