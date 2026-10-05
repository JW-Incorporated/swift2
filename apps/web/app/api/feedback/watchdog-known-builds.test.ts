import { describe, expect, it } from 'vitest';
import { KNOWN_NATIVE_BUILDS, isKnownBuildKey } from './watchdog-known-builds';

describe('known native builds (device-reported, not app.json)', () => {
  it('matches the shipped store builds per platform', () => {
    expect(KNOWN_NATIVE_BUILDS.ios.has('38')).toBe(true);
    expect(KNOWN_NATIVE_BUILDS.android.has('18')).toBe(true);
  });

  it('is per platform and prefix-exact', () => {
    expect(isKnownBuildKey('ios', '38:embedded')).toBe(true);
    expect(isKnownBuildKey('android', '18:embedded')).toBe(true);
    expect(isKnownBuildKey('ios', '18:embedded')).toBe(false);
    expect(isKnownBuildKey('android', '1:embedded')).toBe(false);
    expect(isKnownBuildKey('ios', '381:embedded')).toBe(false);
    expect(isKnownBuildKey('ios', ':embedded')).toBe(false);
    expect(isKnownBuildKey('ios', 'embedded')).toBe(false);
  });
});
