import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSlotRegistry } from './registry';
import { createRouteRegistry } from './routes-registry';
import { registerRoutes, resetRoutesForTests, isNativeRoute } from './routes-instance';
import { register, resetSlotsForTests, slots } from './instance';

describe('slot registry', () => {
  it('merges slots across slices and is empty by default', () => {
    const r = createSlotRegistry<string>();
    expect(r.slots()).toEqual({});
    r.register({ slice: 'a', slots: { x: 'X' } });
    r.register({ slice: 'b', slots: { y: 'Y' } });
    expect(r.slots()).toEqual({ x: 'X', y: 'Y' });
  });

  it('throws on a clashing slot without partial registration', () => {
    const r = createSlotRegistry<string>();
    r.register({ slice: 'a', slots: { x: 'X' } });
    expect(() => r.register({ slice: 'b', slots: { z: 'Z', x: 'Q' } })).toThrow(/duplicate slot/);
    expect(r.slots()).toEqual({ x: 'X' });
  });

  it('re-registering the same slice is idempotent; different content throws', () => {
    const r = createSlotRegistry<string>();
    r.register({ slice: 'a', slots: { x: 'X' } });
    r.register({ slice: 'a', slots: { x: 'X' } });
    expect(() => r.register({ slice: 'a', slots: { x: 'other' } })).toThrow(/different slots/);
    expect(() => r.register({ slice: 'a', slots: { x: 'X', w: 'W' } })).toThrow(/different slots/);
  });

  it('treats prototype-ish names as ordinary own keys', () => {
    const r = createSlotRegistry<string>();
    r.register({ slice: 'a', slots: { toString: 'T' } });
    expect(() => r.register({ slice: 'b', slots: { toString: 'U' } })).toThrow(/duplicate slot/);
    r.register({ slice: 'c', slots: { constructor: 'C' } });
  });

  it('singleton can be reset for tests', () => {
    resetSlotsForTests();
    register({ slice: 's', slots: { q: 1 } });
    expect(slots()).toEqual({ q: 1 });
    resetSlotsForTests();
    expect(slots()).toEqual({});
  });
});

describe('route registry', () => {
  it('matches strings and regexes; repeated calls are stable', () => {
    const r = createRouteRegistry();
    r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:one', match: '/one' }, { id: 'a:re', match: /^\/b\// }] });
    expect(r.isNativeRoute('/one')).toBe(true);
    for (let i = 0; i < 4; i++) expect(r.isNativeRoute('/b/deep')).toBe(true);
    expect(r.isNativeRoute('/other')).toBe(false);
  });

  it('rejects g/y regexes', () => {
    const r = createRouteRegistry();
    expect(() => r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:g', match: /x/g }] })).toThrow(/stateful/);
    expect(() => r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:y', match: /x/y }] })).toThrow(/stateful/);
  });

  it('rejects duplicate ids inside one call and across slices, atomically', () => {
    const r = createRouteRegistry();
    expect(() =>
      r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'd', match: '/p' }, { id: 'd', match: '/q' }] }),
    ).toThrow(/duplicate native route/);
    expect(r.nativeRoutes()).toEqual([]);
    r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:1', match: '/p' }] });
    expect(() => r.registerRoutes({ slice: 'b', nativeRoutes: [{ id: 'a:1', match: '/z' }] })).toThrow(/duplicate native route/);
  });

  it('rejects identical matchers under different ids (same call or across slices)', () => {
    const r = createRouteRegistry();
    expect(() =>
      r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:1', match: '/p' }, { id: 'a:2', match: '/p' }] }),
    ).toThrow(/repeats the matcher/);
    r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:1', match: /^\/p$/i }] });
    expect(() => r.registerRoutes({ slice: 'b', nativeRoutes: [{ id: 'b:1', match: /^\/p$/i }] })).toThrow(/repeats the matcher/);
    r.registerRoutes({ slice: 'c', nativeRoutes: [{ id: 'c:1', match: /^\/p$/ }] });
  });

  it('is idempotent for the same slice and throws for changed entries', () => {
    const r = createRouteRegistry();
    r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:1', match: /^\/p/ }] });
    r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:1', match: /^\/p/ }] });
    expect(r.nativeRoutes()).toHaveLength(1);
    expect(() => r.registerRoutes({ slice: 'a', nativeRoutes: [{ id: 'a:1', match: '/other' }] })).toThrow(/different routes/);
  });

  it('stores and returns frozen copies', () => {
    const r = createRouteRegistry();
    const entry = { id: 'a:1', match: /^\/p/ as string | RegExp };
    r.registerRoutes({ slice: 'a', nativeRoutes: [entry] });
    entry.id = 'mutated';
    entry.match = '/evil';
    const out = r.nativeRoutes();
    expect(out[0]?.id).toBe('a:1');
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out[0])).toBe(true);
    expect(() => {
      (out[0] as { id: string }).id = 'x';
    }).toThrow();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out[0]?.match as any).compile('^/evil$');
    } catch {
      /* compile may be unavailable; the returned regex is a throwaway either way */
    }
    expect(r.isNativeRoute('/evil')).toBe(false);
    expect(r.isNativeRoute('/p/x')).toBe(true);
  });

  it('singleton can be reset for tests', () => {
    resetRoutesForTests();
    registerRoutes({ slice: 's', nativeRoutes: [{ id: 's:1', match: '/s' }] });
    expect(isNativeRoute('/s')).toBe(true);
    resetRoutesForTests();
    expect(isNativeRoute('/s')).toBe(false);
  });
});

const importSpecs = (src: string) => ts.preProcessFile(src, true, true).importedFiles.map((f) => f.fileName);

describe('native-safe routes module', () => {
  beforeEach(() => resetRoutesForTests());

  it('import scanner sees every import form', () => {
    const src = ['import "./x";', 'export * from "./y";', 'const z = import("./z");', "const w = require('./w');", "import a from './a';"].join('\n');
    expect(importSpecs(src).sort()).toEqual(['./a', './w', './x', './y', './z']);
  });

  it('import graph contains only route/type files, never slot or DOM files', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const seen = new Set<string>();
    const walk = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const src = readFileSync(file, 'utf8');
      for (const spec of importSpecs(src)) {
        expect(spec.startsWith('.'), `non-relative import "${spec}" in ${file}`).toBe(true);
        const base = resolve(dirname(file), spec);
        const target = ['.ts', '.tsx'].map((e) => base + e).find(existsSync);
        expect(target, `unresolved ${spec} from ${file}`).toBeDefined();
        walk(target as string);
      }
    };
    walk(resolve(dir, 'routes.ts'));
    const names = [...seen].map((f) => f.replace(/\\/g, '/').split('/').pop() as string);
    const allowed = (n: string) => ['routes.ts', 'routes-instance.ts', 'routes-registry.ts', 'types.ts'].includes(n) || n.endsWith('.routes.ts');
    expect(names.filter((n) => !allowed(n))).toEqual([]);
  });
});
