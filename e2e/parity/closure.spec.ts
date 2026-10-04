import { ACCEPTED_DIVERGENCES } from './divergences';
import { EXTRA_ROUTES, ROUTES } from './helpers';
import { bBaselineNames } from './sides';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// One UI parity closure invariant (Fable end-state, G1 acceptance): "identical" is a CI invariant, not a claim.
// Unit-level (no browser). Accepted divergences: docs/one-ui/parity-divergences.md.

/** Routes allowed to stay side-a-only. Empty: every web surface renders on both sides. Adding one needs a documented reason. */
const A_ONLY_ALLOW_LIST: readonly string[] = [];

/**
 * Every slot a dom/slots slice registers, mapped to the parity route that exercises it. The slot list itself is read from the
 * slice files (below), so this map is the only thing a new slot has to touch, and forgetting it fails the first test.
 */
const SLOT_ROUTE: Readonly<Record<string, string>> = {
  'surface:era': 'home',
  'surface:threads': 'threads',
  'surface:mood': 'mood',
  'surface:clownbot': 'clownbot',
  'surface:community': 'community',
  'surface:merch': 'merch',
  'overlay:moment': 'item',
  'overlay:era-selector': 'era-selector',
  'overlay:search': 'search-open',
  'overlay:settings': 'settings-notifications',
  'overlay:legal': 'privacy',
  'overlay:theory-guide': 'theories',
  'overlay:track-guide': 'guide',
  'overlay:song': 'song',
  footer: 'support',
  floating: 'feedback-dialog-open',
};

const here = fileURLToPath(new URL('.', import.meta.url));
const slotsDir = resolve(here, '../../apps/mobile/dom/slots');

const sliceSources = (): string[] =>
  readdirSync(slotsDir)
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => readFileSync(resolve(slotsDir, f), 'utf8'));

/** Slot names declared by the slice files: `surface:*` / `overlay:*` literals, plus the bare `footer` / `floating` slots. */
const registeredSlots = (): string[] => {
  const found = new Set<string>();
  for (const src of sliceSources()) {
    for (const m of src.matchAll(/'((?:surface|overlay):[a-z-]+)'/g)) found.add(m[1]!);
    for (const m of src.matchAll(/slots:\s*\{\s*(footer|floating):/g)) found.add(m[1]!);
  }
  return [...found].sort();
};

const allRoutes = () => [...ROUTES.map((r) => ({ name: r.name, sides: 'both' as const })), ...EXTRA_ROUTES];

test('every registered slot maps to a both-sides parity route', () => {
  const slots = registeredSlots();
  expect(slots.length, 'no slots found: the scan is broken').toBeGreaterThanOrEqual(14);
  expect(slots, 'slot registered without a SLOT_ROUTE entry (or a stale entry)').toEqual(Object.keys(SLOT_ROUTE).sort());
  const routes = new Map(allRoutes().map((r) => [r.name, r.sides]));
  for (const slot of slots) {
    expect(routes.get(SLOT_ROUTE[slot]!), `${slot} -> ${SLOT_ROUTE[slot]} must be a both-sides parity route`).toBe('both');
  }
});

test('the app overlay fallback has no rows and no mode paths', () => {
  const src = readFileSync(resolve(slotsDir, 'overlay-fallback.tsx'), 'utf8');
  const rows = /OVERLAY_FALLBACK_ROWS: readonly FallbackRow\[\] = \[([\s\S]*?)\];/.exec(src);
  expect(rows, 'OVERLAY_FALLBACK_ROWS declaration not found').not.toBeNull();
  expect(rows![1]!.replace(/\/\/.*$/gm, '').trim(), 'OVERLAY_FALLBACK_ROWS must be empty').toBe('');
  const modes = /MODE_PATHS[^=]*=\s*\{([\s\S]*?)\};/.exec(src);
  expect(modes, 'MODE_PATHS declaration not found').not.toBeNull();
  expect(modes![1]!.replace(/\/\/.*$/gm, '').trim(), 'MODE_PATHS must be empty').toBe('');
});

test('every parity route is sides both except the documented allow-list', () => {
  const aOnly = allRoutes().filter((r) => r.sides !== 'both').map((r) => r.name);
  expect(aOnly.filter((n) => !A_ONLY_ALLOW_LIST.includes(n)), 'a-only route without justification').toEqual([]);
  expect(A_ONLY_ALLOW_LIST.filter((n) => !aOnly.includes(n)), 'stale allow-list entry').toEqual([]);
});

test('every both route has b baselines for all four projects', () => {
  const shots = resolve(here, '__screenshots__');
  const projects = readdirSync(shots, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  expect(projects.sort()).toEqual(['ipad-pro-11-landscape', 'ipad-pro-11-portrait', 'iphone-15', 'pixel-7']);
  const missing: string[] = [];
  for (const r of [...ROUTES, ...EXTRA_ROUTES.filter((x) => x.sides === 'both')]) {
    for (const file of Object.values(bBaselineNames(r))) {
      for (const p of projects) if (!existsSync(resolve(shots, p, file))) missing.push(`${p}/${file}`);
    }
  }
  expect(missing, 'missing b baselines (run parity.yml update-baselines)').toEqual([]);
});

test('native routes, the divergence manifest and parity-divergences.md agree exactly', () => {
  const host = readFileSync(resolve(slotsDir, 'host.routes.ts'), 'utf8');
  const native = [...host.matchAll(/match:\s*'([^']+)'/g)].map((m) => m[1]!).sort();
  expect(native.length, 'no native routes found: the scan is broken').toBeGreaterThan(0);
  const manifestNative = ACCEPTED_DIVERGENCES.flatMap((d) => (d.nativeRoute ? [d.nativeRoute] : [])).sort();
  expect(manifestNative, 'a native route is not a documented divergence (or the reverse)').toEqual(native);

  const doc = readFileSync(resolve(here, '../../docs/one-ui/parity-divergences.md'), 'utf8');
  const documented = [...doc.matchAll(/^- \*\*`([a-z0-9-]+)`\*\*/gm)].map((m) => m[1]!).sort();
  expect(documented, 'parity-divergences.md bullets must equal the manifest ids').toEqual(ACCEPTED_DIVERGENCES.map((d) => d.id).sort());
  for (const d of ACCEPTED_DIVERGENCES) {
    if (d.nativeRoute) expect(doc, `${d.id} must cite ${d.nativeRoute}`).toContain(`\`${d.nativeRoute}\``);
  }
});
