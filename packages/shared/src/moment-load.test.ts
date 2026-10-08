import { describe, expect, it } from 'vitest';
import {
  classifyMomentError,
  initialMomentLoadState,
  momentLoadReducer,
} from './moment-load';
import type { Moment } from './vault-types';

const moment: Moment = { monthItemId: 'a', context: 'hi', sources: [], photos: [] };

describe('momentLoadReducer', () => {
  it('OPEN starts loading for the given request', () => {
    const s = momentLoadReducer(initialMomentLoadState, { type: 'OPEN', itemId: 'a', requestId: 1 });
    expect(s.status).toBe('loading');
    expect(s.itemId).toBe('a');
    expect(s.requestId).toBe(1);
  });

  it('SLOW only applies to the current in-flight request', () => {
    const s = momentLoadReducer(initialMomentLoadState, { type: 'OPEN', itemId: 'a', requestId: 1 });
    expect(momentLoadReducer(s, { type: 'SLOW', requestId: 0 }).status).toBe('loading');
    expect(momentLoadReducer(s, { type: 'SLOW', requestId: 1 }).status).toBe('slow');
  });

  it('RESOLVE loads the moment for the current request', () => {
    const s = momentLoadReducer(initialMomentLoadState, { type: 'OPEN', itemId: 'a', requestId: 1 });
    const r = momentLoadReducer(s, { type: 'RESOLVE', requestId: 1, moment });
    expect(r.status).toBe('loaded');
    expect(r.moment).toBe(moment);
  });

  it('ignores a superseded tap: a stale RESOLVE cannot overwrite the new load', () => {
    const first = momentLoadReducer(initialMomentLoadState, { type: 'OPEN', itemId: 'a', requestId: 1 });
    const second = momentLoadReducer(first, { type: 'OPEN', itemId: 'b', requestId: 2 });
    const stale = momentLoadReducer(second, { type: 'RESOLVE', requestId: 1, moment });
    expect(stale.status).toBe('loading');
    expect(stale.itemId).toBe('b');
    expect(stale.moment).toBeNull();
  });

  it('REJECT sets the degraded reason for the current request', () => {
    const s = momentLoadReducer(initialMomentLoadState, { type: 'OPEN', itemId: 'a', requestId: 1 });
    expect(momentLoadReducer(s, { type: 'REJECT', requestId: 1, reason: 'timeout' }).status).toBe('timeout');
    expect(momentLoadReducer(s, { type: 'REJECT', requestId: 1, reason: 'notfound' }).status).toBe('notfound');
  });

  it('CLOSE returns to idle and invalidates in-flight replies', () => {
    const s = momentLoadReducer(initialMomentLoadState, { type: 'OPEN', itemId: 'a', requestId: 1 });
    const c = momentLoadReducer(s, { type: 'CLOSE', requestId: 2 });
    expect(c.status).toBe('idle');
    expect(c.itemId).toBeNull();
    expect(c.requestId).toBe(2);
    // a late reply for the now-stale request 1 must not reopen the panel
    expect(momentLoadReducer(c, { type: 'RESOLVE', requestId: 1, moment }).status).toBe('idle');
  });
});

describe('classifyMomentError', () => {
  it('maps signals to degraded states in priority order', () => {
    expect(classifyMomentError({ timedOut: true, offline: true, status: 404 })).toBe('timeout');
    expect(classifyMomentError({ offline: true, status: 404 })).toBe('offline');
    expect(classifyMomentError({ status: 404 })).toBe('notfound');
    expect(classifyMomentError({ status: 500 })).toBe('error');
    expect(classifyMomentError({})).toBe('error');
  });
});
