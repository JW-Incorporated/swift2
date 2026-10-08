import { describe, expect, it } from 'vitest';

import { MoodUsage } from './mood-usage';

describe('MoodUsage daily cap', () => {
  it('reserves up to the cap, then refuses', () => {
    const usage = new MoodUsage(3, () => Date.parse('2026-07-25T10:00:00Z'));
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
    expect(usage.used()).toBe(3);
  });

  it('rolls the window over at the UTC day boundary', () => {
    let now = Date.parse('2026-07-25T23:59:00Z');
    const usage = new MoodUsage(2, () => now);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);

    now = Date.parse('2026-07-26T00:01:00Z');
    expect(usage.used()).toBe(0);
    expect(usage.reserve()).toBe(true);
  });

  it('a cap of zero refuses every call (kill switch)', () => {
    const usage = new MoodUsage(0, () => Date.parse('2026-07-25T10:00:00Z'));
    expect(usage.reserve()).toBe(false);
  });
});

// HUMAN-ACTIONS.md #15 item 4: give back a reservation that turned out to
// be wasted (Clownbot's per-user cap denying a request AFTER the shared
// global slot was already taken).
describe('MoodUsage.release', () => {
  it('gives back exactly one reserved slot', () => {
    const usage = new MoodUsage(3, () => Date.parse('2026-07-25T10:00:00Z'));
    expect(usage.reserve()).toBe(true);
    const day = usage.reservedDay();
    expect(usage.used()).toBe(1);
    usage.release(day);
    expect(usage.used()).toBe(0);
    // The freed slot is usable again.
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
  });

  it('never drops the count below zero', () => {
    const usage = new MoodUsage(3, () => Date.parse('2026-07-25T10:00:00Z'));
    usage.release(usage.reservedDay());
    usage.release(usage.reservedDay());
    expect(usage.used()).toBe(0);
  });

  it('is a no-op once the window has already rolled over (nothing to give back to a stale day)', () => {
    let now = Date.parse('2026-07-25T23:59:00Z');
    const usage = new MoodUsage(2, () => now);
    expect(usage.reserve()).toBe(true);
    const staleDay = usage.reservedDay();
    now = Date.parse('2026-07-26T00:01:00Z');
    usage.release(staleDay);
    expect(usage.used()).toBe(0);
    // Still 2 available in the new window, not 3 (release did not leak
    // across the boundary into crediting the new day).
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
  });

  // HUMAN-ACTIONS.md #15 round 4: the actual bug — a reservation taken just
  // before midnight, released just after, once some OTHER caller's own
  // reserve() has already rolled the window forward, must stay a no-op
  // against the stale day rather than decrementing the NEW day's live
  // count (the old release() inferred "today" at release time, which by
  // then matched the already-rolled internal day and wrongly decremented
  // it).
  it('does not decrement the new day\'s live count when a stale reservation is released after the window rolled over via another reserve()', () => {
    let now = Date.parse('2026-07-25T23:59:00Z');
    const usage = new MoodUsage(2, () => now);
    expect(usage.reserve()).toBe(true); // day X, count=1
    const staleDay = usage.reservedDay(); // day X

    now = Date.parse('2026-07-26T00:01:00Z');
    expect(usage.reserve()).toBe(true); // a DIFFERENT request rolls the window to day Y, count=1

    usage.release(staleDay); // the stale day-X reservation is released late
    expect(usage.used()).toBe(1); // day Y's live count must be untouched
  });
});
