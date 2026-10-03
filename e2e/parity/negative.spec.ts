import {
  captureRoot,
  collectStructure,
  diffStructure,
  expect,
  mutate,
  openRoute,
  pixelMatches,
  ROUTES,
  test,
  type Mutation,
} from './helpers';

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

test.describe('structural a-vs-b gate', () => {
  const STRUCTURAL: [string, Mutation][] = [
    ['a missing landmark', 'remove'],
    ['changed text', 'text'],
    ['a 4px shift', 'shift'],
  ];
  for (const [label, kind] of STRUCTURAL) {
    test(`${label} fails`, async ({ page }) => {
      await openRoute(page, 'a', route);
      const a = await collectStructure(page, route);
      await openRoute(page, 'b', route);
      await mutate(page, route, kind);
      const b = await collectStructure(page, route);
      expect(diffStructure(a, b).length).toBeGreaterThan(0);
    });
  }

  test('the unmutated pair passes (the gate is not vacuous the other way)', async ({ page }) => {
    await openRoute(page, 'a', route);
    const a = await collectStructure(page, route);
    await openRoute(page, 'b', route);
    expect(a.length).toBeGreaterThan(100);
    expect(diffStructure(a, await collectStructure(page, route))).toEqual([]);
  });
});
