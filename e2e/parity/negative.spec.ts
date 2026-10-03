import {
  BASE,
  captureRoot,
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

  test('an allowlisted app asset path is still served (WP2.1 TODO)', async ({ page }) => {
    expect((await page.request.get(`${BASE.b}/eras/debut.png`)).status()).toBe(200);
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
