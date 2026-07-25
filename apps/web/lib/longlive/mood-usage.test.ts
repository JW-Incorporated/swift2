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
