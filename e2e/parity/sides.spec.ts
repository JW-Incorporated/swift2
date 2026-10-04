import { A_ONLY_ROUTES, A_ONLY_ROUTES_BETA } from './helpers';
import { assertNoBaselineCollisions, bBaselineNames, bothSidesRoutes, planBSide } from './sides';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

test('every route flipped to both has its b baselines committed for every project', () => {
  const shots = resolve(fileURLToPath(new URL('.', import.meta.url)), '__screenshots__');
  const projects = readdirSync(shots, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  expect(projects.length).toBeGreaterThan(0);
  const missing: string[] = [];
  for (const r of bothSidesRoutes([...A_ONLY_ROUTES, ...A_ONLY_ROUTES_BETA])) {
    for (const file of Object.values(bBaselineNames(r))) {
      for (const p of projects) if (!existsSync(resolve(shots, p, file))) missing.push(`${p}/${file}`);
    }
  }
  expect(missing, 'missing b baselines (run parity.yml update-baselines)').toEqual([]);
});

// Folded into the last test so the parity test count is unchanged by the name guard.
test('baseline name collisions throw', () => {
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
