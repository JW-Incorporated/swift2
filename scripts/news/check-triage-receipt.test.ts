import { describe, expect, it, vi } from 'vitest';
import { findReceipt, verifyReceipt } from './check-triage-receipt.mjs';

const context = { runId: '123', attempt: '2', startedAt: '2026-09-15T14:00:00Z' };
const comment = {
  user: { login: 'github-actions[bot]' },
  created_at: '2026-09-15T14:05:00Z',
  html_url: 'https://github.com/owner/repo/issues/502#issuecomment-9',
  body: 'news-triage-run: 123/2\nconsumed-snapshot: 2026-09-15T120000.md\nstories-reviewed: 67\ntriage-outcome: no-items\nNo candidate cleared the sourcing bar.',
};

describe('News Triage completion receipt', () => {
  it('accepts a current no-items or filed receipt, including Windows line endings', () => {
    expect(findReceipt([comment], context)).toEqual(comment);
    const filed = {
      ...comment,
      body: comment.body.replace('no-items', 'filed').replaceAll('\n', '\r\n'),
    };
    expect(findReceipt([filed], context)).toEqual(filed);
  });

  it('allows a genuinely empty consumed digest without forcing fabricated work', () => {
    const empty = { ...comment, body: comment.body.replace('reviewed: 67', 'reviewed: 0') };
    expect(findReceipt([empty], context)).toEqual(empty);
  });

  it.each([
    { body: comment.body.replace('123/2', '123/1') },
    { body: comment.body.replace('123/2', '124/2') },
    { body: comment.body.replace('no-items', 'blocked') },
    { body: comment.body.replace('consumed-snapshot:', 'suggested-snapshot:') },
    { body: comment.body.replace('stories-reviewed: 67', 'stories-reviewed: unknown') },
    { body: `Here is a proposed receipt: ${comment.body}` },
    { user: { login: 'unrelated-user' } },
    { created_at: '2026-09-15T13:00:00Z' },
    { created_at: 'invalid' },
  ])('rejects stale, incomplete, blocked or untrusted output: %j', (patch) => {
    expect(findReceipt([{ ...comment, ...patch }], context)).toBeUndefined();
  });

  it('checks later comment pages and the current attempt start', async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({ run_started_at: context.startedAt })
      .mockResolvedValueOnce(Array.from({ length: 100 }, () => ({ body: 'unrelated' })))
      .mockResolvedValueOnce([comment]);
    expect(await verifyReceipt({ ...context, repo: 'owner/repo', api })).toEqual(comment);
    expect(api.mock.calls[0][0]).toBe('/repos/owner/repo/actions/runs/123/attempts/2');
    expect(api.mock.calls[2][0]).toContain('page=2');
    expect(api.mock.calls[1][0]).toContain('since=2026-09-15T14%3A00%3A00Z');
  });

  it('fails closed for a silent run and does not loop after the final page', async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({ run_started_at: context.startedAt })
      .mockResolvedValueOnce([]);
    await expect(verifyReceipt({ ...context, repo: 'owner/repo', api })).rejects.toThrow(
      'no completed receipt',
    );
    expect(api).toHaveBeenCalledTimes(2);
  });

  it('propagates API failures instead of treating them as empty successful runs', async () => {
    const api = vi.fn().mockRejectedValue(new Error('HTTP 403'));
    await expect(verifyReceipt({ ...context, repo: 'owner/repo', api })).rejects.toThrow(
      'HTTP 403',
    );
  });

  it('rejects missing identity before querying GitHub', async () => {
    const api = vi.fn();
    await expect(verifyReceipt({ ...context, repo: 'owner/repo', runId: '', api })).rejects.toThrow(
      'numeric run ID',
    );
    expect(api).not.toHaveBeenCalled();
  });
});
