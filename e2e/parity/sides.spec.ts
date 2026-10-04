import { A_ONLY_ROUTES, A_ONLY_ROUTES_BETA } from './helpers';
import { bBaselineNames, bothSidesRoutes, planBSide } from './sides';
import { expect, test } from '@playwright/test';

// Unit-level (no browser): the b-side plumbing for routes a slice D flips to both sides.
const fixtureRoutes = [
  { name: 'only-a', path: '/x', root: 'main' },
  { name: 'flipped', path: '/y', root: 'main', sides: 'both' as const },
  { name: 'explicit-a', path: '/z', root: 'main', sides: 'a' as const },
];

test('only routes marked both are selected', () => {
  expect(bothSidesRoutes(fixtureRoutes).map((r) => r.name)).toEqual(['flipped']);
});

test('b baseline names follow the b-<route> convention', () => {
  expect(bBaselineNames({ name: 'flipped' })).toEqual({ root: 'b-flipped.png', viewport: 'b-flipped-viewport.png' });
});

test('dry run: a flipped fixture route plans one a-vs-b compare and two b baselines', () => {
  expect(planBSide(fixtureRoutes)).toEqual([
    {
      route: 'flipped',
      compare: 'a vs b viewport: flipped',
      baselines: ['b-flipped.png', 'b-flipped-viewport.png'],
    },
  ]);
});

test('every real route is still a-only (the gate is unchanged)', () => {
  expect(planBSide([...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA])).toEqual([]);
});
