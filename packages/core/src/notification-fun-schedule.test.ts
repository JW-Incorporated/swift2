import { describe, expect, it } from 'vitest';
import { isFunSendDay, startOfLocalPeriod } from './notification-fun-schedule';

describe('isFunSendDay', () => {
  it('daily is always eligible', () => {
    expect(isFunSendDay('daily', 'America/Los_Angeles', new Date('2026-01-15T20:00:00Z'))).toBe(
      true,
    );
    expect(isFunSendDay('daily', 'America/Los_Angeles', new Date('2026-01-16T20:00:00Z'))).toBe(
      true,
    );
  });

  it('weekly is only eligible on local Friday', () => {
    // 2026-01-16 is a Friday.
    const friday = new Date('2026-01-16T20:00:00Z'); // 12:00 PST Friday
    const saturday = new Date('2026-01-17T20:00:00Z'); // 12:00 PST Saturday
    expect(isFunSendDay('weekly', 'America/Los_Angeles', friday)).toBe(true);
    expect(isFunSendDay('weekly', 'America/Los_Angeles', saturday)).toBe(false);
  });

  it('monthly is only eligible on the 1st, local time', () => {
    const first = new Date('2026-02-01T20:00:00Z'); // 12:00 PST Feb 1
    const second = new Date('2026-02-02T20:00:00Z');
    expect(isFunSendDay('monthly', 'America/Los_Angeles', first)).toBe(true);
    expect(isFunSendDay('monthly', 'America/Los_Angeles', second)).toBe(false);
  });

  it('monthly respects local tz across a UTC day boundary', () => {
    // 2026-02-01T00:30:00Z is still Jan 31 in Los Angeles (UTC-8) — not the 1st locally.
    const almostMidnightUtc = new Date('2026-02-01T00:30:00Z');
    expect(isFunSendDay('monthly', 'America/Los_Angeles', almostMidnightUtc)).toBe(false);
  });
});

describe('startOfLocalPeriod', () => {
  it('daily: local midnight today', () => {
    const now = new Date('2026-01-15T20:00:00Z'); // 12:00 PST
    const start = startOfLocalPeriod('daily', 'America/Los_Angeles', now);
    // 2026-01-15T00:00 PST = 2026-01-15T08:00:00Z
    expect(start.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('weekly: local midnight on the most recent Sunday', () => {
    // 2026-01-16 is a Friday; the most recent Sunday is 2026-01-11.
    const now = new Date('2026-01-16T20:00:00Z');
    const start = startOfLocalPeriod('weekly', 'America/Los_Angeles', now);
    expect(start.toISOString()).toBe('2026-01-11T08:00:00.000Z');
  });

  it('weekly: on a Sunday itself, returns that same day local midnight', () => {
    // 2026-01-11 is a Sunday.
    const now = new Date('2026-01-11T20:00:00Z');
    const start = startOfLocalPeriod('weekly', 'America/Los_Angeles', now);
    expect(start.toISOString()).toBe('2026-01-11T08:00:00.000Z');
  });

  it('monthly: local midnight on the 1st of the current local month', () => {
    const now = new Date('2026-02-15T20:00:00Z');
    const start = startOfLocalPeriod('monthly', 'America/Los_Angeles', now);
    expect(start.toISOString()).toBe('2026-02-01T08:00:00.000Z');
  });

  it('is DST-safe across a spring-forward boundary (America/Los_Angeles, 2026-03-08)', () => {
    // Query a few days after spring-forward; daily period start must use
    // the POST-transition (PDT, UTC-7) offset, not the stale PST one.
    const now = new Date('2026-03-10T20:00:00Z');
    const start = startOfLocalPeriod('daily', 'America/Los_Angeles', now);
    expect(start.toISOString()).toBe('2026-03-10T07:00:00.000Z'); // PDT = UTC-7, so local midnight = 07:00Z
  });
});
