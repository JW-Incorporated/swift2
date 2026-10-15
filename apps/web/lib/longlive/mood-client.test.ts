import { afterEach, describe, expect, it, vi } from 'vitest';

import { classifyMood, sanitizeClassification } from './mood-client';
import { MoodUsage } from './mood-usage';

const alwaysNow = () => Date.parse('2026-07-25T10:00:00Z');
const freshUsage = () => new MoodUsage(100, alwaysNow);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sanitizeClassification', () => {
  it('keeps only valid axes and clamps to 0..1', () => {
    const c = sanitizeClassification({
      moods: { heartbreak: 0.8, anger: 2, joy: -1, bogus: 0.5 },
      energy: 0.3,
      valence: 5,
      crisis: true,
      out_of_scope: false,
    });
    expect(c.query.moods.heartbreak).toBe(0.8);
    expect(c.query.moods.anger).toBe(1);
    expect(c.query.moods.joy).toBe(0);
    expect((c.query.moods as Record<string, number>).bogus).toBeUndefined();
    expect(c.query.energy).toBe(0.3);
    expect(c.query.valence).toBe(1);
    expect(c.crisis).toBe(true);
    expect(c.outOfScope).toBe(false);
  });

  it('tolerates a missing/garbage payload', () => {
    const c = sanitizeClassification(null);
    expect(c.query.moods).toEqual({});
    expect(c.crisis).toBe(false);
  });
});

describe('classifyMood', () => {
  it('falls back when the subscription wrapper is unavailable', async () => {
    const call = vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'no token' });
    expect(await classifyMood(freshUsage(), 'heartbroken', call)).toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('keeps the kill switch inert without reserving usage', async () => {
    vi.stubEnv('MOOD_MODEL_DISABLED', '1');
    const call = vi.fn();
    const usage = freshUsage();
    expect(await classifyMood(usage, 'heartbroken', call)).toBeNull();
    expect(call).not.toHaveBeenCalled();
    expect(usage.used()).toBe(0);
  });

  it('does not call the wrapper when the daily cap is reached', async () => {
    const call = vi.fn();
    const usage = new MoodUsage(0, alwaysNow);
    expect(await classifyMood(usage, 'heartbroken', call)).toBeNull();
    expect(call).not.toHaveBeenCalled();
  });

  it('parses a structured wrapper response into a MoodQuery', async () => {
    const call = vi.fn().mockResolvedValue({
      status: 'ok',
      data: { moods: { heartbreak: 0.9 }, crisis: false },
    });
    const c = await classifyMood(freshUsage(), 'devastated', call);
    expect(c?.query.moods.heartbreak).toBe(0.9);
    expect(c?.crisis).toBe(false);
    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      caller: 'mood-client',
      priority: 'P2',
      model: 'claude-haiku-5-5',
    }));
  });

  it('retries once then falls back to null on repeated failure', async () => {
    const call = vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'boom' });
    expect(await classifyMood(freshUsage(), 'devastated', call)).toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('recovers on the second attempt', async () => {
    const call = vi.fn()
      .mockResolvedValueOnce({ status: 'unavailable', reason: 'transient' })
      .mockResolvedValueOnce({ status: 'ok', data: { moods: { joy: 0.7 } } });
    const c = await classifyMood(freshUsage(), 'great day', call);
    expect(c?.query.moods.joy).toBe(0.7);
  });
});
