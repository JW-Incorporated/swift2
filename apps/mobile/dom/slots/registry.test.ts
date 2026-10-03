import { describe, expect, it } from 'vitest';
import { createSlotRegistry } from './registry';

describe('slot registry', () => {
  it('merges slots and native routes across slices', () => {
    const r = createSlotRegistry<string>();
    r.register({ slice: 'a', slots: { x: 'X' }, nativeRoutes: [{ id: 'a:one', match: '/one' }] });
    r.register({ slice: 'b', slots: { y: 'Y' }, nativeRoutes: [{ id: 'b:re', match: /^\/b\// }] });
    expect(r.slots()).toEqual({ x: 'X', y: 'Y' });
    expect(r.nativeRoutes().map((n) => n.id)).toEqual(['a:one', 'b:re']);
    expect(r.isNativeRoute('/one')).toBe(true);
    expect(r.isNativeRoute('/b/deep')).toBe(true);
    expect(r.isNativeRoute('/other')).toBe(false);
  });

  it('is empty by default', () => {
    const r = createSlotRegistry();
    expect(r.slots()).toEqual({});
    expect(r.isNativeRoute('/')).toBe(false);
  });

  it('throws on duplicate slice, slot or route id without partial registration', () => {
    const r = createSlotRegistry<string>();
    r.register({ slice: 'a', slots: { x: 'X' }, nativeRoutes: [{ id: 'a:one', match: '/one' }] });
    expect(() => r.register({ slice: 'a', slots: {} })).toThrow(/duplicate slice/);
    expect(() => r.register({ slice: 'b', slots: { x: 'Z' } })).toThrow(/duplicate slot/);
    expect(() => r.register({ slice: 'c', slots: { z: 'Z' }, nativeRoutes: [{ id: 'a:one', match: '/q' }] })).toThrow(/duplicate native route/);
    expect(r.slots()).toEqual({ x: 'X' });
  });
});
