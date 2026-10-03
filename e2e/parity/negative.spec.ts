import type { Page } from '@playwright/test';
import {
  BASE,
  captureRoot,
  captureElement,
  captureViewport,
  elementBox,
  ERA_ART_ORIGIN,
  expect,
  mutate,
  openRoute,
  pixelMatches,
  ROUTES,
  takeExternalImages,
  test,
  type Mutation,
} from './helpers';
import { collectStructure, diffStructure } from './structure';

// Proves the gates catch real regressions. Self-referential (references are
// captured on this machine), so it runs on any OS and needs no committed PNGs.
// Mutations are applied through the DOM after load, identically on either side.
const route = ROUTES[0];

const PIXEL_MUTATIONS: [string, Mutation][] = [
  ['a 4px shift', 'shift'],
  ['a colour change', 'colour'],
];

test.describe('pixel baseline gate (same side, mutated vs clean)', () => {
  for (const [label, kind] of PIXEL_MUTATIONS) {
    test(`${label} fails`, async ({ page }, testInfo) => {
      await openRoute(page, 'b', route);
      const clean = await captureRoot(page, route);
      await mutate(page, route, kind);
      const mutated = await captureRoot(page, route);
      expect(await pixelMatches(testInfo, `neg-base-${kind}`, clean, mutated)).toBe(false);
    });
  }
});

test.describe('web chrome viewport gate (WP2.4-0: a 1px TopBar growth must fail the viewport capture)', () => {
  test('a 1px TopBar growth fails', async ({ page }, testInfo) => {
    await openRoute(page, 'a', route);
    const clean = await captureViewport(page);
    await page.locator('[data-ll-topbar]').evaluate((el) => {
      el.style.paddingBottom = '1px';
    });
    const mutated = await captureViewport(page);
    expect(await pixelMatches(testInfo, 'neg-topbar-1px', clean, mutated)).toBe(false);
  });
});

test.describe('web chrome element-clip gate (WP2.4-0: a pure 1px translate fails the TopBar clip)', () => {
  test('a pure 1px TopBar translate fails the TopBar clip', async ({ page }, testInfo) => {
    await openRoute(page, 'a', route);
    const clip = await elementBox(page, '[data-ll-topbar]');
    const clean = await captureElement(page, '[data-ll-topbar]', clip);
    await page.locator('[data-ll-topbar]').evaluate((el) => {
      el.style.transform = 'translateY(1px)';
    });
    const mutated = await captureElement(page, '[data-ll-topbar]', clip);
    expect(await pixelMatches(testInfo, 'neg-topbar-clip', clean, mutated)).toBe(false);
  });
});

test.describe('pixel a-vs-b gate (side a clean vs side b mutated)', () => {
  for (const [label, kind] of PIXEL_MUTATIONS) {
    test(`${label} fails`, async ({ page }, testInfo) => {
      await openRoute(page, 'a', route);
      const a = await captureRoot(page, route);
      await openRoute(page, 'b', route);
      await mutate(page, route, kind);
      const b = await captureRoot(page, route);
      expect(await pixelMatches(testInfo, `neg-ab-${kind}`, a, b)).toBe(false);
    });
  }
});

test.describe('asset and image gates', () => {
  test('a missing (b) export asset is a 404 (the guard fails the page on any >=400)', async ({ page }) => {
    expect((await page.request.get(`${BASE.b}/no-such-export-asset.js`)).status()).toBe(404);
  });

  test('there is no /eras fallthrough on side b (era art arrives via resolveUrl, not the export)', async ({ page }) => {
    expect((await page.request.get(`${BASE.b}/eras/debut.png`)).status()).toBe(404);
  });

  test('canonical-origin era art is answered with the real bytes and is not an external image', async ({ page }) => {
    await openRoute(page, 'b', route);
    takeExternalImages(page);
    const size = await page.evaluate(
      (origin) =>
        new Promise<[number, number]>((done, fail) => {
          const img = new Image();
          img.onload = () => done([img.naturalWidth, img.naturalHeight]);
          img.onerror = () => fail(new Error('era art did not load'));
          img.src = `${origin}/eras/debut.png?probe`;
        }),
      ERA_ART_ORIGIN,
    );
    expect(size, 'not the 640x360 grey stub').not.toEqual([640, 360]);
    expect(takeExternalImages(page)).toEqual([]);
  });

  test('an unexpected external image changes the recorded set', async ({ page }) => {
    await openRoute(page, 'b', route);
    takeExternalImages(page);
    await page.evaluate(() => {
      const img = new Image();
      img.src = 'https://parity.invalid/extra.png';
      document.body.append(img);
    });
    await expect.poll(() => takeExternalImages(page).length).toBeGreaterThan(0);
  });
});

test.describe('image settle gate (a slow image must be painted before capture)', () => {
  const DELAY_MS = 4000;
  for (const side of ['a', 'b'] as const) {
    test(`side ${side}: a delayed image response (local or external) is waited for, so the capture matches the undelayed render`, async ({ page }, testInfo) => {
      await openRoute(page, side, route);
      const control = await captureRoot(page, route);
      const delayed = new Set<string>();
      await page.route(
        (url) => /^https?:$/.test(url.protocol),
        async (r) => {
          if (r.request().resourceType() !== 'image') return r.fallback();
          delayed.add(r.request().url());
          await new Promise((done) => setTimeout(done, DELAY_MS));
          return r.fallback();
        },
      );
      const started = Date.now();
      await openRoute(page, side, route);
      const shot = await captureRoot(page, route);
      expect(delayed.size, 'the slow route must actually have intercepted images').toBeGreaterThan(0);
      expect(Date.now() - started, 'the capture must have waited for the slow images').toBeGreaterThanOrEqual(DELAY_MS);
      expect(await pixelMatches(testInfo, `neg-slow-${side}`, control, shot)).toBe(true);
    });
  }
});

test.describe('image settle gate (images injected after load, so only imagesReady can wait for them)', () => {
  const DELAY_MS = 3000;
  const inject = (page: Page, urls: { img: string; bg: string }, root: string) =>
    page.evaluate(
      ({ u, sel }) => {
        const host = document.querySelector(sel) as HTMLElement;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;height:0;z-index:9';
        const img = new Image();
        img.loading = 'lazy';
        img.id = 'parity-slow-img';
        img.src = u.img;
        img.style.cssText = 'position:absolute;top:0;left:0;width:60px;height:60px';
        const bg = document.createElement('div');
        bg.id = 'parity-slow-bg';
        bg.style.cssText = `position:absolute;top:70px;left:0;width:60px;height:60px;background:url("${u.bg}") center/cover`;
        wrap.append(img, bg);
        host.prepend(wrap);
      },
      { u: urls, sel: root },
    );

  for (const side of ['a', 'b'] as const) {
    test(`side ${side}: a delayed lazy <img> and CSS background are waited for and present in the capture`, async ({ page }, testInfo) => {
      await openRoute(page, side, route);
      const tag = `parity-slow=${Date.now()}`;
      // Side b has no /eras in its export: it loads era art from the canonical origin, like the app.
      const origin = side === 'b' ? ERA_ART_ORIGIN : BASE.a;
      const urls = {
        img: `${origin}/eras/debut.png?${tag}-img`,
        bg: `${origin}/eras/debut.png?${tag}-bg`,
      };
      const served = new Map<string, number>();
      await page.route(
        (url) => url.search.includes(tag),
        async (r) => {
          await new Promise((done) => setTimeout(done, DELAY_MS));
          served.set(r.request().url(), Date.now());
          return r.fallback();
        },
      );
      const started = Date.now();
      await inject(page, urls, route.root);
      const shot = await captureRoot(page, route);
      const captured = Date.now();
      expect([...served.keys()].sort(), 'both slow URLs were requested and served before the capture').toEqual(
        [urls.bg, urls.img].sort(),
      );
      expect(captured - started).toBeGreaterThanOrEqual(DELAY_MS);
      expect(
        await page.evaluate(() => {
          const i = document.querySelector('#parity-slow-img') as HTMLImageElement;
          return i.complete && i.naturalWidth > 0;
        }),
      ).toBe(true);
      const later = await captureRoot(page, route);
      expect(await pixelMatches(testInfo, `neg-slow-inject-${side}`, shot, later)).toBe(true);
    });
  }

  test('an SVG image (decode() may reject) is treated as loaded', async ({ page }) => {
    await openRoute(page, 'b', route);
    await page.evaluate((sel) => {
      const host = document.querySelector(sel) as HTMLElement;
      const img = new Image();
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>')}`;
      img.style.cssText = 'position:absolute;top:0;left:0;width:20px;height:20px';
      host.prepend(img);
    }, route.root);
    await captureRoot(page, route);
  });
});

test.describe('structural a-vs-b gate', () => {
  const STRUCTURAL: [string, Mutation][] = [
    ['a missing landmark', 'remove'],
    ['changed text', 'text'],
    ['a 4px shift', 'shift'],
  ];
  for (const [label, kind] of STRUCTURAL) {
    test(`${label} fails`, async ({ page }) => {
      await openRoute(page, 'a', route);
      const a = await collectStructure(page, route.root);
      await openRoute(page, 'b', route);
      await mutate(page, route, kind);
      const b = await collectStructure(page, route.root);
      expect(diffStructure(a, b).length).toBeGreaterThan(0);
    });
  }

  test('the unmutated pair passes (the gate is not vacuous the other way)', async ({ page }) => {
    await openRoute(page, 'a', route);
    const a = await collectStructure(page, route.root);
    await openRoute(page, 'b', route);
    expect(a.length).toBeGreaterThan(100);
    expect(diffStructure(a, await collectStructure(page, route.root))).toEqual([]);
  });
});
