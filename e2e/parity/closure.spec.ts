import { EXTRA_ROUTES, ROUTES } from './helpers';
import { bBaselineNames } from './sides';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// One UI parity closure invariant (Fable end-state, G1 acceptance): "identical" is a CI invariant, not a claim.
// Unit-level (no browser). Divergences that are accepted live in docs/one-ui/parity.md ("Accepted platform divergences").

/** Routes allowed to stay side-a-only. Empty: every web surface renders on both sides. Adding one needs a documented reason in parity.md. */
const A_ONLY_ALLOW_LIST: readonly string[] = [];

const here = fileURLToPath(new URL('.', import.meta.url));

test('every web surface and overlay is slotted: the app overlay fallback has no rows and no mode paths', () => {
  const src = readFileSync(resolve(here, '../../apps/mobile/dom/slots/overlay-fallback.tsx'), 'utf8');
  const rows = /OVERLAY_FALLBACK_ROWS: readonly FallbackRow\[\] = \[([\s\S]*?)\];/.exec(src);
  expect(rows, 'OVERLAY_FALLBACK_ROWS declaration not found').not.toBeNull();
  expect(rows![1]!.replace(/\/\/.*$/gm, '').trim(), 'OVERLAY_FALLBACK_ROWS must be empty').toBe('');
  const modes = /MODE_PATHS[^=]*=\s*\{([\s\S]*?)\};/.exec(src);
  expect(modes, 'MODE_PATHS declaration not found').not.toBeNull();
  expect(modes![1]!.replace(/\/\/.*$/gm, '').trim(), 'MODE_PATHS must be empty').toBe('');
});

test('every parity route is sides both except the documented allow-list', () => {
  const all = [...ROUTES.map((r) => ({ name: r.name, sides: 'both' as const })), ...EXTRA_ROUTES];
  const aOnly = all.filter((r) => r.sides !== 'both').map((r) => r.name);
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
