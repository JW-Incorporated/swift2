import { describe, expect, it, vi } from 'vitest';
import { mediaUrlsReachable } from './preflight.mjs';

function headers(contentType?: string) {
  return { get: (name: string) => (name.toLowerCase() === 'content-type' ? (contentType ?? null) : null) };
}

function fakeFetch(responsesByUrl: Record<string, { ok: boolean; status?: number; contentType?: string } | Error>) {
  return vi.fn(async (url: string) => {
    const entry = responsesByUrl[url];
    if (entry instanceof Error) throw entry;
    if (!entry) throw new Error(`no fake response configured for ${url}`);
    return { ok: entry.ok, status: entry.status ?? (entry.ok ? 200 : 404), headers: headers(entry.contentType) };
  });
}

describe('mediaUrlsReachable', () => {
  it('is ok when every URL responds 2xx with an image content-type', async () => {
    const fetchImpl = fakeFetch({
      'https://example.com/a.png': { ok: true, contentType: 'image/png' },
      'https://example.com/b.png': { ok: true, contentType: 'image/png' },
    });
    const result = await mediaUrlsReachable(['https://example.com/a.png', 'https://example.com/b.png'], fetchImpl);
    expect(result).toEqual({ ok: true, reason: null });
  });

  it('is ok when content-type is absent entirely (not penalized, only a wrong one is)', async () => {
    const fetchImpl = fakeFetch({ 'https://example.com/a.png': { ok: true } });
    expect(await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl)).toEqual({ ok: true, reason: null });
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
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, headers: headers() }));
    await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith('https://example.com/a.png', { method: 'HEAD' });
  });

  it('fails when the content-type is present but not an image', async () => {
    const fetchImpl = fakeFetch({ 'https://example.com/a.png': { ok: true, contentType: 'text/html' } });
    const result = await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('text/html');
  });

  it('falls back to a ranged GET when HEAD returns 405, and succeeds if that is fine', async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetchImpl = vi.fn(async (url: string, opts?: RequestInit) => {
      calls.push([url, opts]);
      if (opts?.method === 'HEAD') return { ok: false, status: 405, headers: headers() };
      return { ok: true, status: 206, headers: headers('image/png') };
    });
    const result = await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(result).toEqual({ ok: true, reason: null });
    expect(calls).toHaveLength(2);
    expect(calls[0][1]).toEqual({ method: 'HEAD' });
    expect(calls[1][1]).toEqual({ method: 'GET', headers: { Range: 'bytes=0-0' } });
  });

  it('falls back to a ranged GET when HEAD returns 501, and still fails if that also fails', async () => {
    const fetchImpl = vi.fn(async (url: string, opts?: RequestInit) => {
      if (opts?.method === 'HEAD') return { ok: false, status: 501, headers: headers() };
      return { ok: false, status: 404, headers: headers() };
    });
    const result = await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('404');
  });

  it('does not fall back to GET for an ordinary non-2xx HEAD status (e.g. 404)', async () => {
    const fetchImpl = vi.fn(async (_url: string, opts?: RequestInit) => {
      expect(opts?.method).toBe('HEAD'); // GET should never be attempted
      return { ok: false, status: 404, headers: headers() };
    });
    const result = await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl);
    expect(result.ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('times out a hung request rather than waiting forever', async () => {
    const fetchImpl = vi.fn(() => new Promise(() => {})); // never resolves
    const result = await mediaUrlsReachable(['https://example.com/a.png'], fetchImpl, { timeoutMs: 20 });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/timed out/);
  });
});
