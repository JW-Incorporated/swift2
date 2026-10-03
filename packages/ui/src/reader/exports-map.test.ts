import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkgDir = resolve(__dirname, '../..');
const exportsMap = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')).exports as Record<
  string,
  string
>;
const slices = ['moment', 'threads', 'tracks', 'search', 'merch', 'community', 'clown', 'settings', 'legal'];

function resolveSubpath(specifier: string): string | null {
  let best: { key: string; star: string } | null = null;
  for (const key of Object.keys(exportsMap)) {
    if (key === specifier) return exportsMap[key]!;
    const i = key.indexOf('*');
    if (i < 0) continue;
    const pre = key.slice(0, i);
    if (specifier.startsWith(pre) && (!best || pre.length > best.key.indexOf('*'))) {
      best = { key, star: specifier.slice(pre.length) };
    }
  }
  return best ? exportsMap[best.key]!.replace('*', best.star) : null;
}

describe('slice subpath exports', () => {
  it('resolves .tsx components and lib/ .ts modules per slice', () => {
    for (const s of slices) {
      expect(resolveSubpath(`./reader/${s}/Thing`)).toBe(`./src/reader/${s}/Thing.tsx`);
      expect(resolveSubpath(`./reader/${s}/lib/thing`)).toBe(`./src/reader/${s}/lib/thing.ts`);
      expect(existsSync(resolve(pkgDir, resolveSubpath(`./reader/${s}`)!))).toBe(true);
    }
  });
});
