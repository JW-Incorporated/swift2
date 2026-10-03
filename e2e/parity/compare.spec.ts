import {
  captureRoot,
  expect,
  fixture,
  openRoute,
  pixelMatches,
  ROUTES,
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

    await openRoute(page, 'b', route);
    const pixelsB = await captureRoot(page, route);
    const structB = await collectStructure(page, route.root);

    expect.soft(diffStructure(structA, structB), 'structural a-vs-b').toEqual([]);
    expect.soft(await pixelMatches(testInfo, `ref-a-${route.name}`, pixelsA, pixelsB), 'pixel a-vs-b').toBe(true);
  });
}

test('both sides render the fixture snapshot (equivalence hash)', async ({ page }) => {
  await openRoute(page, 'b', ROUTES[0]);
  type Probe = { version?: string; snapshot?: { hash: string } };
  const read = () => page.evaluate(() => (window as unknown as { __probe?: Probe }).__probe ?? null);
  await expect.poll(async () => (await read())?.snapshot?.hash, 'b reports its snapshot').toBeTruthy();
  const probe = await read();
  expect(probe?.version, 'b rendered the fixture bundle').toBe(fixture.bundleVersion);
  expect(probe?.snapshot?.hash, 'b snapshot hash equals the fixture hash (baked == bundle on a)').toBe(fixture.hash);
});
