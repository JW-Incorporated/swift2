import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// Post JSON to the route with a chosen client IP so the per-IP rate limiter
// doesn't bleed between unrelated cases.
function post(body: unknown, ip = '10.0.0.1'): Promise<Response> {
  return POST(
    new Request('http://localhost/api/mood', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  // No key → the route uses the deterministic keyword fallback, so these tests
  // never touch the network and stay fully deterministic.
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/mood', () => {
  it('chip path: a hand-tuned vector returns real songs, no model needed', async () => {
    const res = await post({ moods: { heartbreak: 0.9, anger: 0.7 } }, '10.1.0.1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.source).toBe('chip');
    expect(json.picks.length).toBeGreaterThan(0);
    expect(typeof json.picks[0].slug).toBe('string');
  });

  it('crisis text returns resources and NO songs', async () => {
    const res = await post({ text: 'i want to die' }, '10.1.0.2');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.picks).toBeUndefined();
    expect(json.message.join(' ')).toContain('988');
  });

  it('abuse disclosure returns the DV hotline, not just the suicide line (#1979)', async () => {
    const res = await post({ text: 'my boyfriend hits me' }, '10.1.0.20');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.picks).toBeUndefined();
    const joined = json.message.join(' ');
    expect(joined).toContain('1-800-799-7233');
    expect(joined).toContain('START to 88788');
  });

  it('"he hurts me" no longer returns a breakup playlist (#1979)', async () => {
    const res = await post({ text: 'he hurts me' }, '10.1.0.21');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.picks).toBeUndefined();
    expect(json.message.join(' ')).toContain('1-800-799-7233');
  });

  it('self-directed ideation keeps the 988 message, no DV line (#1980)', async () => {
    const res = await post({ text: 'there is no reason to live' }, '10.1.0.22');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    const joined = json.message.join(' ');
    expect(joined).toContain('988');
    expect(joined).not.toContain('1-800-799-7233');
  });

  it('hyperbole returns songs instead of dead-ending in unclear (#1981)', async () => {
    for (const [i, text] of ['this is killing me', "I'm dying to see the Eras tour"].entries()) {
      const res = await post({ text }, `10.1.0.3${i}`);
      const json = await res.json();
      expect(json.kind).toBe('matches');
      expect(json.picks.length).toBeGreaterThan(0);
    }
  });

  it('free text with no key falls back to keyword matcher and still returns songs', async () => {
    const res = await post({ text: 'heartbroken and angry, he betrayed me' }, '10.1.0.3');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.source).toBe('keyword');
    expect(json.degraded).toBe(true);
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('adds the heavy intro for genuinely sad input', async () => {
    const res = await post({ text: 'so heartbroken and lonely, just crying' }, '10.1.0.4');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.intro).toBeTruthy();
    expect(json.intro).toContain('heavy');
  });

  // "We couldn't read a feeling here" and "this is out of scope" are DIFFERENT
  // facts, and the route used to answer both with Block 6. On the degraded
  // (no-API-key) path that meant any wording the keyword lexicon missed was
  // told it was outside what the bot can help with — including "I'm sad".
  // Block 6 is now reachable only via the classifier's out_of_scope flag.
  it('unrecognised text gets the say-more nudge, not a refusal', async () => {
    const res = await post({ text: 'what is the capital of France' }, '10.1.0.5');
    const json = await res.json();
    expect(json.kind).toBe('unclear');
    expect(json.message).not.toContain('outside what I can help with');
  });

  it('ordinary negative feeling reaches songs on the degraded path', async () => {
    // The founder's sentence, end to end, with no ANTHROPIC_API_KEY set.
    const res = await post(
      { text: "I'm grumpy and everything is pissing me off" },
      '10.1.0.11',
    );
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.source).toBe('keyword');
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('plain sadness reaches songs rather than a refusal', async () => {
    const res = await post({ text: 'im sad' }, '10.1.0.12');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('rejects empty text', async () => {
    const res = await post({ text: '   ' }, '10.1.0.6');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid JSON body', async () => {
    const res = await POST(
      new Request('http://localhost/api/mood', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.1.0.7' },
        body: 'not json',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rate-limits a bursting IP', async () => {
    const ip = '10.9.9.9';
    let sawLimit = false;
    for (let i = 0; i < 20; i++) {
      const res = await post({ text: 'happy and excited' }, ip);
      if (res.status === 429) sawLimit = true;
    }
    expect(sawLimit).toBe(true);
  });
});
