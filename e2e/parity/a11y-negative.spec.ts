import { newViolations, readBaseline, keyOf, scan } from './a11y';
import { expect, openRoute, ROUTES, test } from './helpers';

// Proves the a11y gate catches real regressions: an image with no alt and a
// button with no accessible name, injected after load, must surface as NEW
// violations against the committed baseline on either side.
const route = ROUTES[0];

for (const side of ['a', 'b'] as const) {
  test(`side ${side}: an alt-less image and a nameless button fail the gate`, async ({ page }, testInfo) => {
    await openRoute(page, side, route);
    await page.locator(route.root).first().evaluate((root) => {
      const img = document.createElement('img');
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
      const btn = document.createElement('button');
      root.append(img, btn);
    });
    const added = newViolations(await scan(page), readBaseline(testInfo.project.name)[keyOf(side, route)] ?? []);
    expect(added.join('\n')).toContain('image-alt');
    expect(added.join('\n')).toContain('button-name');
  });
}
