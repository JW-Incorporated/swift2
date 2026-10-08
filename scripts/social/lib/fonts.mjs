// Font loading for satori. Satori needs raw font bytes (TTF/OTF/WOFF — NOT
// WOFF2) up front for every weight it will render; it has no access to a
// browser or the OS font stack. We reuse the exact two families the live
// site already uses (apps/web/app/layout.tsx: Playfair Display for serif
// headlines, Inter for everything else) via `@fontsource/*`, which ships
// static .woff files we can read straight off disk — no network fetch at
// render time, so this works offline and stays deterministic in CI.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function woff(pkg, file) {
  const pkgJsonPath = require.resolve(`${pkg}/package.json`);
  const pkgDir = pkgJsonPath.slice(0, -'package.json'.length);
  return readFileSync(`${pkgDir}files/${file}`);
}

let cached = null;

/** The fixed font set every card is rendered with (satori wants all fonts
 * up front, not looked up per-element), keyed by family name + weight for
 * readability at call sites. */
export function loadFonts() {
  if (cached) return cached;
  cached = [
    {
      name: 'Playfair Display',
      data: woff('@fontsource/playfair-display', 'playfair-display-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Playfair Display',
      data: woff('@fontsource/playfair-display', 'playfair-display-latin-900-normal.woff'),
      weight: 900,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: woff('@fontsource/inter', 'inter-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: woff('@fontsource/inter', 'inter-latin-600-normal.woff'),
      weight: 600,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: woff('@fontsource/inter', 'inter-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: woff('@fontsource/inter', 'inter-latin-800-normal.woff'),
      weight: 800,
      style: 'normal',
    },
  ];
  return cached;
}
