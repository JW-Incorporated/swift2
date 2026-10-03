import { describe, expect, it, vi } from 'vitest';
import {
  INITIAL_NATIVE_ROUTE_STATE,
  createNativeRoutePresenter,
  isPresentablePath,
  nativeOwnsBack,
  reduceNativeRoute,
  type NativeRouteEvent,
  type NativeRouteResult,
  type NativeRouteState,
} from './dom-host-handlers';

const KNOWN = new Set(['/inbox', '/settings', '/', '/?tab=1', '/inbox?x=1#h']);
const deps = { isNativeRoute: (p: string) => KNOWN.has(p) };

const idle: NativeRouteState = { phase: 'idle', route: null, seq: 3 };
const opening: NativeRouteState = { phase: 'opening', route: '/inbox', seq: 4 };
const open: NativeRouteState = { phase: 'open', route: '/inbox', seq: 4 };
const closing: NativeRouteState = { phase: 'closing', route: '/inbox', seq: 4 };

type Row = [string, NativeRouteState, NativeRouteEvent, NativeRouteState, NativeRouteResult];

const cases: Row[] = [
  ['present from idle', idle, { type: 'present', path: '/inbox' }, opening, 'applied'],
  ['present same while opening is noop', opening, { type: 'present', path: '/inbox' }, opening, 'noop'],
  ['present same while open is noop', open, { type: 'present', path: '/inbox' }, open, 'noop'],
  ['present other while opening replaces', opening, { type: 'present', path: '/settings' }, { phase: 'opening', route: '/settings', seq: 5 }, 'applied'],
  ['present other while open replaces', open, { type: 'present', path: '/settings' }, { phase: 'opening', route: '/settings', seq: 5 }, 'applied'],
  ['present same while closing re-presents', closing, { type: 'present', path: '/inbox' }, { phase: 'opening', route: '/inbox', seq: 5 }, 'applied'],
  ['present other while closing re-presents', closing, { type: 'present', path: '/settings' }, { phase: 'opening', route: '/settings', seq: 5 }, 'applied'],
  ['present root with query (allow-listed)', idle, { type: 'present', path: '/?tab=1' }, { phase: 'opening', route: '/?tab=1', seq: 4 }, 'applied'],
  ['present query+hash (allow-listed)', idle, { type: 'present', path: '/inbox?x=1#h' }, { phase: 'opening', route: '/inbox?x=1#h', seq: 4 }, 'applied'],
  ['present root with unlisted query rejected', idle, { type: 'present', path: '/?tab=2' }, idle, 'rejected'],
  ['present unknown route rejected (idle)', idle, { type: 'present', path: '/bogus' }, idle, 'rejected'],
  ['present unknown route rejected (open)', open, { type: 'present', path: '/bogus' }, open, 'rejected'],
  ['present empty rejected', idle, { type: 'present', path: '' }, idle, 'rejected'],
  ['present protocol-relative rejected', idle, { type: 'present', path: '//evil.com' }, idle, 'rejected'],
  ['present absolute url rejected', idle, { type: 'present', path: 'https://x.com/inbox' }, idle, 'rejected'],
  ['present dotdot rejected', idle, { type: 'present', path: '/inbox/../settings' }, idle, 'rejected'],
  ['present control char rejected', idle, { type: 'present', path: '/inbox\u0000' }, idle, 'rejected'],
  ['present newline rejected', idle, { type: 'present', path: '/inbox\n' }, idle, 'rejected'],
  ['opened matching seq', opening, { type: 'opened', seq: 4 }, open, 'applied'],
  ['opened stale seq', opening, { type: 'opened', seq: 3 }, opening, 'stale'],
  ['opened while open', open, { type: 'opened', seq: 4 }, open, 'stale'],
  ['opened while closing', closing, { type: 'opened', seq: 4 }, closing, 'stale'],
  ['opened while idle', idle, { type: 'opened', seq: 3 }, idle, 'stale'],
  ['dismiss while opening', opening, { type: 'dismiss' }, closing, 'applied'],
  ['dismiss while open', open, { type: 'dismiss' }, closing, 'applied'],
  ['dismiss while closing noop', closing, { type: 'dismiss' }, closing, 'noop'],
  ['dismiss idle noop', idle, { type: 'dismiss' }, idle, 'noop'],
  ['back while opening', opening, { type: 'back' }, closing, 'applied'],
  ['back while open', open, { type: 'back' }, closing, 'applied'],
  ['back while closing noop', closing, { type: 'back' }, closing, 'noop'],
  ['back idle noop', idle, { type: 'back' }, idle, 'noop'],
  ['closed matching seq', closing, { type: 'closed', seq: 4 }, { phase: 'idle', route: null, seq: 4 }, 'applied'],
  ['closed stale seq', closing, { type: 'closed', seq: 3 }, closing, 'stale'],
  ['closed while opening (re-present race)', opening, { type: 'closed', seq: 4 }, opening, 'stale'],
  ['closed while open', open, { type: 'closed', seq: 4 }, open, 'stale'],
  ['closed while idle', idle, { type: 'closed', seq: 3 }, idle, 'stale'],
  ['watchdog clears opening', opening, { type: 'watchdog-fallback' }, { phase: 'idle', route: null, seq: 5 }, 'applied'],
  ['watchdog clears open', open, { type: 'watchdog-fallback' }, { phase: 'idle', route: null, seq: 5 }, 'applied'],
  ['watchdog clears closing', closing, { type: 'watchdog-fallback' }, { phase: 'idle', route: null, seq: 5 }, 'applied'],
  ['watchdog idle noop', idle, { type: 'watchdog-fallback' }, idle, 'noop'],
];

describe('reduceNativeRoute', () => {
  it.each(cases)('%s', (_n, state, event, expected, result) => {
    const out = reduceNativeRoute(state, event, deps);
    expect(out.state).toEqual(expected);
    expect(out.result).toBe(result);
  });

  it('non-applied results keep the same state reference', () => {
    for (const [, state, event, , result] of cases) {
      if (result !== 'applied') expect(reduceNativeRoute(state, event, deps).state).toBe(state);
    }
  });

  it('never mutates its input', () => {
    for (const [, state, event] of cases) {
      const frozen = Object.freeze({ ...state });
      expect(() => reduceNativeRoute(frozen, event, deps)).not.toThrow();
      expect(frozen).toEqual(state);
    }
  });

  it('initial state is idle', () => {
    expect(INITIAL_NATIVE_ROUTE_STATE).toEqual({ phase: 'idle', route: null, seq: 0 });
  });
});

describe('nativeOwnsBack', () => {
  it.each([
    [idle, false],
    [opening, true],
    [open, true],
    [closing, true],
  ])('%j -> %s', (s, expected) => {
    expect(nativeOwnsBack(s)).toBe(expected);
  });
});

describe('isPresentablePath', () => {
  it.each([
    ['/inbox', true],
    ['/', true],
    ['/songs/x?y=1#z', true],
    ['/a..b', true],
    ['inbox', false],
    ['', false],
    ['//x', false],
    ['/a b', false],
    ['/a\\b', false],
    ['/a/../b', false],
    ['/..', false],
    ['/a/%2e%2E/b', false],
    ['/a\u007f', false],
    [null, false],
    [42, false],
  ])('%j -> %s', (p, ok) => {
    expect(isPresentablePath(p)).toBe(ok);
  });
});

describe('createNativeRoutePresenter', () => {
  it('present, replace, then back keeps native owning back until closed', () => {
    const onChange = vi.fn();
    const p = createNativeRoutePresenter({ ...deps, onChange });
    expect(p.presentNativeRoute('/inbox')).toBe('applied');
    expect(p.presentNativeRoute('/settings')).toBe('applied');
    expect(p.getState()).toEqual({ phase: 'opening', route: '/settings', seq: 2 });
    expect(p.opened(1)).toBe('stale');
    expect(p.opened(2)).toBe('applied');
    expect(p.handleBack()).toBe(true);
    expect(p.getState().phase).toBe('closing');
    expect(nativeOwnsBack(p.getState())).toBe(true);
    expect(p.handleBack()).toBe(true);
    expect(p.closed(1)).toBe('stale');
    expect(p.closed(2)).toBe('applied');
    expect(p.getState()).toEqual({ phase: 'idle', route: null, seq: 2 });
    expect(p.handleBack()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('rejects unknown routes without notifying', () => {
    const onChange = vi.fn();
    const p = createNativeRoutePresenter({ ...deps, onChange });
    expect(p.presentNativeRoute('/bogus')).toBe('rejected');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('watchdog fallback clears and invalidates pending completions', () => {
    const p = createNativeRoutePresenter(deps);
    p.presentNativeRoute('/inbox');
    p.clearOnWatchdogFallback();
    expect(p.getState().phase).toBe('idle');
    expect(p.opened(1)).toBe('stale');
    p.dismiss();
    expect(p.getState().phase).toBe('idle');
  });
});
