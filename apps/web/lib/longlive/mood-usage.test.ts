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
    expect(usage.used()).toBe(1);
    usage.release();
    expect(usage.used()).toBe(0);
    // The freed slot is usable again.
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
  });

  it('never drops the count below zero', () => {
    const usage = new MoodUsage(3, () => Date.parse('2026-07-25T10:00:00Z'));
    usage.release();
    usage.release();
    expect(usage.used()).toBe(0);
  });

  it('is a no-op once the window has already rolled over (nothing to give back to a stale day)', () => {
    let now = Date.parse('2026-07-25T23:59:00Z');
    const usage = new MoodUsage(2, () => now);
    expect(usage.reserve()).toBe(true);
    now = Date.parse('2026-07-26T00:01:00Z');
    usage.release();
    expect(usage.used()).toBe(0);
    // Still 2 available in the new window, not 3 (release did not leak
    // across the boundary into crediting the new day).
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
  });
});
