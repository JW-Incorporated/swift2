import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { KNOWN_NATIVE_BUILDS, isKnownBuildKey } from './watchdog-known-builds';

describe('known native builds', () => {
  it('includes the ios buildNumber in app.json (update the set at each native release)', () => {
    const app = JSON.parse(readFileSync(new URL('../../../../mobile/app.json', import.meta.url), 'utf8'));
    expect(KNOWN_NATIVE_BUILDS.has(app.expo.ios.buildNumber)).toBe(true);
  });

  it('matches only a known native build prefix', () => {
    expect(isKnownBuildKey('1:embedded')).toBe(true);
    expect(isKnownBuildKey('2:embedded')).toBe(false);
    expect(isKnownBuildKey('embedded')).toBe(false);
    expect(isKnownBuildKey(':embedded')).toBe(false);
  });
});
