import { describe, expect, it } from 'vitest';
import {
  INITIAL_NATIVE_ROUTE_STATE,
  isPresentablePath,
  nativeOwnsBack,
  reduceNativeRoute,
  type NativeRouteEvent,
  type NativeRouteState,
} from './dom-host-handlers';

const none: NativeRouteState = { route: null };
const inbox: NativeRouteState = { route: '/inbox' };

const cases: Array<[string, NativeRouteState, NativeRouteEvent, NativeRouteState]> = [
  ['present from idle', none, { type: 'present', path: '/inbox' }, inbox],
  ['present replaces other overlay', inbox, { type: 'present', path: '/settings' }, { route: '/settings' }],
  ['present same path is a no-op (same ref)', inbox, { type: 'present', path: '/inbox' }, inbox],
  ['present empty path ignored', none, { type: 'present', path: '' }, none],
  ['present bare slash ignored', none, { type: 'present', path: '/' }, none],
  ['present protocol-relative ignored', inbox, { type: 'present', path: '//evil.com' }, inbox],
  ['present absolute url ignored', none, { type: 'present', path: 'https://x.com/a' }, none],
  ['present whitespace ignored', none, { type: 'present', path: '/a b' }, none],
  ['dismiss clears', inbox, { type: 'dismiss' }, none],
  ['dismiss idle no-op', none, { type: 'dismiss' }, none],
  ['back clears', inbox, { type: 'back' }, none],
  ['back idle no-op', none, { type: 'back' }, none],
  ['watchdog fallback clears', inbox, { type: 'watchdog-fallback' }, none],
  ['watchdog fallback idle no-op', none, { type: 'watchdog-fallback' }, none],
];

describe('reduceNativeRoute', () => {
  it.each(cases)('%s', (_n, state, event, expected) => {
    expect(reduceNativeRoute(state, event)).toEqual(expected);
  });

  it('no-op transitions return the same reference', () => {
    expect(reduceNativeRoute(inbox, { type: 'present', path: '/inbox' })).toBe(inbox);
    expect(reduceNativeRoute(none, { type: 'back' })).toBe(none);
  });

  it('does not mutate input', () => {
    const s = Object.freeze({ route: '/inbox' });
    expect(() => reduceNativeRoute(s, { type: 'dismiss' })).not.toThrow();
  });

  it('initial state has no overlay', () => {
    expect(INITIAL_NATIVE_ROUTE_STATE).toEqual(none);
  });
});

describe('nativeOwnsBack / isPresentablePath', () => {
  it('native owns back only while an overlay is up', () => {
    expect(nativeOwnsBack(none)).toBe(false);
    expect(nativeOwnsBack(inbox)).toBe(true);
  });
  it.each([
    ['/inbox', true],
    ['/songs/x?y=1', true],
    ['inbox', false],
    ['', false],
    [null, false],
    [42, false],
  ])('isPresentablePath(%j) = %s', (p, ok) => {
    expect(isPresentablePath(p)).toBe(ok);
  });
});
