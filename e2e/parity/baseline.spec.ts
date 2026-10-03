import { captureViewport, captureRoot, expect, openRoute, PIXEL_OPTS, realInsets, ROUTES, test } from './helpers';

// Per-side baselines (Linux-only, generated in the pinned Playwright container).
// Side b is captured with the project's REAL simulated safe-area insets.
test.skip(process.platform !== 'linux', 'visual baselines are Linux-only');

for (const route of ROUTES) {
  test(`a (web build) ${route.name}`, async ({ page }) => {
    await openRoute(page, 'a', route);
    expect(await captureRoot(page, route)).toMatchSnapshot(`a-${route.name}.png`, PIXEL_OPTS);
  });

  test(`b (DOM entry, real insets) ${route.name}`, async ({ page }, testInfo) => {
    await openRoute(page, 'b', route, realInsets(testInfo));
    expect(await captureRoot(page, route)).toMatchSnapshot(`b-${route.name}.png`, PIXEL_OPTS);
    // The root clip is root-relative and hides the insets; the whole viewport shows them (body top padding, nav bottom padding).
    expect(await captureViewport(page)).toMatchSnapshot(`b-${route.name}-viewport.png`, PIXEL_OPTS);
  });
}
