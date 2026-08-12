import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { applyPostFilters, httpsRequest, maxPagesFor, planRest, proxyForHost, shapeHit } from './gh.mjs';

// These cover the REST fallback's argv→request translation, which is the part
// that silently does the wrong thing if it's wrong. The failure mode we're
// guarding against is a run that reports success while filing nothing —
// exactly what Karen's 2026-07-26 nightly did (623 findings, zero tickets) —
// and, since #1869, a fallback that cannot reach GitHub at all from a cloud
// runner: repo-bound sessions are forbidden /search/*, and Node's fetch
// silently bypasses the proxy that holds the session's credentials.

const REPO = 'JW-Incorporated/swift2';

const qs = (path: string) => new URLSearchParams(path.split('?')[1] ?? '');

type Numbered = { number: number };

describe('planRest — label create', () => {
  it('maps to POST /labels and tolerates the already-exists 422 that --force implies', () => {
    const p = planRest(['label', 'create', 'cie:P1', '--color', 'd93f0b', '--description', 'major', '--force'], REPO);
    expect(p.method).toBe('POST');
    expect(p.path).toBe(`/repos/${REPO}/labels`);
    expect(p.body).toEqual({ name: 'cie:P1', color: 'd93f0b', description: 'major' });
    expect(p.tolerate).toContain(422);
  });
});

describe('planRest — issue list is repo-scoped (#1869)', () => {
  it('never touches /search for a plain label+state list', () => {
    const p = planRest(['issue', 'list', '--repo', REPO, '--label', 'founder-decision', '--state', 'open', '--limit', '100', '--json', 'number,title,body'], REPO);
    expect(p.path).not.toContain('/search');
    expect(p.path.startsWith(`/repos/${REPO}/issues?`)).toBe(true);
    expect(qs(p.path).get('state')).toBe('open');
    expect(qs(p.path).get('labels')).toBe('founder-decision');
    expect(qs(p.path).get('per_page')).toBe('100');
    expect(p.fields).toEqual(['number', 'title', 'body']);
    expect(p.limit).toBe(100);
  });

  it('ANDs repeated --label flags into one comma-joined labels param, as gh does', () => {
    const p = planRest(['issue', 'list', '--label', 'cie', '--label', 'cie:P1', '--json', 'number'], REPO);
    expect(qs(p.path).get('labels')).toBe('cie,cie:P1');
  });

  it('drops pull requests, because /repos/.../issues returns them and `gh issue list` does not', () => {
    expect(planRest(['issue', 'list', '--json', 'number'], REPO).postFilter).toContain('dropPullRequests');
    const hits = [{ number: 1 }, { number: 2, pull_request: { url: 'x' } }, { number: 3 }];
    const kept: Numbered[] = applyPostFilters(hits, { postFilter: ['dropPullRequests'], limit: 10 });
    expect(kept.map((h) => h.number)).toEqual([1, 3]);
  });

  it('passes --state all straight through, so closed duplicates stay visible to dedupe', () => {
    expect(qs(planRest(['issue', 'list', '--state', 'all', '--json', 'number'], REPO).path).get('state')).toBe('all');
  });
});

describe('planRest — pr list is repo-scoped (#1869)', () => {
  it('lists open PRs from /pulls, not /search', () => {
    const p = planRest(['pr', 'list', '--repo', REPO, '--state', 'open', '--limit', '50', '--json', 'number,title,isDraft'], REPO);
    expect(p.path).not.toContain('/search');
    expect(p.path.startsWith(`/repos/${REPO}/pulls?`)).toBe(true);
    expect(qs(p.path).get('state')).toBe('open');
    expect(p.postFilter).toEqual([]);
  });

  it('expresses the search-only `merged` state as closed + a client-side merged filter', () => {
    const p = planRest(['pr', 'list', '--repo', REPO, '--state', 'merged', '--limit', '30', '--json', 'number,title,mergedAt'], REPO);
    expect(p.path).not.toContain('/search');
    expect(qs(p.path).get('state')).toBe('closed');
    // updated-desc guarantees anything merged recently is on page 1 — merging
    // a PR updates it. Sorting by created would bury a merged old branch.
    expect(qs(p.path).get('sort')).toBe('updated');
    expect(qs(p.path).get('direction')).toBe('desc');
    expect(p.postFilter).toContain('mergedOnly');
    expect(p.sortBy).toBe('mergedAt');
  });

  it('keeps only merged PRs, newest merge first, capped at --limit', () => {
    const hits = [
      { number: 1, merged_at: '2026-08-09T00:00:00Z' },
      { number: 2, merged_at: null }, // closed without merging
      { number: 3, merged_at: '2026-08-11T00:00:00Z' },
      { number: 4, merged_at: '2026-08-10T00:00:00Z' },
    ];
    const plan = { postFilter: ['mergedOnly'], sortBy: 'mergedAt', limit: 2 };
    const kept: Numbered[] = applyPostFilters(hits, plan);
    expect(kept.map((h) => h.number)).toEqual([3, 4]);
  });
});

describe('shapeHit', () => {
  it('reads a merge time from either the pulls or the issues shape', () => {
    expect(shapeHit({ merged_at: '2026-08-11T00:00:00Z' }, ['mergedAt']).mergedAt).toBe('2026-08-11T00:00:00Z');
    expect(shapeHit({ pull_request: { merged_at: '2026-08-10T00:00:00Z' } }, ['mergedAt']).mergedAt)
      .toBe('2026-08-10T00:00:00Z');
  });

  it('reports an unmerged PR as mergedAt null, never as its closed_at', () => {
    // The old search-shaped fallback fell back to closed_at here, which made
    // every abandoned PR look like it shipped in the last 24h.
    expect(shapeHit({ closed_at: '2026-08-11T00:00:00Z', merged_at: null }, ['mergedAt']).mergedAt).toBeNull();
  });

  it('normalises labels and author the way `gh --json` does', () => {
    const s = shapeHit({ labels: [{ name: 'intake' }, 'raw'], user: { login: 'kevin' } }, ['labels', 'author']);
    expect(s.labels).toEqual([{ name: 'intake' }, { name: 'raw' }]);
    expect(s.author).toEqual({ login: 'kevin' });
  });
});

describe('planRest — full-text search has no repo-scoped equivalent', () => {
  it('still routes --search to /search/issues, carrying the fingerprint through', () => {
    const p = planRest(['issue', 'list', '--state', 'all', '--search', 'cie-fp:abc123 in:body', '--json', 'number', '--limit', '1'], REPO);
    expect(p.kind).toBe('search');
    const q = decodeURIComponent(p.path.split('q=')[1].split('&')[0]);
    expect(q).toContain('cie-fp:abc123 in:body');
    expect(q).toContain(`repo:${REPO}`);
    expect(q).toContain('type:issue');
    // --state all must NOT pin a state, or closed duplicates get re-filed.
    expect(q).not.toContain('state:');
  });

  it('caps per_page at the REST maximum of 100', () => {
    const p = planRest(['issue', 'list', '--search', 'x', '--limit', '5000', '--json', 'number'], REPO);
    expect(p.path).toContain('per_page=100');
  });
});

describe('planRest — issue create', () => {
  it('reads --body-file from disk, since bodies never go through argv', () => {
    const p = planRest(['issue', 'create', '--title', 'T', '--body-file', 'package.json', '--label', 'cie', '--label', 'cie:P1'], REPO);
    expect(p.method).toBe('POST');
    expect(p.path).toBe(`/repos/${REPO}/issues`);
    expect(p.body.title).toBe('T');
    expect(p.body.labels).toEqual(['cie', 'cie:P1']);
    expect(p.body.body.length).toBeGreaterThan(0);
  });
});

describe('planRest — unsupported', () => {
  it('returns null rather than guessing, so gh() can throw a named error', () => {
    expect(planRest(['release', 'create', 'v1'], REPO)).toBeNull();
  });
});

describe('maxPagesFor — list pagination honours the caller\'s limit, bounded', () => {
  it('keeps the 3-page floor for small limits whose post-filters eat hits', () => {
    expect(maxPagesFor(30)).toBe(3);
    expect(maxPagesFor(undefined)).toBe(3);
  });
  it('pages far enough to satisfy a large limit — Karen\'s fingerprint prefetch asks for 1000, and a sub-limit result is what proves the cie history COMPLETE (issues.mjs skips the forbidden /search on that proof)', () => {
    expect(maxPagesFor(1000)).toBe(10);
    expect(maxPagesFor(450)).toBe(5);
  });
  it('stays bounded no matter what the caller asks for', () => {
    expect(maxPagesFor(1e9)).toBe(10);
  });
});

describe('proxyForHost', () => {
  it('uses HTTPS_PROXY when set', () => {
    expect(proxyForHost('api.github.com', { HTTPS_PROXY: 'http://p:8080' })?.hostname).toBe('p');
  });

  it('falls back to HTTP_PROXY and the lowercase spellings', () => {
    expect(proxyForHost('api.github.com', { http_proxy: 'http://p:8080' })?.hostname).toBe('p');
  });

  it('honours NO_PROXY exactly and by suffix, so direct hosts stay direct', () => {
    expect(proxyForHost('api.github.com', { HTTPS_PROXY: 'http://p:8080', NO_PROXY: 'api.github.com' })).toBeNull();
    expect(proxyForHost('api.github.com', { HTTPS_PROXY: 'http://p:8080', NO_PROXY: '.github.com' })).toBeNull();
    expect(proxyForHost('api.github.com', { HTTPS_PROXY: 'http://p:8080', NO_PROXY: 'example.com' })?.hostname).toBe('p');
    expect(proxyForHost('api.github.com', { HTTPS_PROXY: 'http://p:8080', NO_PROXY: '*' })).toBeNull();
  });

  it('returns null (direct) rather than throwing on a malformed proxy URL', () => {
    expect(proxyForHost('api.github.com', { HTTPS_PROXY: 'not a url' })).toBeNull();
  });

  it('is direct when nothing is configured', () => {
    expect(proxyForHost('api.github.com', {})).toBeNull();
  });
});

describe('httpsRequest transits the proxy (#1869 root cause 1)', () => {
  // Node's built-in fetch ignores HTTPS_PROXY unless the PROCESS was booted
  // with --use-env-proxy / NODE_USE_ENV_PROXY=1, which a library cannot do for
  // itself. That silent bypass is why the cloud runner's proxy-scoped GH_TOKEN
  // came back `401 Bad credentials`. This asserts we now issue a real CONNECT.
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('issues a CONNECT to the target host through HTTPS_PROXY', async () => {
    const seen: string[] = [];
    const proxy = http.createServer();
    proxy.on('connect', (req, socket) => { seen.push(req.url!); socket.destroy(); });
    await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', () => r()));
    const { port } = proxy.address() as AddressInfo;

    process.env.HTTPS_PROXY = `http://127.0.0.1:${port}`;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;

    // The proxy hangs up mid-tunnel, so the request must fail — what matters is
    // that it went to the proxy at all rather than straight out to the network.
    await expect(httpsRequest('https://api.github.com/repos/x/y/issues')).rejects.toThrow();
    expect(seen).toEqual(['api.github.com:443']);
    await new Promise<void>((r) => proxy.close(() => r()));
  });
});
