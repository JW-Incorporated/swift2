import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-device', () => ({ DeviceType: { UNKNOWN: 0, PHONE: 1, TABLET: 2 } }));
vi.mock('expo-screen-orientation', () => ({}));

import { shouldLockPortrait } from './orientation-lock';

describe('shouldLockPortrait', () => {
  it('locks phones only', () => {
    expect(shouldLockPortrait(1, 1)).toBe(true);
    expect(shouldLockPortrait(2, 1)).toBe(false);
    expect(shouldLockPortrait(0, 1)).toBe(false);
  });
});
