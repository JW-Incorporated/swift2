import { describe, expect, it, vi } from 'vitest';
import { detectCountdownTarget, fetchSiteDiff, hashHtml, siteHasCountdown, type SiteDiffSnapshotStore } from './site-diff';
import type { NewsSourceRow } from './types';

function textResponse(body: string, ok = true, status = 200): Response {
  return { ok, status, text: async () => body } as unknown as Response;
}

function fakeStore(initial?: string): SiteDiffSnapshotStore & { hash: string | undefined } {
  const state = { hash: initial };
  return {
    get hash() {
      return state.hash;
    },
    async getHash() {
      return state.hash;
    },
    async setHash(_sourceId: string, hash: string) {
      state.hash = hash;
    },
  };
}

const SOURCE: NewsSourceRow = {
  id: 'src-1',
  name: 'taylorswift.com',
  sourceType: 'site_diff',
  config: { url: 'https://www.taylorswift.com' },
};

describe('detectCountdownTarget', () => {
  it('reads a data-countdown-target epoch-ms attribute', () => {
    const future = Date.now() + 60_000;
    const html = `<div data-countdown-target="${future}"></div>`;
    expect(detectCountdownTarget(html)).toBe(new Date(future).toISOString());
  });

  it('reads a data-countdown epoch-seconds attribute', () => {
    const future = Date.now() + 60_000;
    const seconds = Math.floor(future / 1000);
    const html = `<div data-countdown="${seconds}"></div>`;
    expect(detectCountdownTarget(html)).toBe(new Date(seconds * 1000).toISOString());
  });

  it('reads a <time> element inside a countdown-labelled container', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const html = `<section class="reveal-countdown-wrap"><time datetime="${future}">soon</time></section>`;
    expect(detectCountdownTarget(html)).toBe(future);
  });

  it('ignores a countdown target already in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const html = `<div data-countdown-target="${past}"></div>`;
    expect(detectCountdownTarget(html)).toBeUndefined();
  });

  it('returns undefined for plain markup with no countdown marker', () => {
    expect(detectCountdownTarget('<html><body>New merch!</body></html>')).toBeUndefined();
  });

  it('picks the SOONEST future target when more than one marker is present', () => {
    const soon = Date.now() + 30_000;
    const later = Date.now() + 3_600_000;
    const html = `<div data-countdown-target="${soon}"></div><div data-reveal-at="${later}"></div>`;
    expect(detectCountdownTarget(html)).toBe(new Date(soon).toISOString());
  });
});

describe('siteHasCountdown', () => {
  it('mirrors detectCountdownTarget as a boolean', () => {
    const future = Date.now() + 60_000;
    expect(siteHasCountdown(`<div data-countdown-target="${future}"></div>`)).toBe(true);
    expect(siteHasCountdown('<html></html>')).toBe(false);
  });
});

describe('fetchSiteDiff', () => {
  it('emits nothing on the very first poll when the page has no countdown', async () => {
    const store = fakeStore(undefined);
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('<html>hello</html>'));
    const items = await fetchSiteDiff(SOURCE, store, fetchImpl);
    expect(items).toEqual([]);
    expect(store.hash).toBe(hashHtml('<html>hello</html>'));
  });

  it('emits a countdown item on the FIRST poll if a live countdown is already present', async () => {
    const store = fakeStore(undefined);
    const future = Date.now() + 60_000;
    const html = `<div data-countdown-target="${future}"></div>`;
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(html));
    const items = await fetchSiteDiff(SOURCE, store, fetchImpl);
    expect(items).toHaveLength(1);
    expect(items[0]!.countdownTargetAt).toBe(new Date(future).toISOString());
  });

  it('emits nothing when the page is unchanged since the last poll', async () => {
    const html = '<html>same</html>';
    const store = fakeStore(hashHtml(html));
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(html));
    const items = await fetchSiteDiff(SOURCE, store, fetchImpl);
    expect(items).toEqual([]);
  });

  it('emits a plain change item when the page changed but has no countdown', async () => {
    const store = fakeStore(hashHtml('<html>old</html>'));
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('<html>new merch dropped</html>'));
    const items = await fetchSiteDiff(SOURCE, store, fetchImpl);
    expect(items).toHaveLength(1);
    expect(items[0]!.countdownTargetAt).toBeUndefined();
    expect(items[0]!.title).toContain('page changed');
  });

  it('emits a countdown item when a fresh countdown appears on a changed page', async () => {
    const store = fakeStore(hashHtml('<html>old</html>'));
    const future = Date.now() + 120_000;
    const html = `<div data-countdown-target="${future}"></div>`;
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse(html));
    const items = await fetchSiteDiff(SOURCE, store, fetchImpl);
    expect(items).toHaveLength(1);
    expect(items[0]!.countdownTargetAt).toBe(new Date(future).toISOString());
  });

  it('always persists the new hash, even when no item is emitted', async () => {
    const store = fakeStore(hashHtml('<html>old</html>'));
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('<html>same as old but hashed differently? no.</html>'));
    await fetchSiteDiff(SOURCE, store, fetchImpl);
    expect(store.hash).toBe(hashHtml('<html>same as old but hashed differently? no.</html>'));
  });

  it('throws when config.url is missing', async () => {
    const badSource: NewsSourceRow = { ...SOURCE, config: {} };
    const store = fakeStore(undefined);
    await expect(fetchSiteDiff(badSource, store, vi.fn())).rejects.toThrow(/config\.url/);
  });

  it('throws on a non-2xx response', async () => {
    const store = fakeStore(undefined);
    const fetchImpl = vi.fn().mockResolvedValueOnce(textResponse('', false, 500));
    await expect(fetchSiteDiff(SOURCE, store, fetchImpl)).rejects.toThrow(/500/);
  });
});
