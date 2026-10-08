import http from 'node:http';
import net from 'node:net';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyPostFilters, fetchIsProxyAware, ghApi, httpsRequest, maxPagesFor, planRest,
  proxyForHost, resetGhResolution, resetPageCapWarnings, rest, shapeHit,
} from './gh.mjs';
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

  it('sorts --state all by `updated`, not `created` (#3671/#3652)', () => {
    // Marjorie's `allPRs` liveness feed asks for `--state all`. Sorting by
    // `created` ranks a PR by when it was OPENED, so a PR opened weeks ago
    // and merged an hour ago sorts behind every PR opened more recently —
    // pushing it past the page/limit window and reading its runner as
    // "never seen" on the very day it shipped. `updated` keeps recently
    // merged/active PRs on page 1 regardless of how old the branch is.
    const p = planRest(['pr', 'list', '--repo', REPO, '--state', 'all', '--limit', '100', '--json', 'number,title,createdAt,mergedAt,headRefName'], REPO);
    expect(p.path).not.toContain('/search');
    expect(qs(p.path).get('state')).toBe('all');
    expect(qs(p.path).get('sort')).toBe('updated');
    expect(qs(p.path).get('direction')).toBe('desc');
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

describe('the CONNECT tunnel is actually USED, not merely opened (#2008)', () => {
  // THIS IS THE TEST THAT WAS MISSING, and its absence is the whole ticket.
  // The #1887 transport passed the test above — it *did* issue a CONNECT — and
  // was still completely broken, because it then threw the tunnel away and
  // connected DIRECTLY to api.github.com. `https.request({ agent: false,
  // createConnection })` does not use the request-level createConnection: with
  // `agent: false` Node builds a fresh https.Agent whose own (direct)
  // createConnection wins. Direct egress skips the proxy that swaps the
  // proxy-scoped placeholder GH_TOKEN for the real credential, so every call
  // came back `401 Bad credentials` and Karen filed nothing for weeks.
  //
  // "Issued a CONNECT" is therefore worthless as an assertion. What must be
  // true is that the request BYTES traverse the tunnel, so we assert on the
  // bytes the proxy sees inside it.
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('writes the request into the tunnel instead of connecting direct', async () => {
    // Only meaningful on the tunnel path; if this process was booted
    // proxy-aware, `httpsRequest` correctly delegates to fetch instead.
    if (fetchIsProxyAware()) return;

    // A stand-in "origin" that accepts a TCP connection and says nothing. If
    // the client bypasses the tunnel it will talk to this directly and the
    // proxy will see zero bytes — which is the regression.
    const originSockets: net.Socket[] = [];
    const origin = net.createServer((s) => { originSockets.push(s); /* accept, stay silent */ });
    await new Promise<void>((r) => origin.listen(0, '127.0.0.1', () => r()));
    const originPort = (origin.address() as AddressInfo).port;

    let bytesThroughTunnel = 0;
    const tunnels: net.Socket[] = [];
    const firstBytes = Promise.withResolvers<void>();
    const proxy = http.createServer();
    proxy.on('connect', (_req, clientSocket) => {
      tunnels.push(clientSocket);
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      clientSocket.on('data', (d: Buffer) => {
        bytesThroughTunnel += d.length;
        firstBytes.resolve();
      });
      clientSocket.on('error', () => { /* torn down below */ });
    });
    await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', () => r()));
    const proxyPort = (proxy.address() as AddressInfo).port;

    process.env.HTTPS_PROXY = `http://127.0.0.1:${proxyPort}`;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;

    // Never resolves (the tunnel is a dead end); we only care that the client
    // committed its TLS ClientHello to the tunnel rather than dialling out.
    const pending = httpsRequest(`https://127.0.0.1:${originPort}/repos/x/y`);
    pending.catch(() => { /* expected: the dead-end tunnel never answers */ });

    await Promise.race([
      firstBytes.promise,
      new Promise<void>((r) => setTimeout(r, 5000)),
    ]);

    expect(bytesThroughTunnel).toBeGreaterThan(0);

    // The request is still in flight by design (the tunnel is a dead end), so
    // tear the sockets down explicitly — `close()` alone waits for them.
    for (const s of [...tunnels, ...originSockets]) s.destroy();
    proxy.closeAllConnections();
    await new Promise<void>((r) => proxy.close(() => r()));
    await new Promise<void>((r) => origin.close(() => r()));
  }, 20_000);
});

describe('fetchIsProxyAware reports what undici decided at bootstrap', () => {
  it('is a boolean that a later env mutation cannot change', () => {
    const before = fetchIsProxyAware();
    expect(typeof before).toBe('boolean');
    // The switch is read by undici at bootstrap. Setting it now is exactly the
    // no-op that #1887 mistook for a fix, so the getter must not start lying.
    process.env.NODE_USE_ENV_PROXY = '1';
    expect(fetchIsProxyAware()).toBe(before);
    delete process.env.NODE_USE_ENV_PROXY;
  });
});

describe('a truncated list says so (#2034 finding 6)', () => {
  // The defect: the page loop stopped at its cap and returned the rows it had,
  // with nothing to distinguish that from "this is everything". Callers were
  // left inferring completeness from `rows.length < limit`, which is ONE-SIDED
  // on this path — post-filters drop rows AFTER paging, so a truncated fetch
  // can come back under the limit and still be missing matches. A dedupe
  // ledger that reads that as complete files duplicates, which is #2008's
  // failure mode wearing a different hat.
  const page = (n: number) => Array.from({ length: n }, (_, i) => ({ number: i + 1, title: 't', body: 'b' }));
  const ok = (rows: unknown[]) => ({ status: 200, headers: {}, text: JSON.stringify(rows) });

  afterEach(() => { resetPageCapWarnings(); });

  it('reports complete when the API itself runs out of rows', async () => {
    const plan = planRest(['issue', 'list', '--limit', '500'], REPO);
    const res = await rest(plan, 'tok', async () => ok(page(7)));
    expect(res.complete).toBe(true);
    expect(res.capExhausted).toBe(false);
    expect(res.pagesFetched).toBe(1);
  });

  it('reports capExhausted — and warns — when the page ceiling is what stopped the crawl', async () => {
    // Every page full, every row a PR, so `dropPullRequests` discards all of
    // them: the limit is never satisfied and the loop runs to the cap. This is
    // exactly the shape that reads as complete under a row-count test — the
    // caller sees 0 rows, far below its limit of 1000.
    const prs = () => ok(Array.from({ length: 100 }, (_, i) => ({ number: i, pull_request: {} })));
    const plan = planRest(['issue', 'list', '--limit', '1000'], REPO);
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((m) => { warnings.push(String(m)); });
    const res = await rest(plan, 'tok', async () => prs());
    spy.mockRestore();

    expect(JSON.parse(res.stdout)).toEqual([]);          // a row count of 0…
    expect(res.complete).toBe(false);                    // …that is NOT completeness
    expect(res.capExhausted).toBe(true);
    expect(res.pagesFetched).toBe(maxPagesFor(1000));
    expect(warnings.join('\n')).toMatch(/TRUNCATED/);
  });

  it('does not claim completeness merely because the caller\'s limit was satisfied', async () => {
    // Stopping early because we have enough rows is a cost optimisation, not
    // evidence about what lies past them.
    const plan = planRest(['issue', 'list', '--limit', '30'], REPO);
    const res = await rest(plan, 'tok', async () => ok(page(100)));
    expect(JSON.parse(res.stdout)).toHaveLength(30);
    expect(res.complete).toBe(false);
    expect(res.capExhausted).toBe(false);
  });

  it('warns once per endpoint, so a paging run cannot bury its own output', async () => {
    const plan = planRest(['issue', 'list', '--limit', '1000'], REPO);
    const prs = () => ok(Array.from({ length: 100 }, (_, i) => ({ number: i, pull_request: {} })));
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((m) => { warnings.push(String(m)); });
    await rest(plan, 'tok', async () => prs());
    await rest(plan, 'tok', async () => prs());
    spy.mockRestore();
    expect(warnings).toHaveLength(1);
  });
});

describe('a stalled request is destroyed, not merely abandoned (#2034)', () => {
  // A deadline that only rejects the promise is not a timeout: the socket stays
  // open, the handle stays live, and the process hangs anyway. So each test
  // asserts BOTH that the call rejects AND that the server saw its connection
  // torn down.
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('tears down a fetch-transport request whose origin never responds', async () => {
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;

    const closed = Promise.withResolvers<void>();
    // Accept the request, send nothing, ever.
    const origin = http.createServer((req) => { req.socket.on('close', () => closed.resolve()); });
    await new Promise<void>((r) => origin.listen(0, '127.0.0.1', () => r()));
    const { port } = origin.address() as AddressInfo;

    await expect(httpsRequest(`http://127.0.0.1:${port}/x`, { timeoutMs: 250 }))
      .rejects.toThrow(/timed out after 250ms/);
    // The proof the timeout is real: the server's socket actually closed.
    await closed.promise;

    origin.closeAllConnections();
    await new Promise<void>((r) => origin.close(() => r()));
  }, 15_000);

  it('destroys the CONNECT tunnel when the proxy accepts and then forwards nothing', async () => {
    // Only meaningful on the tunnel path; booted proxy-aware, httpsRequest
    // correctly delegates to fetch (covered above).
    if (fetchIsProxyAware()) return;

    // Keep every tunnel socket: an upgraded CONNECT socket is detached from the
    // server, so `closeAllConnections()` cannot see it and `close()` would wait
    // on it forever. Teardown destroys them by hand, as the #2008 test does.
    const tunnels: net.Socket[] = [];
    const proxy = http.createServer();
    proxy.on('connect', (_req, clientSocket) => {
      tunnels.push(clientSocket);
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      clientSocket.on('error', () => { /* torn down by the timeout */ });
      // …and then nothing: the TLS handshake inside the tunnel never completes.
    });
    await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', () => r()));
    const proxyPort = (proxy.address() as AddressInfo).port;

    process.env.HTTPS_PROXY = `http://127.0.0.1:${proxyPort}`;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;

    // Count OUR end of the tunnel directly. The peer's `close` is not usable
    // here: a CONNECT-upgraded server socket is detached from the HTTP parser
    // and does not reliably observe the client going away, so asserting on it
    // would pass whether or not the socket was destroyed. Live handles pointed
    // at the proxy port are unambiguous — and the assertion is sensitive: this
    // reads 1 while the request is in flight.
    const liveToProxy = () => (process as unknown as {
      _getActiveHandles(): { remotePort?: number; destroyed?: boolean }[];
    })._getActiveHandles().filter((h) => h?.remotePort === proxyPort && !h.destroyed).length;

    await expect(httpsRequest('https://api.github.com/repos/x/y', { timeoutMs: 250 }))
      .rejects.toThrow(/timed out after 250ms/);
    // The point of the fix: rejecting is not enough — before this, the socket
    // stayed open and the handle leaked.
    expect(liveToProxy()).toBe(0);

    for (const s of tunnels) s.destroy();
    proxy.closeAllConnections();
    await new Promise<void>((r) => proxy.close(() => r()));
  }, 15_000);

  it('bounds the CONNECT itself, not just the request inside the tunnel', async () => {
    if (fetchIsProxyAware()) return;

    // A proxy that accepts the TCP connection and never answers the CONNECT.
    // Without a deadline here the promise never settles at all.
    const sockets: net.Socket[] = [];
    const dead = net.createServer((s) => { sockets.push(s); });
    await new Promise<void>((r) => dead.listen(0, '127.0.0.1', () => r()));
    const { port } = dead.address() as AddressInfo;

    process.env.HTTPS_PROXY = `http://127.0.0.1:${port}`;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;

    await expect(httpsRequest('https://api.github.com/repos/x/y', { timeoutMs: 250 }))
      .rejects.toThrow(/CONNECT .* timed out after 250ms/);

    for (const s of sockets) s.destroy();
    await new Promise<void>((r) => dead.close(() => r()));
  }, 15_000);
});

describe('ghApiSoft — a credential failure is never "this metric is unavailable" (#2008)', () => {
  // ghApi's REST fallback needs no gh binary and no token to exercise its
  // error path deterministically, with no network or module-internal mocking.
  beforeEach(() => resetGhResolution());
  afterEach(() => resetGhResolution());

  it('throws a named GhApiError when neither gh nor a token is available', async () => {
    const saved = { ...process.env };
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
    try {
      // Force resolveGh() to report absent by pointing PATH somewhere empty.
      process.env.PATH = '';
      await expect(ghApi('/repos/o/r')).rejects.toMatchObject({ name: 'GhApiError' });
    } finally {
      process.env = saved;
    }
  });
});
