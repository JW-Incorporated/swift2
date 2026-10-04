import { A_ONLY_ROUTES, A_ONLY_ROUTES_BETA } from './helpers';
import { assertNoBaselineCollisions, bBaselineNames, bothSidesRoutes, planBSide } from './sides';
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

// Folded into the last test so the parity test count is unchanged by the name guard.
test('every real route is still a-only; baseline name collisions throw', () => {
  expect(planBSide([...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA])).toEqual([]);
  const base = [
    { name: 'home', path: '/', root: 'main' },
    { name: 'item', path: '/?item=x', root: 'main' },
  ];
  const flip = (name: string) => ({ name, path: '/q', root: 'main', sides: 'both' as const });
  expect(() => assertNoBaselineCollisions(base, [flip('item')])).toThrow(/collides with route "item"/);
  expect(() => assertNoBaselineCollisions(base, [flip('item-viewport')])).toThrow(/b-item-viewport.png/);
  expect(() => assertNoBaselineCollisions(base, [flip('x-viewport'), flip('x')])).toThrow(/collides/);
  expect(() => assertNoBaselineCollisions(base, [flip('item-video'), flip('home-feed')])).not.toThrow();
  expect(() => assertNoBaselineCollisions(base, [{ name: 'item', path: '/', root: 'main' }])).not.toThrow();
});
