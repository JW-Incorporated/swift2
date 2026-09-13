import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { listIssuesByLabels } from './issues-rest.mjs';

describe('listIssuesByLabels', () => {
  it('reads the REST issues list (not search), ANDs the labels, drops PRs, and maps to gh --json shape', async () => {
    const api = vi.fn(async () => [
      {
        number: 7, title: 't', html_url: 'https://github.com/o/r/issues/7', url: 'https://api.github.com/repos/o/r/issues/7',
        body: 'b', user: { login: 'github-actions[bot]' }, labels: [{ name: 'tree-filed', color: 'x' }],
        state: 'open', created_at: '2026-09-13T16:44:15Z', closed_at: null,
      },
      { number: 8, title: 'a PR', pull_request: {}, state: 'open', labels: [] },
    ]);
    const rows = await listIssuesByLabels(api, { repo: 'o/r', labels: ['tree-filed', 'desk:ops'], state: 'all' });
    expect(api).toHaveBeenCalledTimes(1);
    const path = (api.mock.calls[0] as unknown as string[])[0];
    expect(path).toMatch(/^\/repos\/o\/r\/issues\?labels=tree-filed%2Cdesk%3Aops&state=all&/);
    expect(rows).toEqual([{
      number: 7, title: 't', url: 'https://github.com/o/r/issues/7', body: 'b', author: { login: 'github-actions[bot]' },
      labels: [{ name: 'tree-filed' }], state: 'OPEN', createdAt: '2026-09-13T16:44:15Z', closedAt: null,
    }]);
  });

  it('pages until a short page, capped at the limit', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ number: i + 1, state: 'open', labels: [] }));
    const api = vi.fn(async () => [] as unknown[]).mockResolvedValueOnce(full).mockResolvedValueOnce(full.slice(0, 30));
    const rows = await listIssuesByLabels(api, { repo: 'o/r', labels: ['a'], state: 'open', limit: 200 });
    expect(api).toHaveBeenCalledTimes(2);
    expect((api.mock.calls[1] as unknown as string[])[0]).toContain('page=2');
    expect(rows).toHaveLength(130);
  });

  it('stops at the limit without fetching another page, and treats a null body as empty', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ number: i + 1, state: 'open', labels: [] }));
    const api = vi.fn(async () => full as unknown[] | null);
    expect(await listIssuesByLabels(api, { repo: 'o/r', labels: ['a'], limit: 100 })).toHaveLength(100);
    expect(api).toHaveBeenCalledTimes(1);
    api.mockResolvedValueOnce(null);
    expect(await listIssuesByLabels(api, { repo: 'o/r', labels: ['a'] })).toEqual([]);
  });
});
