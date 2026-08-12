import { afterEach, describe, expect, it, vi } from 'vitest';

// `resolveGh` returns null so every test exercises the REST path (the cloud
// shape). `httpsRequest` is the one transport both callers now share.
const resolveGh = vi.fn(async () => null);
const findToken = vi.fn(() => 'placeholder-tok');
const httpsRequest = vi.fn();

vi.mock('../../lib/gh.mjs', () => ({ resolveGh, findToken, httpsRequest }));

const { ghApi, ghApiSoft, GhApiError } = await import('./gh-api.mjs');

afterEach(() => { vi.clearAllMocks(); });

describe('ghApiSoft — a credential failure is never "this metric is unavailable" (#2008)', () => {
  // The brief's collectors soften failures on purpose: one 404'd optional
  // metric should degrade a line, not kill the brief. But a 401 is not a
  // per-endpoint problem — it means this runner cannot authenticate at all, so
  // EVERY collector is about to fail identically. Softening it renders a brief
  // full of plausible "unavailable" lines and exits 0, which is precisely the
  // silent failure #2008 exists to stop.
  it('rethrows a 401 so the caller dies loudly instead of degrading', async () => {
    httpsRequest.mockResolvedValue({ status: 401, headers: {}, text: '{"message":"Bad credentials"}' });
    await expect(ghApiSoft('/repos/o/r/actions/runs', null)).rejects.toThrow(/401/);
  });

  it('still softens a 403 — the repo-scoped /search ban and rate limits are real, expected degradations (#1869)', async () => {
    httpsRequest.mockResolvedValue({ status: 403, headers: {}, text: '{"message":"forbidden"}' });
    const res = await ghApiSoft('/search/issues?q=x', null);
    expect(res).toMatchObject({ ok: false, data: null });
    expect(res.error).toMatch(/403/);
  });

  it('still softens a 404', async () => {
    httpsRequest.mockResolvedValue({ status: 404, headers: {}, text: '{"message":"Not Found"}' });
    expect(await ghApiSoft('/repos/o/r/nope', 'fallback')).toMatchObject({ ok: false, data: 'fallback' });
  });

  it('returns parsed JSON on success', async () => {
    httpsRequest.mockResolvedValue({ status: 200, headers: {}, text: '{"total_count":3}' });
    expect(await ghApiSoft('/repos/o/r/actions/runs')).toEqual({ ok: true, data: { total_count: 3 } });
  });
});

describe('ghApi goes through the proxy-correct transport', () => {
  it('uses httpsRequest, not a bare fetch (a bare fetch bypasses HTTPS_PROXY)', async () => {
    httpsRequest.mockResolvedValue({ status: 200, headers: {}, text: '{}' });
    await ghApi('/repos/o/r');
    expect(httpsRequest).toHaveBeenCalledTimes(1);
    expect(httpsRequest.mock.calls[0][0]).toBe('https://api.github.com/repos/o/r');
  });

  it('carries the status on the error so callers can branch on 401', async () => {
    httpsRequest.mockResolvedValue({ status: 401, headers: {}, text: 'Bad credentials' });
    await expect(ghApi('/repos/o/r')).rejects.toMatchObject({ name: 'GhApiError', status: 401 });
    expect(GhApiError).toBeTypeOf('function');
  });
});
