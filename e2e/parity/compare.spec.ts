import {
  captureViewport,
  captureRoot,
  expect,
  fixture,
  openRoute,
  pixelMatches,
  realInsets,
  ROUTES,
  runtimeHash,
  takeExternalImages,
  test,
} from './helpers';
import { collectStructure, diffStructure } from './structure';

// Side a (Next web build) vs side b (the app's DOM entry), zero insets on b,
// same engine and project, font-normalised. Both gates are blocking.
for (const route of ROUTES) {
  test(`a vs b: ${route.name}`, async ({ page }, testInfo) => {
    await openRoute(page, 'a', route);
    const pixelsA = await captureRoot(page, route);
    const structA = await collectStructure(page, route.root);
    const imagesA = takeExternalImages(page);

    await openRoute(page, 'b', route);
    const pixelsB = await captureRoot(page, route);
    const structB = await collectStructure(page, route.root);
    const imagesB = takeExternalImages(page);

    expect.soft(imagesB, 'external image URLs requested: b equals a').toEqual(imagesA);
    expect.soft(diffStructure(structA, structB), 'structural a-vs-b').toEqual([]);
    expect.soft(await pixelMatches(testInfo, `ref-a-${route.name}`, pixelsA, pixelsB), 'pixel a-vs-b').toBe(true);
  });

  // home: body top padding and the nav clearance read --safe-*, so insets must show. item: MomentDetail has no safe-area
  // styles and its modal covers the nav, so it is inset-immune by construction (docs/one-ui/parity.md); pinned here.
  const verb = route.name === 'home' ? 'change' : 'do not change (immune dialog)';
  test(`real insets ${verb} b's viewport: ${route.name}`, async ({ page }, testInfo) => {
    await openRoute(page, 'b', route);
    const flat = await captureViewport(page);
    await openRoute(page, 'b', route, realInsets(testInfo));
    const inset = await captureViewport(page);
    const same = await pixelMatches(testInfo, `neg-inset-${route.name}`, flat, inset);
    expect(same, 'viewport equal at real insets').toBe(route.name !== 'home');
  });
}

test('both sides report the fixture equivalence hash at runtime', async ({ page }) => {
  await openRoute(page, 'a', ROUTES[0]);
  const a = await runtimeHash(page, 'a');
  expect(a.hash, 'a (server baked modules, /parity-probe) hash equals the fixture hash').toBe(fixture.hash);

  await openRoute(page, 'b', ROUTES[0]);
  const b = await runtimeHash(page, 'b');
  expect(b.version, 'b rendered the fixture bundle').toBe(fixture.bundleVersion);
  expect(b.hash, 'b (rendered bundle) hash equals the fixture hash').toBe(fixture.hash);
});
