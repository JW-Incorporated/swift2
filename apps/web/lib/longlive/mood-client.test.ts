import { afterEach, describe, expect, it, vi } from 'vitest';

import { classifyMood, sanitizeClassification } from './mood-client';
import { MoodUsage } from './mood-usage';

const alwaysNow = () => Date.parse('2026-07-25T10:00:00Z');
const freshUsage = () => new MoodUsage(100, alwaysNow);

/** A Messages API body carrying a record_mood tool_use block. */
function toolBody(input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: 'record_mood', input }] }),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
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
  it('returns null (fall back) when no API key is configured', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const usage = freshUsage();
    expect(await classifyMood(usage, 'heartbroken')).toBeNull();
  });

  it('returns null when the daily cap is reached — without calling the network', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const usage = new MoodUsage(0, alwaysNow); // cap already exhausted
    expect(await classifyMood(usage, 'heartbroken')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses a structured tool response into a MoodQuery', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    vi.stubGlobal('fetch', vi.fn(async () => toolBody({ moods: { heartbreak: 0.9 }, crisis: false })));
    const c = await classifyMood(freshUsage(), 'devastated');
    expect(c?.query.moods.heartbreak).toBe(0.9);
    expect(c?.crisis).toBe(false);
  });

  it('retries once then falls back to null on repeated failure', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'boom' }) as unknown as Response);
    vi.stubGlobal('fetch', fetchSpy);
    const c = await classifyMood(freshUsage(), 'devastated');
    expect(c).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2); // one attempt + one retry
  });

  it('recovers on the second attempt', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1;
        if (call === 1) throw new Error('transient');
        return toolBody({ moods: { joy: 0.7 } });
      }),
    );
    const c = await classifyMood(freshUsage(), 'great day');
    expect(c?.query.moods.joy).toBe(0.7);
  });
});
