import { describe, expect, it } from 'vitest';

import { CLOWNBOT_DAILY_CAP, ClownbotUsage, clownbotUsage } from './clownbot-usage';

describe('the daily cap bounds spend', () => {
  it('allows up to the cap then refuses', () => {
    const usage = new ClownbotUsage(3, () => Date.parse('2026-08-11T10:00:00Z'));
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
    expect(usage.used()).toBe(3);
  });

  it('rolls over at the UTC day boundary', () => {
    let now = Date.parse('2026-08-11T23:59:00Z');
    const usage = new ClownbotUsage(1, () => now);
    expect(usage.reserve()).toBe(true);
    expect(usage.reserve()).toBe(false);
    now = Date.parse('2026-08-12T00:01:00Z');
    expect(usage.reserve()).toBe(true);
  });

  it('reports zero after midnight rather than a stale count', () => {
    let now = Date.parse('2026-08-11T10:00:00Z');
    const usage = new ClownbotUsage(5, () => now);
    usage.reserve();
    expect(usage.used()).toBe(1);
    now = Date.parse('2026-08-12T10:00:00Z');
    expect(usage.used()).toBe(0);
  });

  it('ships with a bounded default', () => {
    expect(CLOWNBOT_DAILY_CAP).toBeGreaterThan(0);
    expect(CLOWNBOT_DAILY_CAP).toBeLessThanOrEqual(1000);
    expect(clownbotUsage).toBeInstanceOf(ClownbotUsage);
  });
});
