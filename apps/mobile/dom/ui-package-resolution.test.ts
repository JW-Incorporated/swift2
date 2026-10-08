import { UI_PACKAGE_VERSION } from '@swift2/ui';
import { describe, expect, it } from 'vitest';

describe('apps/mobile resolves @swift2/ui', () => {
  it('exposes UI_PACKAGE_VERSION', () => {
    expect(UI_PACKAGE_VERSION).toBe('0.0.0');
  });
});
