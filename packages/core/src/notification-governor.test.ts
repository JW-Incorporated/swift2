import { describe, expect, it } from 'vitest';
import {
  evaluateGovernor,
  gateCoalescing,
  gateDailyCap,
  gateMasterAndSnooze,
  gateQuietHours,
  localHour,
  startOfLocalDay,
  type GovernorDeviceSettings,
} from './notification-governor';

function device(overrides: Partial<GovernorDeviceSettings> = {}): GovernorDeviceSettings {
  return {
    masterEnabled: true,
    snoozeUntil: null,
    dailyCap: 3,
    quietStart: 22,
    quietEnd: 8,
    tz: 'America/Los_Angeles',
    ...overrides,
  };
}

describe('gateMasterAndSnooze', () => {
  it('blocks when master is off', () => {
    expect(gateMasterAndSnooze(device({ masterEnabled: false }), new Date())).toEqual({
      action: 'skip',
      reason: 'master_off',
    });
  });

  it('blocks while snoozed', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(gateMasterAndSnooze(device({ snoozeUntil: future }), new Date())).toEqual({
      action: 'skip',
      reason: 'snoozed',
      until: future,
    });
  });

  it('passes once snooze has expired', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(gateMasterAndSnooze(device({ snoozeUntil: past }), new Date())).toBeNull();
  });

  it('passes with master on and no snooze', () => {
    expect(gateMasterAndSnooze(device(), new Date())).toBeNull();
  });
});

describe('localHour', () => {
  it('resolves a known UTC instant to the correct LA hour (winter, PST -08:00)', () => {
    // 2026-01-15T20:00:00Z -> 12:00 PST
    expect(localHour('America/Los_Angeles', new Date('2026-01-15T20:00:00Z'))).toBe(12);
  });

  it('resolves the same instant differently across timezones', () => {
    const at = new Date('2026-06-15T12:00:00Z');
    expect(localHour('UTC', at)).toBe(12);
    expect(localHour('Asia/Tokyo', at)).toBe(21); // UTC+9
  });
});

describe('gateQuietHours', () => {
  it('holds an event that lands inside a midnight-wrapping window (22-8)', () => {
    // 2026-01-15T07:00:00Z -> 23:00 PST previous day (winter, -08:00) -> inside 22-8
    const now = new Date('2026-01-15T07:00:00Z');
    const result = gateQuietHours(device({ quietStart: 22, quietEnd: 8 }), now);
    expect(result).toEqual({ action: 'hold', reason: 'quiet_hours', resumeAtLocalHour: 8 });
  });

  it('passes when local hour is outside the window', () => {
    // 2026-01-15T20:00:00Z -> 12:00 PST -> outside 22-8
    const now = new Date('2026-01-15T20:00:00Z');
    expect(gateQuietHours(device({ quietStart: 22, quietEnd: 8 }), now)).toBeNull();
  });

  it('holds T1 events too — nothing bypasses quiet hours (spec §6.2)', () => {
    const now = new Date('2026-01-15T07:00:00Z');
    const result = gateQuietHours(device({ quietStart: 22, quietEnd: 8 }), now);
    expect(result?.action).toBe('hold');
  });

  it('handles a non-wrapping window (e.g. 1-5 AM)', () => {
    const insideDevice = device({ quietStart: 1, quietEnd: 5 });
    // 09:00Z -> 01:00 PST (winter) -> inside 1-5
    expect(gateQuietHours(insideDevice, new Date('2026-01-15T09:00:00Z'))?.action).toBe('hold');
    // 20:00Z -> 12:00 PST -> outside 1-5
    expect(gateQuietHours(insideDevice, new Date('2026-01-15T20:00:00Z'))).toBeNull();
  });

  it('treats a zero-width window (quietStart === quietEnd) as quiet hours off', () => {
    expect(gateQuietHours(device({ quietStart: 5, quietEnd: 5 }), new Date())).toBeNull();
  });
});

describe('gateCoalescing', () => {
  it('passes with no recent deliveries', () => {
    expect(gateCoalescing([], new Date())).toBeNull();
  });

  it('coalesces when the most recent same-category delivery is under 30 min old', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const recent = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(gateCoalescing([recent], now)).toEqual({
      action: 'skip',
      reason: 'coalesced',
      withinMinutes: 30,
    });
  });

  it('passes once the most recent same-category delivery is 30+ min old', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const old = new Date(now.getTime() - 31 * 60_000).toISOString();
    expect(gateCoalescing([old], now)).toBeNull();
  });

  it('ADVERSARIAL: 10 events within 1 minute of each other coalesce to a single send', () => {
    // Simulates the router processing 10 events one at a time: after the
    // FIRST send, gateCoalescing must block every subsequent one within the
    // window — proving "10 events in 1 minute -> 1 push, not 10" end to end.
    const start = new Date('2026-01-15T12:00:00Z');
    const deliveries: string[] = [];
    let sentCount = 0;
    for (let i = 0; i < 10; i++) {
      const eventTime = new Date(start.getTime() + i * 6_000); // 6s apart, all within 1 min
      const decision = gateCoalescing(deliveries, eventTime);
      if (decision === null) {
        sentCount++;
        deliveries.push(eventTime.toISOString());
      }
    }
    expect(sentCount).toBe(1);
  });
});

describe('gateDailyCap', () => {
  it('passes under the cap', () => {
    expect(gateDailyCap(device({ dailyCap: 3 }), 2)).toBeNull();
  });

  it('blocks at the cap', () => {
    expect(gateDailyCap(device({ dailyCap: 3 }), 3)).toEqual({
      action: 'skip',
      reason: 'daily_cap',
      dailyCap: 3,
    });
  });

  it('blocks over the cap (never exceeds even if somehow already over)', () => {
    expect(gateDailyCap(device({ dailyCap: 3 }), 5)).toEqual({
      action: 'skip',
      reason: 'daily_cap',
      dailyCap: 3,
    });
  });

  it('ADVERSARIAL: cap-overflow path — the 4th of 3 allowed instant sends never sends', () => {
    const cap = device({ dailyCap: 3 });
    const results = [0, 1, 2, 3, 4].map((count) => gateDailyCap(cap, count));
    expect(results[0]).toBeNull();
    expect(results[1]).toBeNull();
    expect(results[2]).toBeNull();
    expect(results[3]).toEqual({ action: 'skip', reason: 'daily_cap', dailyCap: 3 });
    expect(results[4]).toEqual({ action: 'skip', reason: 'daily_cap', dailyCap: 3 });
  });
});

describe('evaluateGovernor', () => {
  const baseline = {
    now: new Date('2026-01-15T20:00:00Z'), // 12:00 PST, well outside quiet hours
    device: device(),
    event: { category: 'song_drop', tier: 1 },
    recentSameCategoryDeliveries: [],
    instantDeliveriesToday: 0,
  };

  it('sends when every gate clears', () => {
    expect(evaluateGovernor(baseline)).toEqual({ action: 'send' });
  });

  it('gate order: a snoozed AND over-cap device reports snoozed, not daily_cap', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = evaluateGovernor({
      ...baseline,
      device: device({ snoozeUntil: future, dailyCap: 1 }),
      instantDeliveriesToday: 5,
    });
    expect(result).toEqual({ action: 'skip', reason: 'snoozed', until: future });
  });

  it('gate order: quiet hours reported before coalescing/cap', () => {
    const result = evaluateGovernor({
      ...baseline,
      now: new Date('2026-01-15T07:00:00Z'), // inside quiet hours
      recentSameCategoryDeliveries: [new Date('2026-01-15T06:58:00Z').toISOString()],
      instantDeliveriesToday: 99,
    });
    expect(result.action).toBe('hold');
  });

  it('a T1 song_drop event still coalesces like any other category', () => {
    const now = new Date('2026-01-15T20:00:00Z');
    const result = evaluateGovernor({
      ...baseline,
      now,
      recentSameCategoryDeliveries: [new Date(now.getTime() - 60_000).toISOString()],
    });
    expect(result).toEqual({ action: 'skip', reason: 'coalesced', withinMinutes: 30 });
  });

  it('daily cap fires last, after master/quiet/coalescing all clear', () => {
    const result = evaluateGovernor({
      ...baseline,
      device: device({ dailyCap: 2 }),
      instantDeliveriesToday: 2,
    });
    expect(result).toEqual({ action: 'skip', reason: 'daily_cap', dailyCap: 2 });
  });
});

describe('startOfLocalDay', () => {
  it('returns midnight in the device tz, expressed correctly in UTC (winter, PST -08:00)', () => {
    const at = new Date('2026-01-15T20:00:00Z'); // noon PST
    const start = startOfLocalDay('America/Los_Angeles', at);
    // 2026-01-15T00:00:00 PST == 2026-01-15T08:00:00Z
    expect(start.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('handles a DST-transition day correctly (America/Los_Angeles springs forward 2026-03-08)', () => {
    // 2026-03-08 02:00 local doesn't exist (clocks jump to 03:00); midnight
    // that day is still a real, unambiguous instant (PST, -08:00, since the
    // jump happens at 2 AM local, after midnight).
    const at = new Date('2026-03-08T20:00:00Z');
    const start = startOfLocalDay('America/Los_Angeles', at);
    expect(start.toISOString()).toBe('2026-03-08T08:00:00.000Z');
  });

  it('handles the day AFTER a DST transition (now PDT, -07:00)', () => {
    const at = new Date('2026-03-09T20:00:00Z');
    const start = startOfLocalDay('America/Los_Angeles', at);
    expect(start.toISOString()).toBe('2026-03-09T07:00:00.000Z');
  });

  it('resolves correctly for a UTC+ timezone (Asia/Tokyo)', () => {
    const at = new Date('2026-06-15T20:00:00Z'); // 05:00 next day JST
    const start = startOfLocalDay('Asia/Tokyo', at);
    // 2026-06-16T00:00:00 JST == 2026-06-15T15:00:00Z
    expect(start.toISOString()).toBe('2026-06-15T15:00:00.000Z');
  });
});
