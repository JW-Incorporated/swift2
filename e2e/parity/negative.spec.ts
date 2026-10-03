import type { Page, Route } from '@playwright/test';
import {
  BASE,
  captureRoot,
  captureElement,
  captureViewport,
  elementBox,
  ERA_ART_ORIGIN,
  expect,
  FOOTER_SELECTOR,
  A_ONLY_ROUTES,
  captureLocator,
  ITEM_SOCIAL,
  mutate,
  openAOnlyRoute,
  openRoute,
  RAIL_CLIP,
  SEARCH_ROW_CLIP,
  openSupportFooter,
  pixelMatches,
  ROUTES,
  takeExternalImages,
  takeShownExternalImages,
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

test.describe('displayed external image gate (takeShownExternalImages)', () => {
  const EXTRA = 'https://parity.invalid/shown-extra.png';
  const place = (page: Page, css: string, src: string, root: string) =>
    page.evaluate(
      ({ c, u, sel }) =>
        new Promise<void>((done) => {
          const host = document.querySelector(sel) as HTMLElement;
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:relative;height:0';
          const img = new Image();
          img.alt = '';
          img.style.cssText = `position:absolute;top:0;left:0;width:40px;height:40px;${c}`;
          img.onload = img.onerror = () => done();
          img.src = u;
          wrap.append(img);
          host.prepend(wrap);
        }),
      { c: css, u: src, sel: root },
    );

  test('an extra decoded external image in the region changes the displayed set', async ({ page }) => {
    await openRoute(page, 'b', route);
    await captureRoot(page, route);
    const before = await takeShownExternalImages(page, route.root);
    await place(page, '', EXTRA, route.root);
    const after = await takeShownExternalImages(page, route.root);
    expect(after).toEqual([...before, EXTRA].sort());
  });

  test('a cached image that is hidden, zero-size, offscreen or broken is not counted', async ({ page }) => {
    await openRoute(page, 'b', route);
    await captureRoot(page, route);
    const before = await takeShownExternalImages(page, route.root);
    await page.route('**/shown-broken.png', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: 'not an image' }));
    await place(page, 'display:none', 'https://parity.invalid/shown-hidden.png', route.root);
    await place(page, 'visibility:hidden', 'https://parity.invalid/shown-invisible.png', route.root);
    await place(page, 'width:0;height:0', 'https://parity.invalid/shown-zero.png', route.root);
    await place(page, 'top:20000px', 'https://parity.invalid/shown-offscreen.png', route.root);
    await place(page, '', 'https://parity.invalid/shown-broken.png', route.root);
    expect(await takeShownExternalImages(page, route.root)).toEqual(before);
  });
});

test.describe('image settle gate (a slow image must be painted before capture)', () => {
  const DELAY_MS = 4000;
  for (const side of ['a', 'b'] as const) {
    test(`side ${side}: a delayed image response (local or external) is waited for, so the capture matches the undelayed render`, async ({ page }, testInfo) => {
      // The delayed pass runs FIRST, on a cold cache: eager images (#4895) are served from WebKit's memory cache on a
      // reload, so a warm second pass would never reach the slow route. The undelayed control is captured after it.
      const delayed = new Set<string>();
      const slow = async (r: Route) => {
        if (r.request().resourceType() !== 'image') return r.fallback();
        delayed.add(r.request().url());
        await new Promise((done) => setTimeout(done, DELAY_MS));
        return r.fallback();
      };
      const slowMatch = (url: URL) => /^https?:$/.test(url.protocol);
      await page.route(slowMatch, slow);
      const started = Date.now();
      await openRoute(page, side, route);
      const shot = await captureRoot(page, route);
      await page.unroute(slowMatch, slow);
      await openRoute(page, side, route);
      const control = await captureRoot(page, route);
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

test.describe('web footer element-clip gate (a pure 1px translate fails the /support footer clip)', () => {
  test('a pure 1px footer translate fails the footer clip', async ({ page }, testInfo) => {
    await openSupportFooter(page);
    const clip = await elementBox(page, FOOTER_SELECTOR);
    const clean = await captureElement(page, FOOTER_SELECTOR, clip);
    await page.locator(FOOTER_SELECTOR).first().evaluate((el) => {
      el.style.transform = 'translateY(1px)';
    });
    const mutated = await captureElement(page, FOOTER_SELECTOR, clip);
    expect(await pixelMatches(testInfo, 'neg-footer-clip', clean, mutated)).toBe(false);
  });
});

test.describe('One UI PR0 a-only gates (WP2.5-2.8: a 1px mutation of each new surface fails its capture)', () => {
  test('1px padding on the related rail fails the rail clip', async ({ page }, testInfo) => {
    await openAOnlyRoute(page, ITEM_SOCIAL);
    const clean = await captureLocator(page, RAIL_CLIP);
    await page.locator(RAIL_CLIP).first().evaluate((el) => {
      el.style.paddingTop = 'calc(1.25rem + 1px)';
    });
    const mutated = await captureLocator(page, RAIL_CLIP);
    expect(await pixelMatches(testInfo, 'neg-rail-clip', clean, mutated)).toBe(false);
  });

  test('a 1px shift of the search combobox row fails its clip', async ({ page }, testInfo) => {
    await openAOnlyRoute(page, A_ONLY_ROUTES.find((r) => r.name === 'search-open')!);
    const clip = await elementBox(page, SEARCH_ROW_CLIP);
    const clean = await captureElement(page, SEARCH_ROW_CLIP, clip);
    await page.locator(SEARCH_ROW_CLIP).first().evaluate((el) => {
      el.style.transform = 'translateY(1px)';
    });
    const mutated = await captureElement(page, SEARCH_ROW_CLIP, clip);
    expect(await pixelMatches(testInfo, 'neg-search-row', clean, mutated)).toBe(false);
  });

  test('a 1px shift of the threads heading fails its clip', async ({ page }, testInfo) => {
    await openAOnlyRoute(page, A_ONLY_ROUTES.find((r) => r.name === 'lens-fashion')!);
    const clip = await elementBox(page, 'main h1');
    const clean = await captureElement(page, 'main h1', clip);
    await page.locator('main h1').first().evaluate((el) => {
      el.style.transform = 'translateY(1px)';
    });
    const mutated = await captureElement(page, 'main h1', clip);
    expect(await pixelMatches(testInfo, 'neg-threads-1px', clean, mutated)).toBe(false);
  });
});
