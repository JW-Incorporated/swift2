import { describe, expect, it } from 'vitest';
import {
  clampToSendWindow,
  isWithinSendWindow,
  nextDigestOccurrence,
} from './notification-digest-schedule';

describe('clampToSendWindow', () => {
  it('leaves an in-window hour untouched', () => {
    expect(clampToSendWindow(9)).toBe(9);
    expect(clampToSendWindow(21)).toBe(21);
    expect(clampToSendWindow(8)).toBe(8);
  });

  it('clamps below the window up to 8', () => {
    expect(clampToSendWindow(3)).toBe(8);
    expect(clampToSendWindow(0)).toBe(8);
  });

  it('clamps above the window down to 21', () => {
    expect(clampToSendWindow(23)).toBe(21);
    expect(clampToSendWindow(22)).toBe(21);
  });

  it('falls back to the minimum for a non-finite input', () => {
    expect(clampToSendWindow(Number.NaN)).toBe(8);
  });
});

describe('nextDigestOccurrence — daily, three distinct timezones', () => {
  it('America/Los_Angeles: schedules today if digest hour has not passed', () => {
    // 2026-01-15T16:00:00Z = 08:00 PST — digest_hour 9 hasn't happened yet.
    const now = new Date('2026-01-15T16:00:00Z');
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    // 09:00 PST (UTC-8) = 17:00Z same day.
    expect(next.toISOString()).toBe('2026-01-15T17:00:00.000Z');
  });

  it('America/Los_Angeles: rolls to tomorrow once digest hour has passed', () => {
    const now = new Date('2026-01-15T20:00:00Z'); // 12:00 PST
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    expect(next.toISOString()).toBe('2026-01-16T17:00:00.000Z');
  });

  it('Asia/Tokyo (UTC+9, no DST): schedules correctly', () => {
    // 2026-01-15T00:00:00Z = 09:00 JST — right at digest hour, not yet passed
    // (strictly greater-than check), so it should roll to tomorrow.
    const now = new Date('2026-01-15T00:00:00Z');
    const next = nextDigestOccurrence('daily', 'Asia/Tokyo', 9, now);
    // Next day 09:00 JST = 2026-01-16T00:00:00Z.
    expect(next.toISOString()).toBe('2026-01-16T00:00:00.000Z');
  });

  it('Asia/Tokyo: schedules today when before digest hour', () => {
    const now = new Date('2026-01-14T23:00:00Z'); // 08:00 JST
    const next = nextDigestOccurrence('daily', 'Asia/Tokyo', 9, now);
    expect(next.toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('Australia/Sydney (UTC+10/+11 DST): schedules correctly in southern-hemisphere summer', () => {
    // Sydney is in DST (AEDT, UTC+11) in January. 2026-01-15T18:00:00Z = 05:00 AEDT next day.
    const now = new Date('2026-01-15T18:00:00Z');
    const next = nextDigestOccurrence('daily', 'Australia/Sydney', 9, now);
    // 09:00 AEDT on 2026-01-16 = 2026-01-15T22:00:00Z (UTC+11).
    expect(next.toISOString()).toBe('2026-01-15T22:00:00.000Z');
  });
});

describe('nextDigestOccurrence — DST transition day (America/Los_Angeles, 2026-03-08 spring forward)', () => {
  // 2026-03-08 02:00 local PST springs forward to 03:00 PDT. Before the
  // transition (UTC-8); after, UTC-7.
  it('a device querying just before the spring-forward transition still gets the correct local digest time', () => {
    // 2026-03-08T09:00:00Z = 01:00 PST (still standard time, pre-transition).
    const now = new Date('2026-03-08T09:00:00Z');
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    // 09:00 local on 2026-03-08 falls AFTER the 2am transition, so it's
    // 09:00 PDT (UTC-7) = 16:00Z — no double-send, no zero-send: exactly
    // one correct instant, not two hours off from either offset guess.
    expect(next.toISOString()).toBe('2026-03-08T16:00:00.000Z');
  });

  it('a device querying just after the spring-forward transition computes the same correct instant', () => {
    // 2026-03-08T10:30:00Z = 03:30 PDT (just after the 2am->3am jump).
    const now = new Date('2026-03-08T10:30:00Z');
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    expect(next.toISOString()).toBe('2026-03-08T16:00:00.000Z');
  });

  it('the day AFTER spring-forward uses the new PDT offset consistently', () => {
    const now = new Date('2026-03-09T05:00:00Z'); // well before 9am PDT
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    expect(next.toISOString()).toBe('2026-03-09T16:00:00.000Z');
  });
});

describe('nextDigestOccurrence — DST transition day (America/Los_Angeles, 2026-11-01 fall back)', () => {
  it('computes the correct instant straddling the fall-back transition (no double-send, no zero-send)', () => {
    // 2026-11-01 02:00 PDT falls back to 01:00 PST. Query well before 9am.
    const now = new Date('2026-11-01T09:00:00Z'); // 02:00 PDT (pre-fallback, still UTC-7)
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    // 09:00 local AFTER the fallback is PST (UTC-8) = 17:00Z.
    expect(next.toISOString()).toBe('2026-11-01T17:00:00.000Z');
  });

  it('the day after fall-back uses the new PST offset', () => {
    const now = new Date('2026-11-02T10:00:00Z'); // 02:00 PST
    const next = nextDigestOccurrence('daily', 'America/Los_Angeles', 9, now);
    expect(next.toISOString()).toBe('2026-11-02T17:00:00.000Z');
  });

  it('never schedules two occurrences for the same local digest hour across the fallback day', () => {
    // Simulate repeated dispatch ticks through the fallback day; the
    // computed "next occurrence" from any point before 9am local should
    // always be the SAME single instant, not two different ones straddling
    // the repeated 1am-2am hour.
    const ticks = [
      new Date('2026-11-01T08:00:00Z'), // 01:00 PDT (first pass through 1am)
      new Date('2026-11-01T08:30:00Z'), // 01:30 PDT
      new Date('2026-11-01T09:00:00Z'), // 02:00 PDT -> falls back to 01:00 PST
      new Date('2026-11-01T09:30:00Z'), // 01:30 PST (second pass through 1:30am)
    ];
    const occurrences = ticks.map((t) =>
      nextDigestOccurrence('daily', 'America/Los_Angeles', 9, t).toISOString(),
    );
    // Every tick before 9am local (regardless of which "1am" it landed in)
    // resolves to the exact same 9am-local send instant — one occurrence,
    // not duplicated or skipped.
    expect(new Set(occurrences).size).toBe(1);
    expect(occurrences[0]).toBe('2026-11-01T17:00:00.000Z');
  });
});

describe('nextDigestOccurrence — weekly cadence', () => {
  it('schedules the upcoming Friday at digest hour', () => {
    // 2026-01-12 is a Monday.
    const now = new Date('2026-01-12T16:00:00Z'); // 08:00 PST Monday
    const next = nextDigestOccurrence('weekly', 'America/Los_Angeles', 9, now);
    // Friday 2026-01-16, 09:00 PST = 17:00Z.
    expect(next.toISOString()).toBe('2026-01-16T17:00:00.000Z');
  });

  it('schedules TODAY when it is already Friday and the hour has not passed', () => {
    const now = new Date('2026-01-16T16:00:00Z'); // Friday, 08:00 PST
    const next = nextDigestOccurrence('weekly', 'America/Los_Angeles', 9, now);
    expect(next.toISOString()).toBe('2026-01-16T17:00:00.000Z');
  });

  it('rolls to NEXT Friday when it is Friday but the digest hour has already passed', () => {
    const now = new Date('2026-01-16T20:00:00Z'); // Friday, 12:00 PST
    const next = nextDigestOccurrence('weekly', 'America/Los_Angeles', 9, now);
    expect(next.toISOString()).toBe('2026-01-23T17:00:00.000Z');
  });
});

describe('isWithinSendWindow', () => {
  it('is true inside 8am-9pm local', () => {
    const now = new Date('2026-01-15T20:00:00Z'); // 12:00 PST
    expect(isWithinSendWindow('America/Los_Angeles', now)).toBe(true);
  });

  it('is false before 8am local', () => {
    const now = new Date('2026-01-15T10:00:00Z'); // 02:00 PST
    expect(isWithinSendWindow('America/Los_Angeles', now)).toBe(false);
  });

  it('is false after 9pm local', () => {
    const now = new Date('2026-01-16T06:00:00Z'); // 22:00 PST prior day
    expect(isWithinSendWindow('America/Los_Angeles', now)).toBe(false);
  });
});
