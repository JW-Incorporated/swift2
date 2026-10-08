import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  findDowngrades,
  parseLockVersions,
  parseVersion,
} from './check-no-downgrade.mjs';

/** Build a minimal lockfile-v3 object from a { name: version } map. */
const lock = (deps: Record<string, string>, prefix = 'node_modules/') => ({
  lockfileVersion: 3,
  packages: {
    '': { name: 'root' },
    ...Object.fromEntries(Object.entries(deps).map(([n, v]) => [`${prefix}${n}`, { version: v }])),
  },
});

describe('parseVersion / compareVersions (semver precedence)', () => {
  it('orders release components numerically, not lexically', () => {
    expect(compareVersions('5.0.9', '5.0.7')).toBeGreaterThan(0);
    expect(compareVersions('1.30.0', '1.25.0')).toBeGreaterThan(0); // not "1.3" < "1.2"
    expect(compareVersions('2.112.3', '2.112.2')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('ranks a prerelease below its release (§11.3)', () => {
    expect(compareVersions('1.0.0-beta.0', '1.0.0')).toBeLessThan(0);
    expect(compareVersions('1.0.0-beta.2', '1.0.0-beta.10')).toBeLessThan(0); // numeric ids
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
  });

  it('tolerates a leading v and ignores build metadata', () => {
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.2.3+build9', '1.2.3+build1')).toBe(0);
  });

  it('returns null for garbage and throws when comparing it', () => {
    expect(parseVersion('not-a-version')).toBeNull();
    expect(parseVersion('workspace:*')).toBeNull();
    expect(() => compareVersions('1.0.0', 'nope')).toThrow(/unparseable/);
  });
});

describe('parseLockVersions', () => {
  it('keys by package name and keeps the HIGHEST version across nested copies', () => {
    const l = {
      lockfileVersion: 3,
      packages: {
        '': { name: 'root' },
        'node_modules/foo': { version: '1.0.0' },
        'node_modules/bar/node_modules/foo': { version: '2.0.0' },
        'apps/web': {}, // local workspace — no version, must be ignored
        'node_modules/@scope/pkg': { version: '3.1.0' },
        'node_modules/linked': { resolved: 'link', link: true }, // no version
      },
    };
    const { versions } = parseLockVersions(l);
    expect(versions.get('foo')).toBe('2.0.0');
    expect(versions.get('@scope/pkg')).toBe('3.1.0');
    expect(versions.has('linked')).toBe(false);
    expect([...versions.keys()]).not.toContain('apps/web');
  });

  it('ignores dependencies bundled inside another published package', () => {
    const l = {
      lockfileVersion: 3,
      packages: {
        '': { name: 'root' },
        'node_modules/foo': { version: '2.0.0' },
        'node_modules/vendor/node_modules/foo': { version: '9.0.0', inBundle: true },
        'node_modules/vendor/node_modules/bundled-only': { version: '1.0.0', inBundle: true },
      },
    };
    const { versions } = parseLockVersions(l);
    expect(versions.get('foo')).toBe('2.0.0');
    expect(versions.has('bundled-only')).toBe(false);
  });

  it('throws (BROKEN GATE) when there is no packages map', () => {
    expect(() => parseLockVersions({ lockfileVersion: 1 } as never)).toThrow(/packages/);
  });
});

describe('findDowngrades', () => {
  it('flags a decrease, ignores increases, new packages, and removals', () => {
    const base = lock({ a: '1.2.0', b: '2.0.0', gone: '9.0.0' });
    const head = lock({ a: '1.1.0', b: '2.1.0', added: '1.0.0' });
    const found = findDowngrades(base, head);
    expect(found.map((d) => d.name)).toEqual(['a']); // b increased, gone removed, added is new
    expect(found[0]).toMatchObject({ from: '1.2.0', to: '1.1.0', allowed: false });
  });

  // The regression this guard exists for. PR #1903 regenerated the lockfile
  // from a base predating #1893's brace-expansion 5.0.7 -> 5.0.9 security bump,
  // reverting it to 5.0.7 on `main` with a green check. These are the real
  // versions from that merge (see git 490752f..8a11310 package-lock.json).
  it('catches the real #1903 brace-expansion regression', () => {
    const base = lock({
      'brace-expansion': '5.0.9', // what #1893 had put on main
      '@supabase/supabase-js': '2.112.2',
    });
    const head = lock({
      'brace-expansion': '5.0.7', // what #1903's stale lockfile reverted it to
      '@supabase/supabase-js': '2.112.3', // an increase in the same PR — must not mask the downgrade
    });
    const found = findDowngrades(base, head);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      name: 'brace-expansion',
      from: '5.0.9',
      to: '5.0.7',
      allowed: false,
    });
  });

  it('waives a downgrade only when an allowlist entry names the exact landing version', () => {
    const base = lock({ typescript: '6.0.3' });
    const head = lock({ typescript: '5.9.3' });
    const wave = [{ name: 'typescript', to: '5.9.3', reason: 'ts6 broke the build; revert tracked in #X' }];
    expect(findDowngrades(base, head, wave)[0]).toMatchObject({ allowed: true });

    // A stale exception aimed at a DIFFERENT target must not wave this one.
    const staleWave = [{ name: 'typescript', to: '5.8.0', reason: 'old' }];
    expect(findDowngrades(base, head, staleWave)[0]).toMatchObject({ allowed: false });
  });

  it('does not treat a dropped nested duplicate as safe if it lowers the max', () => {
    // base resolves foo at 2.0.0 (top) and 1.0.0 (nested); head drops the 2.x tree.
    const base = {
      lockfileVersion: 3,
      packages: {
        '': {},
        'node_modules/foo': { version: '2.0.0' },
        'node_modules/dep/node_modules/foo': { version: '1.0.0' },
      },
    };
    const head = lock({ foo: '1.0.0' });
    // Conservative by design: max dropped 2.0.0 -> 1.0.0, so it is flagged for a
    // human to confirm the 2.x removal was intentional (the allowlist is the yes).
    expect(findDowngrades(base, head).map((d) => d.name)).toEqual(['foo']);
  });

  it('does not mistake a surviving bundled copy for a downgrade when a resolved package is removed', () => {
    const base = {
      lockfileVersion: 3,
      packages: {
        '': {},
        'node_modules/foo': { version: '2.0.0' },
        'node_modules/vendor/node_modules/foo': { version: '1.0.0', inBundle: true },
      },
    };
    const head = {
      lockfileVersion: 3,
      packages: {
        '': {},
        'node_modules/vendor/node_modules/foo': { version: '1.0.0', inBundle: true },
      },
    };
    expect(findDowngrades(base, head)).toEqual([]);
  });
});
