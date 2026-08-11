import { describe, expect, it, vi } from 'vitest';
import { mediaUrlsReachable } from './preflight.mjs';

function fakeFetch(responsesByUrl: Record<string, { ok: boolean; status?: number } | Error>) {
  return vi.fn(async (url: string) => {
    const entry = responsesByUrl[url];
    if (entry instanceof Error) throw entry;
    if (!entry) throw new Error(`no fake response configured for ${url}`);
    return { ok: entry.ok, status: entry.status ?? (entry.ok ? 200 : 404) };
  });
}

describe('mediaUrlsReachable', () => {
  it('is ok when every URL responds 2xx', async () => {
    const fetchImpl = fakeFetch({
      'https://example.com/a.png': { ok: true },
      'https://example.com/b.png': { ok: true },
    });
    const result = await mediaUrlsReachable(['https://example.com/a.png', 'https://example.com/b.png'], fetchImpl);
    expect(result).toEqual({ ok: true, reason: null });
  });

  it('is ok (vacuously) for an empty URL list', async () => {
    const fetchImpl = fakeFetch({});
    expect(await mediaUrlsReachable([], fetchImpl)).toEqual({ ok: true, reason: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails on the first non-2xx response, without checking the rest', async () => {
    const fetchImpl = fakeFetch({
      'https://example.com/a.png': { ok: false, status: 404 },
      'https://example.com/b.png': { ok: true },
    });
    const result = await mediaUrlsReachable(['https://example.com/a.png', 'https://example.com/b.png'], fetchImpl);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('404');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails when fetch itself throws (network error)', async () => {
    const fetchImpl = fakeFetch({ 'https://example.com/a.png': new Error('ECONNRESET') });
    const result = await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('ECONNRESET');
  });

  it('issues a HEAD request', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith('https://example.com/a.png', { method: 'HEAD' });
  });
});
