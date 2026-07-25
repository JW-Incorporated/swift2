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

  it('out-of-scope / no-mood text gets the refusal, not noise', async () => {
    const res = await post({ text: 'what is the capital of France' }, '10.1.0.5');
    const json = await res.json();
    expect(json.kind).toBe('refusal');
    expect(json.message).toContain('Taylor song');
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
