import {
  A_ONLY_ROUTES,
  A_ONLY_ROUTES_BETA,
  captureElement,
  captureLocator,
  captureViewport,
  captureRoot,
  expect,
  FOOTER_SELECTOR,
  FOLLOW_CLIP,
  ITEM_SOCIAL,
  LIGHTBOX_CLIP,
  openAOnlyRoute,
  openRoute,
  openSupportFooter,
  PIXEL_OPTS,
  RAIL_CLIP,
  realInsets,
  ROUTES,
  SCRUBBER_CLIP,
  SEARCH_ROW_CLIP,
  SONG_NAV_CLIP,
  test,
} from './helpers';
import { bBaselineNames, bothSidesRoutes } from './sides';

// Per-side baselines (Linux-only, generated in the pinned Playwright container).
// Side b is captured with the project's REAL simulated safe-area insets.
test.skip(process.platform !== 'linux', 'visual baselines are Linux-only');

for (const route of ROUTES) {
  test(`a (web build) ${route.name}`, async ({ page }) => {
    await openRoute(page, 'a', route);
    expect(await captureRoot(page, route)).toMatchSnapshot(`a-${route.name}.png`, PIXEL_OPTS);
  });

  // WP2.4-0: the web chrome (TopBar, its timeline rail, BottomNav) is hidden by captureRoot, so cover it whole-viewport before it moves.
  test(`a (web build) ${route.name} viewport`, async ({ page }) => {
    await openRoute(page, 'a', route);
    expect(await captureViewport(page)).toMatchSnapshot(`a-${route.name}-viewport.png`, PIXEL_OPTS);
  });

  test(`b (DOM entry, real insets) ${route.name}`, async ({ page }, testInfo) => {
    await openRoute(page, 'b', route, realInsets(testInfo));
    expect(await captureRoot(page, route)).toMatchSnapshot(`b-${route.name}.png`, PIXEL_OPTS);
    // The root clip is root-relative and hides the insets; the whole viewport shows them (body top padding, nav bottom padding).
    expect(await captureViewport(page)).toMatchSnapshot(`b-${route.name}-viewport.png`, PIXEL_OPTS);
  });
}

// One UI PR0 (WP2.5-2.8): side-a-only baselines for surfaces that move into packages/ui; side b does not render them yet.
for (const route of A_ONLY_ROUTES) {
  test(`a (web build) ${route.name}`, async ({ page }) => {
    await openAOnlyRoute(page, route);
    const pixels = route.clip ? await captureElement(page, route.clip) : await captureRoot(page, route);
    expect(pixels).toMatchSnapshot(`a-${route.name}.png`, PIXEL_OPTS);
  });
}

// One UI PR0-beta (WP2.9-2.13): side-a-only baselines for merch, community, clownbot, mood, notification settings and the legal pages.
const betaTest = (route: (typeof A_ONLY_ROUTES_BETA)[number]) =>
  test(`a (web build) ${route.name}`, async ({ page }) => {
    await openAOnlyRoute(page, route);
    expect(await captureRoot(page, route)).toMatchSnapshot(`a-${route.name}.png`, PIXEL_OPTS);
  });
for (const route of A_ONLY_ROUTES_BETA.filter((r) => r.name !== 'merch')) betaTest(route);
// MerchMarquee emits a <style> tag without the CSP nonce, which chromium reports as a console error; webkit projects already bypass CSP.
test.describe('merch', () => {
  test.use({ bypassCSP: true });
  for (const route of A_ONLY_ROUTES_BETA.filter((r) => r.name === 'merch')) betaTest(route);
});

// W1-E: side-b baselines (real insets) for routes a slice D flipped to sides 'both'. Empty today.
for (const route of bothSidesRoutes([...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA])) {
  test(`b (DOM entry, real insets) ${route.name}`, async ({ page }, testInfo) => {
    const names = bBaselineNames(route);
    await openAOnlyRoute(page, route, 'b', realInsets(testInfo));
    const pixels = route.clip ? await captureElement(page, route.clip) : await captureRoot(page, route);
    expect(pixels).toMatchSnapshot(names.root, PIXEL_OPTS);
    expect(await captureViewport(page)).toMatchSnapshot(names.viewport, PIXEL_OPTS);
  });
}

test('a (web build) item-social related rail', async ({ page }) => {
  await openAOnlyRoute(page, ITEM_SOCIAL);
  expect(await captureLocator(page, RAIL_CLIP)).toMatchSnapshot('a-item-social-related-rail.png', PIXEL_OPTS);
});

test('a (web build) item-social follow-threads row', async ({ page }) => {
  await openAOnlyRoute(page, ITEM_SOCIAL);
  expect(await captureLocator(page, FOLLOW_CLIP)).toMatchSnapshot('a-item-social-follow-threads.png', PIXEL_OPTS);
});

test('a (web build) item lightbox', async ({ page }) => {
  await openRoute(page, 'a', ROUTES[1]);
  await page.locator('[role="dialog"] button[aria-label="View photo full screen"]').first().click();
  await expect(page.locator(LIGHTBOX_CLIP)).toBeVisible();
  expect(await captureElement(page, LIGHTBOX_CLIP)).toMatchSnapshot('a-item-lightbox.png', PIXEL_OPTS);
});

test('a (web build) lens-fashion scrubber', async ({ page }) => {
  await openAOnlyRoute(page, A_ONLY_ROUTES.find((r) => r.name === 'lens-fashion')!);
  expect(await captureElement(page, SCRUBBER_CLIP)).toMatchSnapshot('a-lens-fashion-scrubber.png', PIXEL_OPTS);
});

test('a (web build) song overlay nav', async ({ page }) => {
  await openAOnlyRoute(page, A_ONLY_ROUTES.find((r) => r.name === 'song')!);
  expect(await captureElement(page, SONG_NAV_CLIP)).toMatchSnapshot('a-song-nav.png', PIXEL_OPTS);
});

test('a (web build) search combobox row', async ({ page }) => {
  await openAOnlyRoute(page, A_ONLY_ROUTES.find((r) => r.name === 'search-open')!);
  expect(await captureElement(page, SEARCH_ROW_CLIP)).toMatchSnapshot('a-search-row.png', PIXEL_OPTS);
});

test('a (web build) home topbar', async ({ page }) => {
  await openRoute(page, 'a', ROUTES[0]);
  expect(await captureElement(page, '[data-ll-topbar]')).toMatchSnapshot('a-home-topbar.png', PIXEL_OPTS);
});

test('a (web build) support footer', async ({ page }) => {
  await openSupportFooter(page);
  expect(await captureElement(page, FOOTER_SELECTOR)).toMatchSnapshot('a-support-footer.png', PIXEL_OPTS);
});
