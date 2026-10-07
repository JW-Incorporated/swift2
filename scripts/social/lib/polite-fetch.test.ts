import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fetchCandidates } from '../import-photo-library.mjs';
import { PHOTO_BOT_USER_AGENT, createPoliteFetcher } from './polite-fetch.mjs';

const WIKI = 'https://upload.wikimedia.org';

function fakeClock() {
  let t = 1_000_000;
  const sleeps: number[] = [];
  return {
    sleeps,
    nowImpl: () => t,
    sleepImpl: async (ms: number) => {
      sleeps.push(ms);
      t += ms;
    },
    advance: (ms: number) => {
      t += ms;
    },
  };
}

const okRes = () => ({ ok: true, status: 200, headers: new Headers(), arrayBuffer: async () => new TextEncoder().encode('x').buffer });
const res429 = (retryAfter?: string) => ({
  ok: false,
  status: 429,
  statusText: 'Too many requests',
  headers: new Headers(retryAfter ? { 'retry-after': retryAfter } : {}),
});

describe('createPoliteFetcher', () => {
  it('sends the descriptive User-Agent', async () => {
    const clock = fakeClock();
    const fetchImpl = vi.fn().mockResolvedValue(okRes());
    await createPoliteFetcher({ fetchImpl, ...clock }).fetch(`${WIKI}/a.jpg`);
    expect(fetchImpl.mock.calls[0][1].headers['User-Agent']).toBe(PHOTO_BOT_USER_AGENT);
    expect(PHOTO_BOT_USER_AGENT).toMatch(/longlivets\.com/);
  });

  it('keeps >= 1s between wikimedia requests and >= 250ms between other hosts', async () => {
    const clock = fakeClock();
    const starts: number[] = [];
    const fetchImpl = vi.fn(async () => {
      starts.push(clock.nowImpl());
      return okRes();
    });
    const polite = createPoliteFetcher({ fetchImpl, ...clock });
    await polite.fetch(`${WIKI}/a.jpg`);
    await polite.fetch(`${WIKI}/b.jpg`);
    await polite.fetch('https://i.redd.it/a.jpg');
    await polite.fetch('https://i.redd.it/b.jpg');
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(1000);
    expect(starts[3] - starts[2]).toBeGreaterThanOrEqual(250);
    expect(starts[3] - starts[2]).toBeLessThan(1000);
  });

  it('honors Retry-After on 429 (capped at 60s) then succeeds', async () => {
    const clock = fakeClock();
    const fetchImpl = vi.fn().mockResolvedValueOnce(res429('7')).mockResolvedValueOnce(res429('999')).mockResolvedValueOnce(okRes());
    const res = await createPoliteFetcher({ fetchImpl, ...clock }).fetch(`${WIKI}/a.jpg`);
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(clock.sleeps).toContain(7000);
    expect(clock.sleeps).toContain(60000);
  });

  it('after persistent 429s warns once and skips that host, other hosts continue', async () => {
    const clock = fakeClock();
    const warn = vi.fn();
    const fetchImpl = vi.fn(async (url: string) => (url.startsWith(WIKI) ? res429() : okRes()));
    const polite = createPoliteFetcher({ fetchImpl, warn, ...clock });
    const first = await polite.fetch(`${WIKI}/a.jpg`);
    expect(first.status).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(4); // initial + 3 retries
    await expect(polite.fetch(`${WIKI}/b.jpg`)).rejects.toThrow(/keeps rate-limiting/);
    expect(fetchImpl).toHaveBeenCalledTimes(4); // no new wikimedia request
    expect((await polite.fetch('https://i.redd.it/a.jpg')).ok).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('fetchCandidates budget', () => {
  it('stops starting downloads once the budget is spent and defers the rest', async () => {
    const clock = fakeClock();
    const photosDir = await mkdtemp(path.join(os.tmpdir(), 'photos-'));
    const cand = (n: number) => ({
      id: `reddit-${n}`,
      mediaPath: `/social/library/photos/reddit-${n}.jpg`,
      sourceUrl: `https://i.redd.it/${n}.jpg`,
    });
    const fetchImpl = vi.fn(async () => {
      clock.advance(40_000);
      return { ...okRes(), arrayBuffer: async () => new TextEncoder().encode(`b${fetchImpl.mock.calls.length}`).buffer };
    });
    const result = await fetchCandidates([cand(1), cand(2), cand(3), cand(4)], {
      write: false,
      photosDir,
      seenHashes: new Map(),
      fetchImpl: fetchImpl as never,
      budgetMs: 60_000,
      warn: () => {},
      ...clock,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.deferred).toEqual(['reddit-3', 'reddit-4']);
    expect(result.failed).toEqual([]);
  });
});
