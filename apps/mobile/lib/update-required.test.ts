import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-application', () => ({ nativeBuildVersion: '42' }));

import {
  ANDROID_STORE_URL,
  IOS_STORE_URL,
  currentNativeBuild,
  isUpdateRequired,
  storeUrlFor,
} from './update-required';

describe('isUpdateRequired', () => {
  const min = { ios: 10, android: 20 };

  it('is false when minNativeBuild is absent', () => {
    expect(isUpdateRequired({ platform: 'ios', nativeBuild: 1 })).toBe(false);
  });

  it('is false when the platform key is absent', () => {
    expect(
      isUpdateRequired({ platform: 'android', nativeBuild: 1, minNativeBuild: { ios: 5 } }),
    ).toBe(false);
  });

  it('is false for an unknown platform', () => {
    expect(isUpdateRequired({ platform: 'web', nativeBuild: 1, minNativeBuild: min })).toBe(false);
  });

  it('is false when the native build is unknown', () => {
    expect(isUpdateRequired({ platform: 'ios', nativeBuild: null, minNativeBuild: min })).toBe(
      false,
    );
    expect(
      isUpdateRequired({ platform: 'ios', nativeBuild: Number.NaN, minNativeBuild: min }),
    ).toBe(false);
  });

  it('is true only when the build is below the platform minimum', () => {
    expect(isUpdateRequired({ platform: 'ios', nativeBuild: 9, minNativeBuild: min })).toBe(true);
    expect(isUpdateRequired({ platform: 'ios', nativeBuild: 10, minNativeBuild: min })).toBe(false);
    expect(isUpdateRequired({ platform: 'android', nativeBuild: 19, minNativeBuild: min })).toBe(
      true,
    );
    expect(isUpdateRequired({ platform: 'android', nativeBuild: 25, minNativeBuild: min })).toBe(
      false,
    );
  });
});

describe('store helpers', () => {
  it('picks the store URL by platform', () => {
    expect(storeUrlFor('ios')).toBe(IOS_STORE_URL);
    expect(storeUrlFor('android')).toBe(ANDROID_STORE_URL);
  });

  it('parses the native build number', () => {
    expect(currentNativeBuild()).toBe(42);
  });
});
