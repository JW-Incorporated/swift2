import { describe, expect, it } from 'vitest';

import { CLOWN_DAILY_CAP, ClownUsage, clownUsage } from './clown-usage';

describe('the daily cap bounds spend', () => {
  it('allows up to the cap then refuses (over-cap case)', () => {
    const usage = new ClownUsage(3, () => Date.parse('2026-08-13T10:00:00Z'));
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
    expect(usage.used()).toBe(3);
  });

  it('rolls over at the UTC day boundary', () => {
    let now = Date.parse('2026-08-13T23:59:00Z');
    const usage = new ClownUsage(1, () => now);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
    now = Date.parse('2026-08-14T00:01:00Z');
    expect(usage.reserve()).toBe(true);
  });

  it('reports zero after midnight rather than a stale count', () => {
    let now = Date.parse('2026-08-13T10:00:00Z');
    const usage = new ClownUsage(5, () => now);
    usage.reserve();
    expect(usage.used()).toBe(1);
    now = Date.parse('2026-08-14T10:00:00Z');
    expect(usage.used()).toBe(0);
  });

  it('a cap of zero refuses every call (kill switch via cap)', () => {
    const usage = new ClownUsage(0, () => Date.parse('2026-08-13T10:00:00Z'));
    expect(usage.reserve()).toBe(false);
  });

  it('ships with the spec-proposed, one-line-changeable default', () => {
    expect(CLOWN_DAILY_CAP).toBe(200);
    expect(CLOWN_DAILY_CAP).toBeGreaterThan(0);
    expect(clownUsage).toBeInstanceOf(ClownUsage);
  });
});
