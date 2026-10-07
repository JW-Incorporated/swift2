import { describe, expect, it } from 'vitest';
import { ROUTE_FLAG_KEYS, appConfigSchema } from './app-config';

describe('appConfigSchema', () => {
  it('accepts a full config and a partial one', () => {
    const full = { routeFlags: Object.fromEntries(ROUTE_FLAG_KEYS.map((k) => [k, true])) };
    expect(appConfigSchema.safeParse(full).success).toBe(true);
    expect(appConfigSchema.safeParse({ routeFlags: { song: false } }).success).toBe(true);
    expect(appConfigSchema.safeParse({ routeFlags: {} }).success).toBe(true);
  });

  it('ignores (strips) unknown keys rather than rejecting', () => {
    const result = appConfigSchema.safeParse({
      routeFlags: { song: false, futureScreen: true },
      somethingNew: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.routeFlags).toEqual({ song: false });
      expect(result.data).not.toHaveProperty('somethingNew');
    }
  });

  it('rejects a non-boolean value for a known flag', () => {
    expect(appConfigSchema.safeParse({ routeFlags: { song: 'no' } }).success).toBe(false);
  });

  it('accepts positive-integer minNativeBuild values and rejects others', () => {
    expect(
      appConfigSchema.safeParse({ routeFlags: {}, minNativeBuild: { ios: 12, android: 3 } })
        .success,
    ).toBe(true);
    expect(
      appConfigSchema.safeParse({ routeFlags: {}, minNativeBuild: { ios: 1.5 } }).success,
    ).toBe(false);
    expect(
      appConfigSchema.safeParse({ routeFlags: {}, minNativeBuild: { android: 0 } }).success,
    ).toBe(false);
    expect(
      appConfigSchema.safeParse({ routeFlags: {}, minNativeBuild: { ios: '3' } }).success,
    ).toBe(false);
  });
});
