import { CHROME_CASES, emulateInsetsOnA, scrollTo } from './chrome';
import { captureViewport, openAOnlyRoute, pixelMatches, realInsets, test, expect } from './helpers';

// W6-chrome: the shell chrome (TopBar, BottomNav, footer, floating feedback pill) is outside the shared root, so the root
// compares never see it. Whole viewport, chrome included, a vs b: b with the project's real simulated insets, a with the
// same pixels substituted for env(safe-area-inset-*) plus the host's body clearance. Never regenerated on b to pass.
for (const c of CHROME_CASES) {
  test(`chrome a vs b real insets: ${c.name}`, async ({ pages }, testInfo) => {
    const insets = realInsets(testInfo);
    await emulateInsetsOnA(pages.a, insets);
    await openAOnlyRoute(pages.a, c.route, 'a');
    await scrollTo(pages.a, c.scroll);
    const pixelsA = await captureViewport(pages.a);

    await openAOnlyRoute(pages.b, c.route, 'b', insets);
    await scrollTo(pages.b, c.scroll);
    const pixelsB = await captureViewport(pages.b);
    await testInfo.attach('a.png', { body: pixelsA, contentType: 'image/png' });
    expect(await pixelMatches(testInfo, `ref-a-chrome-${c.name}`, pixelsA, pixelsB), 'chrome viewport a-vs-b').toBe(true);
  });
}
