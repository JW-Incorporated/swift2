import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGAL_DOCS } from '../packages/ui/src/reader/legal/lib/legal';
import { pickSentinels } from './check-client-corpus.mjs';

const root = resolve(__dirname, '..');
const CORPUS = join(root, 'packages/ui/src/reader/legal/lib/legal.ts');

function* sources(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* sources(p);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) yield p;
  }
}

function resolveSpec(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else if (spec.startsWith('@/')) base = join(root, 'apps/web', spec.slice(2));
  else if (spec.startsWith('@swift2/ui/')) base = join(root, 'packages/ui/src', spec.slice(11));
  else return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

describe('client/corpus boundary', () => {
  it('no "use client" file imports legal.ts (directly or via a re-export shim)', () => {
    const files = [
      ...sources(join(root, 'apps/web')),
      ...sources(join(root, 'packages/ui/src')),
    ];
    const imports = new Map<string, string[]>();
    const clientFiles: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(src)) clientFiles.push(f);
      const specs: string[] = [];
      for (const m of src.matchAll(IMPORT_RE)) {
        const r = resolveSpec(f, m[1] ?? m[2] ?? m[3]);
        if (r) specs.push(r);
      }
      imports.set(f, specs);
    }
    // Files that re-export the corpus carry it too.
    const corpus = new Set([CORPUS]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const f of files) {
        if (corpus.has(f)) continue;
        const src = readFileSync(f, 'utf8');
        const reexports = [...src.matchAll(/export\s[^'"]*?from\s*['"]([^'"]+)['"]/g)]
          .map((m) => resolveSpec(f, m[1]))
          .some((r) => r && corpus.has(r));
        if (reexports) {
          corpus.add(f);
          grew = true;
        }
      }
    }
    const offenders = clientFiles.filter((f) => imports.get(f)!.some((r) => corpus.has(r)));
    expect(offenders.map((f) => f.slice(root.length + 1))).toEqual([]);
  });

  it('derives distinctive sentinels from LEGAL_DOCS', () => {
    const s = pickSentinels(LEGAL_DOCS);
    expect(s.length).toBeGreaterThanOrEqual(2);
    expect(new Set(s).size).toBe(s.length);
  });
});
