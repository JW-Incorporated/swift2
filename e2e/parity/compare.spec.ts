import {
  COVERAGE_ROUTES,
  EXTRA_ROUTES,
  openAOnlyRoute,
  captureElement,
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
import { comparedRoutes } from './sides';
import { collectStructure, diffStructure } from './structure';

// Side a (Next web build) vs side b (the app's DOM entry), zero insets on b,
// same engine and project, font-normalised. Both gates are blocking.
for (const route of ROUTES) {
  test(`a vs b: ${route.name}`, async ({ pages }, testInfo) => {
    takeExternalImages(pages.a);
    await openRoute(pages.a, 'a', route);
    const pixelsA = await captureRoot(pages.a, route);
    const imagesA = takeExternalImages(pages.a);
    const structA = await collectStructure(pages.a, route.root);

    takeExternalImages(pages.b);
    await openRoute(pages.b, 'b', route);
    const pixelsB = await captureRoot(pages.b, route);
    const imagesB = takeExternalImages(pages.b);
    const structB = await collectStructure(pages.b, route.root);

    expect.soft(imagesB, 'external image URLs requested: b equals a').toEqual(imagesA);
    expect.soft(diffStructure(structA, structB), 'structural a-vs-b').toEqual([]);
    expect.soft(await pixelMatches(testInfo, `ref-a-${route.name}`, pixelsA, pixelsB), 'pixel a-vs-b').toBe(true);
  });

  // home: body top padding and the nav clearance read --safe-*, so insets must show. item: MomentDetail has no safe-area
  // styles and its modal covers the nav, so it is inset-immune by construction (docs/one-ui/parity.md); pinned here.
  // The floating FeedbackButton sits OUTSIDE the dialog and legitimately rides the bottom inset (reader-spike.css uses
  // var(--safe-bottom) like the web uses env()), so it is hidden in the immunity check only; the dialog itself is compared.
  const FEEDBACK_PILL = '[class~="bottom-[calc(4.5rem+env(safe-area-inset-bottom))]"]';
  const hide = route.name === 'home' ? [] : [FEEDBACK_PILL];
  const verb = route.name === 'home' ? 'change' : 'do not change (immune dialog)';
  test(`real insets ${verb} b's viewport: ${route.name}`, async ({ page }, testInfo) => {
    await openRoute(page, 'b', route);
    const flat = await captureViewport(page, hide);
    await openRoute(page, 'b', route, realInsets(testInfo));
    const inset = await captureViewport(page, hide);
    const same = await pixelMatches(testInfo, `neg-inset-${route.name}`, flat, inset);
    expect(same, 'viewport equal at real insets').toBe(route.name !== 'home');
  });
}

// H4/D2: side b now renders the full packages/ui shell (TopBar, era stream, BottomNav), so the two base routes
// also get the whole-viewport a-vs-b compare (header and nav visible); D2 renders only these two itself.
for (const route of ROUTES) {
  test(`a vs b viewport: ${route.name}`, async ({ pages }, testInfo) => {
    await openRoute(pages.a, 'a', route);
    const pixelsA = await captureViewport(pages.a);
    await openRoute(pages.b, 'b', route);
    const pixelsB = await captureViewport(pages.b);
    expect(await pixelMatches(testInfo, `ref-a-${route.name}-viewport`, pixelsA, pixelsB), 'viewport a-vs-b').toBe(true);
  });
}

// W1-E: routes a slice D flipped to sides 'both' get a whole-viewport a-vs-b compare (zero insets on b, same engine, font-normalised).
// Every flipped route (all of A_ONLY_ROUTES, A_ONLY_ROUTES_BETA and COVERAGE_ROUTES) is generated here.
for (const route of comparedRoutes(EXTRA_ROUTES)) {
  test(`a vs b viewport: ${route.name}`, async ({ pages }, testInfo) => {
    await openAOnlyRoute(pages.a, route, 'a');
    const pixelsA = await captureViewport(pages.a);
    await openAOnlyRoute(pages.b, route, 'b');
    const pixelsB = await captureViewport(pages.b);
    expect(await pixelMatches(testInfo, `ref-a-${route.name}-viewport`, pixelsA, pixelsB), 'viewport a-vs-b').toBe(true);
  });
}

// W5-parity: the coverage routes are element surfaces (an open picker, lightbox, menu or detail), so the clip itself is also compared a-vs-b.
for (const route of comparedRoutes(COVERAGE_ROUTES).filter((r) => r.clip)) {
  test(`a vs b clip: ${route.name}`, async ({ pages }, testInfo) => {
    await openAOnlyRoute(pages.a, route, 'a');
    const pixelsA = await captureElement(pages.a, route.clip!);
    await openAOnlyRoute(pages.b, route, 'b');
    const pixelsB = await captureElement(pages.b, route.clip!);
    expect(await pixelMatches(testInfo, `ref-a-${route.name}-clip`, pixelsA, pixelsB), 'clip a-vs-b').toBe(true);
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
