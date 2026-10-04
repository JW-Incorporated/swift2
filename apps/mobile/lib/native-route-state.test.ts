import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLOSE_MS,
  INITIAL_NATIVE_ROUTE_STATE,
  OPEN_MS,
  createNativeRoutePresenter,
  domSurfaceRendered,
  reconcileOverlay,
  isPresentablePath,
  msUntilDeadline,
  nativeOwnsBack,
  reduceNativeRoute,
  type NativeRouteEvent,
  type NativeRouteResult,
  type NativeRouteState,
} from './dom-host-handlers';

const KNOWN = new Set(['/inbox', '/settings', '/', '/?tab=1', '/inbox?x=1#h']);
const deps = { isNativeRoute: (p: string) => KNOWN.has(p) };

const idle: NativeRouteState = { phase: 'idle', route: null, seq: 3, deadlineAt: null };
const opening: NativeRouteState = { phase: 'opening', route: '/inbox', seq: 4, deadlineAt: 2500 };
const open: NativeRouteState = { phase: 'open', route: '/inbox', seq: 4, deadlineAt: null };
const closing: NativeRouteState = { phase: 'closing', route: '/inbox', seq: 4, deadlineAt: 2000 };
const T = 1000;
const op = (route: string, seq: number): NativeRouteState => ({ phase: 'opening', route, seq, deadlineAt: T + OPEN_MS });
const cl = (route: string, seq: number): NativeRouteState => ({ phase: 'closing', route, seq, deadlineAt: T + CLOSE_MS });
const idleAt = (seq: number): NativeRouteState => ({ phase: 'idle', route: null, seq, deadlineAt: null });
const present = (path: string): NativeRouteEvent => ({ type: 'present', path, now: T });

type Row = [string, NativeRouteState, NativeRouteEvent, NativeRouteState, NativeRouteResult];

const cases: Row[] = [
  ['present from idle', idle, present('/inbox'), op('/inbox', 4), 'applied'],
  ['present same while opening is noop', opening, present('/inbox'), opening, 'noop'],
  ['present same while open is noop', open, present('/inbox'), open, 'noop'],
  ['present other while opening replaces', opening, present('/settings'), op('/settings', 5), 'applied'],
  ['present other while open replaces', open, present('/settings'), op('/settings', 5), 'applied'],
  ['present same while closing re-presents', closing, present('/inbox'), op('/inbox', 5), 'applied'],
  ['present other while closing re-presents', closing, present('/settings'), op('/settings', 5), 'applied'],
  ['present root with query (allow-listed)', idle, present('/?tab=1'), op('/?tab=1', 4), 'applied'],
  ['present query+hash (allow-listed)', idle, present('/inbox?x=1#h'), op('/inbox?x=1#h', 4), 'applied'],
  ['present root with unlisted query rejected', idle, present('/?tab=2'), idle, 'rejected'],
  ['present unknown route rejected (idle)', idle, present('/bogus'), idle, 'rejected'],
  ['present unknown route rejected (open)', open, present('/bogus'), open, 'rejected'],
  ['present empty rejected', idle, present(''), idle, 'rejected'],
  ['present protocol-relative rejected', idle, present('//evil.com'), idle, 'rejected'],
  ['present absolute url rejected', idle, present('https://x.com/inbox'), idle, 'rejected'],
  ['present dotdot rejected', idle, present('/inbox/../settings'), idle, 'rejected'],
  ['present control char rejected', idle, present('/inbox\u0000'), idle, 'rejected'],
  ['present newline rejected', idle, present('/inbox\n'), idle, 'rejected'],
  ['opened matching seq', opening, { type: 'opened', seq: 4 }, open, 'applied'],
  ['opened stale seq', opening, { type: 'opened', seq: 3 }, opening, 'stale'],
  ['opened while open', open, { type: 'opened', seq: 4 }, open, 'stale'],
  ['opened while closing', closing, { type: 'opened', seq: 4 }, closing, 'stale'],
  ['opened while idle', idle, { type: 'opened', seq: 3 }, idle, 'stale'],
  ['dismiss while opening', opening, { type: 'dismiss', now: T }, cl('/inbox', 4), 'applied'],
  ['dismiss while open', open, { type: 'dismiss', now: T }, cl('/inbox', 4), 'applied'],
  ['dismiss while closing noop', closing, { type: 'dismiss', now: T }, closing, 'noop'],
  ['dismiss idle noop', idle, { type: 'dismiss', now: T }, idle, 'noop'],
  ['back while opening', opening, { type: 'back', now: T }, cl('/inbox', 4), 'applied'],
  ['back while open', open, { type: 'back', now: T }, cl('/inbox', 4), 'applied'],
  ['back while closing noop', closing, { type: 'back', now: T }, closing, 'noop'],
  ['back idle noop', idle, { type: 'back', now: T }, idle, 'noop'],
  ['closed matching seq', closing, { type: 'closed', seq: 4 }, { ...idleAt(4) }, 'applied'],
  ['closed stale seq', closing, { type: 'closed', seq: 3 }, closing, 'stale'],
  ['closed while opening (re-present race)', opening, { type: 'closed', seq: 4 }, opening, 'stale'],
  ['closed while open', open, { type: 'closed', seq: 4 }, open, 'stale'],
  ['closed while idle', idle, { type: 'closed', seq: 3 }, idle, 'stale'],
  ['tick opening before deadline', opening, { type: 'tick', now: 2499 }, opening, 'noop'],
  ['tick opening at deadline (lost opened)', opening, { type: 'tick', now: 2500 }, open, 'applied'],
  ['tick opening after deadline', opening, { type: 'tick', now: 9999 }, open, 'applied'],
  ['tick closing before deadline', closing, { type: 'tick', now: 1999 }, closing, 'noop'],
  ['tick closing at deadline (lost closed)', closing, { type: 'tick', now: 2000 }, idleAt(4), 'applied'],
  ['tick open noop', open, { type: 'tick', now: 9999 }, open, 'noop'],
  ['tick idle noop', idle, { type: 'tick', now: 9999 }, idle, 'noop'],
  ['late opened after tick resolved', { ...open }, { type: 'opened', seq: 4 }, open, 'stale'],
  ['late closed after tick resolved', idleAt(4), { type: 'closed', seq: 4 }, idleAt(4), 'stale'],
  ['old-deadline tick ignored after re-present', op('/settings', 5), { type: 'tick', now: 2400 }, op('/settings', 5), 'noop'],
  ['reset clears opening', opening, { type: 'reset' }, idleAt(5), 'applied'],
  ['reset clears open', open, { type: 'reset' }, idleAt(5), 'applied'],
  ['reset clears closing', closing, { type: 'reset' }, idleAt(5), 'applied'],
  ['reset idle noop', idle, { type: 'reset' }, idle, 'noop'],
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
    expect(INITIAL_NATIVE_ROUTE_STATE).toEqual({ phase: 'idle', route: null, seq: 0, deadlineAt: null });
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
  const clock = { t: 1000 };
  beforeEach(() => {
    clock.t = 1000;
  });

  it('present, replace, then back keeps native owning back until closed', () => {
    const onChange = vi.fn();
    const p = createNativeRoutePresenter({ ...deps, now: () => clock.t, onChange });
    expect(p.presentNativeRoute('/inbox')).toBe('applied');
    expect(p.presentNativeRoute('/settings')).toBe('applied');
    expect(p.getState()).toEqual({ phase: 'opening', route: '/settings', seq: 2, deadlineAt: 2500 });
    expect(p.opened(1)).toBe('stale');
    expect(p.opened(2)).toBe('applied');
    expect(p.handleBack()).toBe(true);
    expect(p.getState().phase).toBe('closing');
    expect(nativeOwnsBack(p.getState())).toBe(true);
    expect(p.handleBack()).toBe(true);
    expect(p.closed(1)).toBe('stale');
    expect(p.closed(2)).toBe('applied');
    expect(p.getState()).toEqual({ phase: 'idle', route: null, seq: 2, deadlineAt: null });
    expect(p.handleBack()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('rejects unknown routes without notifying', () => {
    const onChange = vi.fn();
    const p = createNativeRoutePresenter({ ...deps, now: () => clock.t, onChange });
    expect(p.presentNativeRoute('/bogus')).toBe('rejected');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('watchdog fallback clears and invalidates pending completions', () => {
    const p = createNativeRoutePresenter({ ...deps, now: () => clock.t });
    p.presentNativeRoute('/inbox');
    p.clearOnWatchdogFallback();
    expect(p.getState().phase).toBe('idle');
    expect(p.opened(1)).toBe('stale');
    p.dismiss();
    expect(p.getState().phase).toBe('idle');
  });
  it('lost opened then lost closed are both resolved by ticks', () => {
    const p = createNativeRoutePresenter({ ...deps, now: () => clock.t });
    p.presentNativeRoute('/inbox');
    clock.t = 2499;
    expect(p.tick()).toBe('noop');
    clock.t = 2500;
    expect(p.tick()).toBe('applied');
    expect(p.getState().phase).toBe('open');
    expect(p.opened(1)).toBe('stale');
    p.dismiss();
    expect(p.getState()).toMatchObject({ phase: 'closing', deadlineAt: 3500 });
    clock.t = 3500;
    expect(p.tick()).toBe('applied');
    expect(p.getState().phase).toBe('idle');
    expect(p.closed(1)).toBe('stale');
    expect(p.handleBack()).toBe(false);
  });

  it('dismiss during opening then lost closed resolves to idle via tick', () => {
    const p = createNativeRoutePresenter({ ...deps, now: () => clock.t });
    p.presentNativeRoute('/inbox');
    clock.t = 1200;
    p.dismiss();
    expect(p.getState()).toMatchObject({ phase: 'closing', deadlineAt: 2200 });
    clock.t = 2200;
    expect(p.tick()).toBe('applied');
    expect(p.getState().phase).toBe('idle');
  });

  it('a tick scheduled for a superseded presentation does not resolve the new one', () => {
    const p = createNativeRoutePresenter({ ...deps, now: () => clock.t });
    p.presentNativeRoute('/inbox');
    clock.t = 2000;
    p.presentNativeRoute('/settings');
    clock.t = 2500;
    expect(p.tick()).toBe('noop');
    expect(p.getState().phase).toBe('opening');
  });
});

describe('msUntilDeadline', () => {
  it('is null without a deadline and clamps at zero once past it', () => {
    expect(msUntilDeadline(INITIAL_NATIVE_ROUTE_STATE, 5)).toBeNull();
    const s: NativeRouteState = { phase: 'opening', route: '/inbox', seq: 1, deadlineAt: 1000 };
    expect(msUntilDeadline(s, 400)).toBe(600);
    expect(msUntilDeadline(s, 1500)).toBe(0);
  });
});

describe('overlay lifecycle vs the rendered DOM surface', () => {
  const mk = () => {
    const onChange = vi.fn();
    const p = createNativeRoutePresenter({ isNativeRoute: (x) => x === '/inbox', now: () => 0, onChange });
    return { p, onChange };
  };
  it('the DOM surface is rendered only for mount dom and not while update-required', () => {
    expect(domSurfaceRendered('dom', false)).toBe(true);
    expect(domSurfaceRendered('dom', true)).toBe(false);
    expect(domSurfaceRendered('native', false)).toBe(false);
    expect(domSurfaceRendered('pending', false)).toBe(false);
  });
  it('update-required while open drops the overlay and back ownership', () => {
    const { p } = mk();
    p.presentNativeRoute('/inbox');
    p.opened(p.getState().seq);
    expect(nativeOwnsBack(p.getState())).toBe(true);
    reconcileOverlay(p, domSurfaceRendered('dom', false));
    expect(p.getState().phase).toBe('open');
    expect(reconcileOverlay(p, domSurfaceRendered('dom', true))).toBe('applied');
    expect(p.getState().phase).toBe('idle');
    expect(nativeOwnsBack(p.getState())).toBe(false);
  });
  it('watchdog fallback (mount native) drops the overlay too', () => {
    const { p } = mk();
    p.presentNativeRoute('/inbox');
    reconcileOverlay(p, domSurfaceRendered('native', false));
    expect(p.getState().phase).toBe('idle');
  });
  it('reconciling from idle is a no-op that does not notify or replace the state object', () => {
    const { p, onChange } = mk();
    const before = p.getState();
    expect(reconcileOverlay(p, false)).toBe('noop');
    expect(p.getState()).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });
});
