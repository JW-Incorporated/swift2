// A `gh` that actually works in the Claude Code cloud runners.
//
// THE BUG THIS FIXES (#528, and the identical one in the content engine found
// by Karen's 2026-07-26 nightly): every script here shelled out to the `gh`
// CLI via execFile/execFileSync. In cloud runners that throws
// `spawn gh ENOENT` and takes the whole run down — Marjorie's brief skeleton
// on 2026-07-12, and Karen's entire ticket-filing step on 2026-07-26 (a clean
// 1096-item scan with 623 filable findings, all discarded at the last step).
//
// Two things were wrong, and this module fixes both:
//
//   1. RESOLUTION. Agents run `gh` fine from their Bash tool in the very same
//      environment, so the binary is often present but not on the PATH a bare
//      `node script.mjs` inherits. We probe PATH, then a shell (which sources
//      profile PATH additions), then the usual install locations.
//   2. ABSENCE. When `gh` genuinely isn't installed, we fall back to the
//      GitHub REST API, which needs no binary at all.
//
// THE SECOND BUG THIS FIXES (#1869): the REST fallback then failed in cloud
// for two further, stacking reasons — five days of hand-assembled Founders'
// Briefs.
//
//   3. THE PROXY WAS BYPASSED. The fallback used `fetch()`. Node's built-in
//      fetch IGNORES `HTTPS_PROXY` unless the process was *booted* with
//      `NODE_USE_ENV_PROXY=1` / `--use-env-proxy` (verified on Node v24.15:
//      with `HTTPS_PROXY` set and neither flag, a fetch makes zero proxy
//      CONNECTs). Cloud `GH_TOKEN`s are proxy-scoped credentials that only
//      authenticate *through* the agent proxy, so bypassing it means a flat
//      `401 Bad credentials`. Setting `process.env.NODE_USE_ENV_PROXY` from
//      inside the script does NOT help — undici reads it at bootstrap, before
//      any of our code runs (also verified). So we no longer use `fetch`: we
//      speak HTTPS ourselves over an explicit CONNECT tunnel when a proxy is
//      configured. That works no matter how the script was invoked, with no
//      re-exec and no new dependency.
//
//      ^ THAT TRANSPORT NEVER WORKED (#2008). It built the request as
//      `https.request({ agent: false, createConnection: () => tls.connect({ socket }) })`,
//      and with `agent: false` Node builds a fresh https.Agent whose OWN
//      (direct) createConnection wins — the request-level one is never called.
//      So the CONNECT tunnel was opened, abandoned, and every request went
//      straight out to api.github.com, past the credential-injecting proxy,
//      returning `401 Bad credentials` from a placeholder token. Proven by
//      pointing HTTPS_PROXY at a proxy that accepts CONNECT and then forwards
//      NOTHING: the old code still got a real GitHub response; `fetch` with
//      --use-env-proxy correctly timed out. `httpsRequest` now prefers `fetch`
//      (the configuration verified working in cloud) and, when the process was
//      not booted proxy-aware, falls back to a CONNECT tunnel that is actually
//      used — with a loud warning, because silence is what hid this.
//   4. THE SEARCH API IS FORBIDDEN. Every list shape was built as
//      `/search/issues?q=repo:…`. Repo-scoped cloud sessions get:
//        403 {"message":"This GitHub API path is not available: sessions are
//        bound to their configured repositories. Use repository-scoped
//        endpoints (repos/{owner}/{repo}/...)."}
//      So lists now use `/repos/{owner}/{repo}/issues` and
//      `/repos/{owner}/{repo}/pulls`, with the filters `gh` expresses as
//      search qualifiers (`is:merged`) applied client-side.
//
// The REST fallback deliberately covers ONLY the call shapes this repo
// actually uses. An unrecognised command throws a loud, specific error rather
// than silently returning nothing — a scan that reports success while filing
// no tickets is worse than one that crashes.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

const execFileAsync = promisify(execFile);

const CANDIDATE_PATHS = [
  '/usr/local/bin/gh',
  '/usr/bin/gh',
  '/opt/homebrew/bin/gh',
  '/home/linuxbrew/.linuxbrew/bin/gh',
  join(homedir(), '.local', 'bin', 'gh'),
];

// GitHub's REST maximum. Also our pagination page size: fewer, fuller pages is
// the cheap shape (see CLAUDE.md § Cost discipline).
const PER_PAGE = 100;
// Floor on pages per list call: even a small `--limit` may need a few pages
// once client-side filters (mergedOnly, dropPullRequests) discard hits.
const MAX_PAGES = 3;
// Absolute ceiling, so a caller passing a huge `--limit` against a filter that
// matches nothing can never turn into an unbounded crawl of the repo's history.
const HARD_MAX_PAGES = 10;

/**
 * Pages a list call may fetch: enough to satisfy the caller's `--limit`
 * (Karen's fingerprint prefetch asks for 1000 — see issues.mjs, which treats a
 * sub-limit result as the COMPLETE set and skips the forbidden /search
 * namespace entirely), floored at MAX_PAGES for small limits whose post-filters
 * eat hits, ceilinged so it stays bounded. Exported for tests.
 */
export function maxPagesFor(limit) {
  const wanted = Math.ceil((Number(limit) || PER_PAGE) / PER_PAGE);
  return Math.min(Math.max(wanted, MAX_PAGES), HARD_MAX_PAGES);
}

/**
 * How long any one HTTPS request may take before its socket is DESTROYED.
 *
 * Not a nicety. Without it a stalled connection — a proxy that accepts the
 * CONNECT and then forwards nothing, an origin that never sends a response
 * body — hangs the process forever, holding a live handle, and every scheduled
 * runner that calls this waits out its whole workflow timeout with no output
 * to explain why. Callers can override per request via `timeoutMs`.
 */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Every list result carries how the page loop ENDED, because the row count
 * alone cannot tell you (#2034, finding 6):
 *
 *   · `complete`      — TWO-SIDED proof this is the entire matching set. True
 *                       only when the API itself ran out of rows (a short
 *                       page). The old caller-side test, `rows.length < limit`,
 *                       is ONE-SIDED on the REST path: post-filters
 *                       (dropPullRequests, mergedOnly) discard rows AFTER
 *                       paging, so a truncated fetch can return fewer rows than
 *                       the limit and still be missing matches — reading as
 *                       complete when it is not.
 *   · `capExhausted`  — the page loop hit gh.mjs's OWN ceiling rather than the
 *                       end of the data. The list is definitively truncated.
 *                       Also warned about on stderr, once per endpoint: this
 *                       failing silently is what hid the defect.
 *
 * Both are set on the gh-CLI path too, so a caller never has to know which
 * transport it got. Anything that must not act on a partial list — a dedupe
 * ledger above all — should refuse unless `complete === true`.
 */
function warnPageCapExhausted(plan, pagesFetched) {
  const endpoint = `${plan.method} ${plan.path.split('?')[0]}`;
  if (warnedPageCaps.has(endpoint)) return;
  warnedPageCaps.add(endpoint);
  console.error(
    `⚠ gh.mjs: paging stopped at the ${pagesFetched}-page cap for ${endpoint} ` +
    `(--limit ${plan.limit}, ${PER_PAGE}/page, hard ceiling ${HARD_MAX_PAGES} pages = ` +
    `${HARD_MAX_PAGES * PER_PAGE} rows). THE RETURNED LIST IS TRUNCATED — rows past the ` +
    'cap were never fetched. Treat it as partial: check `complete` on the result rather ' +
    'than inferring completeness from a row count (#2034).',
  );
}

const warnedPageCaps = new Set();

/** For tests: forget which endpoints have already warned. */
export function resetPageCapWarnings() {
  warnedPageCaps.clear();
}

let resolved; // undefined = not tried, null = definitively absent, string = path

/** Locate a usable `gh`, or null. Cached — the probe runs at most once. */
export async function resolveGh() {
  if (resolved !== undefined) return resolved;
  for (const cmd of ['gh', ...CANDIDATE_PATHS]) {
    if (cmd.startsWith('/') && !existsSync(cmd)) continue;
    try {
      await execFileAsync(cmd, ['--version'], { timeout: 10_000 });
      resolved = cmd;
      return resolved;
    } catch {
      /* try the next candidate */
    }
  }
  // Last resort: a shell resolves PATH additions from profile files that a
  // bare execFile does not see. This is the case that bit us in cloud.
  try {
    const { stdout } = await execFileAsync('/bin/sh', ['-lc', 'command -v gh'], { timeout: 10_000 });
    const p = stdout.trim();
    if (p) {
      resolved = p;
      return resolved;
    }
  } catch {
    /* no shell resolution either */
  }
  resolved = null;
  return resolved;
}

/** For tests: forget the cached probe result. */
export function resetGhResolution() {
  resolved = undefined;
}

/** GitHub token for the REST fallback, from env or gh's own config. */
export function findToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  // gh stores its OAuth token here; parsed by hand so we take no YAML dep.
  const hosts = join(homedir(), '.config', 'gh', 'hosts.yml');
  try {
    const m = readFileSync(hosts, 'utf8').match(/oauth_token:\s*(\S+)/);
    if (m) return m[1];
  } catch {
    /* not present */
  }
  return null;
}

/** owner/name for calls that didn't pass --repo. No subprocess: reads .git/config. */
export function defaultRepo(cwd = process.cwd()) {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  for (let dir = cwd, i = 0; i < 8; i++) {
    const cfg = join(dir, '.git', 'config');
    if (existsSync(cfg)) {
      const m = readFileSync(cfg, 'utf8').match(/github\.com[:/]([^/\s]+\/[^/\s.]+)(\.git)?/);
      if (m) return m[1];
      break;
    }
    const up = join(dir, '..');
    if (up === dir) break;
    dir = up;
  }
  return null;
}

// ---------------------------------------------------------------------------
// HTTPS transport that honours HTTPS_PROXY (see note 3 at the top of the file)
// ---------------------------------------------------------------------------

/**
 * The proxy URL to use for `host`, or null. Exported for tests — getting
 * NO_PROXY wrong silently sends repo traffic the wrong way.
 */
export function proxyForHost(host, env = process.env) {
  const noProxy = (env.NO_PROXY || env.no_proxy || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const h = host.toLowerCase();
  if (noProxy.some((p) => p === '*' || h === p.replace(/^\./, '') || h.endsWith(`.${p.replace(/^\./, '')}`))) {
    return null;
  }
  const raw = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Open a TCP tunnel to host:port through an HTTP proxy via CONNECT.
 *
 * The CONNECT itself gets the deadline too: a proxy that accepts the TCP
 * connection and then never answers would otherwise leave this promise pending
 * forever, holding an open socket, before the request timeout could ever apply.
 */
function connectThroughProxy(proxyUrl, host, port, timeoutMs = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const headers = { host: `${host}:${port}` };
    if (proxyUrl.username || proxyUrl.password) {
      const creds = `${decodeURIComponent(proxyUrl.username)}:${decodeURIComponent(proxyUrl.password)}`;
      headers['proxy-authorization'] = `Basic ${Buffer.from(creds).toString('base64')}`;
    }
    const req = http.request({
      host: proxyUrl.hostname,
      port: Number(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80),
      method: 'CONNECT',
      path: `${host}:${port}`,
      headers,
    });
    // `req.destroy(err)` tears the proxy socket down AND surfaces as 'error'
    // below, so the timeout leaves nothing behind.
    const timer = setTimeout(() => {
      req.destroy(new Error(
        `proxy CONNECT ${host}:${port} via ${proxyUrl.host} timed out after ${timeoutMs}ms`,
      ));
    }, timeoutMs);
    req.once('connect', (res, socket) => {
      clearTimeout(timer);
      if (res.statusCode !== 200) {
        socket.destroy();
        reject(new Error(`proxy CONNECT ${host}:${port} → ${res.statusCode} ${res.statusMessage || ''}`.trim()));
        return;
      }
      resolve(socket);
    });
    req.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.end();
  });
}

/**
 * Was THIS PROCESS booted so that Node's built-in `fetch` honours HTTPS_PROXY?
 *
 * undici reads the switch once, at bootstrap, before any user code runs — so a
 * library can never turn it on for itself, only an INVOCATION can
 * (`node --use-env-proxy script.mjs`, or `NODE_USE_ENV_PROXY=1 node …`).
 * Captured at module load so a later `process.env` mutation cannot make this
 * lie about what undici actually decided.
 *
 * Exported for tests and for callers that want to warn early.
 */
const FETCH_IS_PROXY_AWARE = (() => {
  const v = process.env.NODE_USE_ENV_PROXY;
  if (v && v !== '0' && v !== 'false') return true;
  const flags = [...process.execArgv, ...(process.env.NODE_OPTIONS || '').split(/\s+/)];
  return flags.includes('--use-env-proxy');
})();

export function fetchIsProxyAware() {
  return FETCH_IS_PROXY_AWARE;
}

let warnedAboutProxyFlag = false;

/**
 * Say — once, loudly — that this process is taking the fallback transport.
 * Silence here is what made #2008 invisible for weeks.
 */
function warnProxyFlagMissing() {
  if (warnedAboutProxyFlag) return;
  warnedAboutProxyFlag = true;
  console.error(
    '⚠ HTTPS_PROXY is set but this process was NOT booted with `--use-env-proxy` / ' +
    'NODE_USE_ENV_PROXY=1, so Node\'s fetch would bypass the proxy entirely. Falling back ' +
    'to an explicit CONNECT tunnel. Prefer invoking this script as ' +
    '`node --use-env-proxy <script>` (see #2008 and docs/agents/runners.md).',
  );
}

/**
 * Normalise a `fetch` Response into the `{ status, headers, text }` shape.
 *
 * `AbortSignal.timeout` covers the body read as well as the headers, so a
 * response that starts and then stalls mid-stream is torn down too — undici
 * destroys the underlying socket on abort, which is the whole point.
 */
/* global AbortSignal */ // a Node 18+ global; same pragma as check-link-liveness.mjs
async function fetchRequest(url, { method, headers, body, timeoutMs }) {
  try {
    const res = await fetch(url, {
      method,
      headers,
      ...(body ? { body } : {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      text: await res.text(),
    };
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(`HTTPS ${method} ${url} timed out after ${timeoutMs}ms (fetch transport)`, { cause: err });
    }
    throw err;
  }
}

/**
 * A one-off agent that speaks TLS over an ALREADY-TUNNELLED socket.
 *
 * THIS IS THE #2008 BUG. The previous shape was:
 *
 *     https.request({ agent: false, createConnection: () => tls.connect({ socket }) })
 *
 * which never once used the tunnel. With `agent: false` Node does not go
 * agentless — it constructs a FRESH `https.Agent`, and an agent's own
 * `createConnection` (a plain, DIRECT `tls.connect`) is what gets called. The
 * request-level `createConnection` is only honoured when there is no agent at
 * all. So every request opened a CONNECT tunnel, abandoned it unused, and went
 * straight out to api.github.com — past the egress proxy that swaps the
 * proxy-scoped placeholder GH_TOKEN for the real credential. Hence a flat
 * `401 Bad credentials` from a token that works fine for curl and for
 * `fetch` + `--use-env-proxy`, both of which really do traverse the tunnel.
 *
 * Overriding `createConnection` on the AGENT INSTANCE is the shape Node honours.
 */
function tunnelAgent(socket, servername) {
  const agent = new https.Agent({ keepAlive: false, maxSockets: 1 });
  agent.createConnection = () => tls.connect({ socket, servername, ALPNProtocols: ['http/1.1'] });
  return agent;
}

/**
 * One HTTPS request that ACTUALLY honours HTTPS_PROXY.
 *
 * Transport order:
 *   1. `fetch` — when no proxy applies to this host, or when the process was
 *      booted proxy-aware. This is the configuration verified working against
 *      the cloud egress proxy (#2008).
 *   2. an explicit, genuinely-used CONNECT tunnel — when a proxy applies but
 *      `fetch` would silently bypass it. Byte-for-byte the same thing undici
 *      does (CONNECT, then TLS inside the tunnel), so the proxy sees the same
 *      request either way.
 *
 * EITHER WAY THE REQUEST IS BOUNDED (#2034). A deadline that only rejects the
 * promise is not a timeout — the socket stays open, the handle stays live, and
 * the process hangs anyway. Both transports here destroy the connection when
 * the deadline fires.
 */
export async function httpsRequest(url, { method = 'GET', headers = {}, body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const u = new URL(url);
  const proxy = proxyForHost(u.hostname);
  if (!proxy || FETCH_IS_PROXY_AWARE) return fetchRequest(url, { method, headers, body, timeoutMs });
  warnProxyFlagMissing();

  const socket = await connectThroughProxy(proxy, u.hostname, Number(u.port) || 443, timeoutMs);
  const agent = tunnelAgent(socket, u.hostname);
  return new Promise((resolve, reject) => {
    let req;
    // The tunnel socket is ours alone; if anything goes wrong it must not be
    // left open holding the event loop (which is how the broken version hung).
    // The deadline routes through here for exactly that reason: destroying the
    // socket is what ENDS the request, not merely what reports it.
    const done = (fn) => (arg) => {
      clearTimeout(timer);
      req?.destroy();
      socket.destroy();
      fn(arg);
    };
    const ok = done(resolve);
    const fail = done(reject);
    const timer = setTimeout(() => {
      fail(new Error(
        `HTTPS ${method} ${url} timed out after ${timeoutMs}ms ` +
        `(CONNECT tunnel via ${proxy.host}); socket destroyed`,
      ));
    }, timeoutMs);
    req = https.request({
      method,
      host: u.hostname,
      port: Number(u.port) || 443,
      path: u.pathname + u.search,
      headers,
      agent,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => ok({
        status: res.statusCode,
        headers: res.headers,
        text: Buffer.concat(chunks).toString('utf8'),
      }));
      res.on('error', fail);
    });
    req.once('error', fail);
    if (body) req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// gh argv → REST request
// ---------------------------------------------------------------------------

/** Pull `--flag value` out of a gh argv. */
function flag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

/** Every `--flag value` pair for a repeatable flag (gh allows `--label a --label b`). */
function flags(args, name) {
  const out = [];
  args.forEach((v, i) => { if (v === name && args[i + 1] !== undefined) out.push(args[i + 1]); });
  return out;
}

/**
 * Translate a supported gh argv into a REST request descriptor.
 * Pure and exported so the mapping is unit-testable without a network or a token.
 * Returns null for commands the fallback does not implement.
 *
 * List shapes are REPO-SCOPED (`/repos/{owner}/{repo}/…`), never `/search/*`:
 * repo-bound cloud sessions are forbidden the global search namespace (#1869).
 * Filters `gh` would express as search qualifiers become `postFilter` steps
 * that `rest()` applies to the fetched page.
 */
export function planRest(args, repoFallback) {
  const repo = flag(args, '--repo') || repoFallback;
  const [a, b] = args;

  if (a === 'label' && b === 'create') {
    return {
      method: 'POST',
      path: `/repos/${repo}/labels`,
      body: { name: args[2], color: flag(args, '--color'), description: flag(args, '--description') },
      // --force means "upsert"; a 422 here is an already-exists, not a failure.
      tolerate: [422],
      kind: 'label',
    };
  }

  if ((a === 'issue' || a === 'pr') && b === 'list') {
    const limit = Math.max(1, Number(flag(args, '--limit')) || 30);
    const state = flag(args, '--state') || 'open';
    const search = flag(args, '--search');
    const labels = flags(args, '--label');
    const fields = (flag(args, '--json') || 'number').split(',');

    // Free-text / qualifier search has no repo-scoped equivalent — the REST
    // list endpoints cannot filter on body text. Karen's fingerprint dedupe is
    // the only caller. Kept on /search/issues, and `rest()` turns the proxy's
    // 403 into an error that names the limitation instead of a bare status.
    if (search) {
      const q = [
        `repo:${repo}`,
        `type:${a === 'pr' ? 'pr' : 'issue'}`,
        state === 'all' ? null : state === 'merged' ? 'is:merged' : `state:${state}`,
        ...labels.map((l) => `label:"${l}"`),
        search,
      ].filter(Boolean).join(' ');
      return {
        method: 'GET',
        path: `/search/issues?q=${encodeURIComponent(q)}&per_page=${Math.min(limit, PER_PAGE)}`,
        kind: 'search',
        fields,
        limit,
      };
    }

    if (a === 'pr') {
      // `--state merged` is a search-only qualifier; REST only knows
      // open/closed/all, so ask for closed and keep the merged ones. Sorting by
      // `updated` desc guarantees anything merged recently is on page 1 — a PR
      // merge is an update.
      //
      // `--state all` gets the SAME `updated` sort, and for the same reason
      // (#3671/#3652). `sort=created` ranks by PR-open time, so a PR opened
      // weeks ago and merged an hour ago sorts by its stale creation date —
      // newer-but-still-open PRs bury it past the page/limit window and its
      // runner reads as "never seen" even though it just shipped. Only a
      // caller wanting PRs ranked purely by open date (none currently do)
      // would want `created` for `all`; every existing `all` caller
      // (Marjorie's `checkRunners` liveness feed) wants recent ACTIVITY,
      // merges included.
      const merged = state === 'merged';
      const restState = merged ? 'closed' : state === 'all' ? 'all' : state;
      const sort = merged || restState === 'all' ? 'updated' : 'created';
      return {
        method: 'GET',
        path: `/repos/${repo}/pulls?state=${restState}&sort=${sort}&direction=desc&per_page=${PER_PAGE}`,
        kind: 'list',
        fields,
        limit,
        postFilter: merged ? ['mergedOnly'] : [],
        sortBy: merged ? 'mergedAt' : null,
      };
    }

    // `/repos/{owner}/{repo}/issues` returns pull requests too — every hit with
    // a `pull_request` key is a PR wearing an issue's clothes. `gh issue list`
    // does not show those, so neither do we.
    const labelParam = labels.length ? `&labels=${encodeURIComponent(labels.join(','))}` : '';
    const restState = state === 'merged' ? 'closed' : state;
    return {
      method: 'GET',
      path: `/repos/${repo}/issues?state=${restState}${labelParam}&sort=created&direction=desc&per_page=${PER_PAGE}`,
      kind: 'list',
      fields,
      limit,
      postFilter: ['dropPullRequests'],
      sortBy: null,
    };
  }

  if (a === 'issue' && b === 'create') {
    const bodyFile = flag(args, '--body-file');
    return {
      method: 'POST',
      path: `/repos/${repo}/issues`,
      body: {
        title: flag(args, '--title'),
        body: bodyFile ? readFileSync(bodyFile, 'utf8') : (flag(args, '--body') || ''),
        labels: flags(args, '--label'),
      },
      kind: 'create',
    };
  }

  return null;
}

const POST_FILTERS = {
  // `/repos/…/issues` mixes in PRs; `gh issue list` never shows them.
  dropPullRequests: (h) => !h.pull_request,
  // `/repos/…/pulls?state=closed` mixes merged with abandoned.
  mergedOnly: (h) => Boolean(h.merged_at || h.pull_request?.merged_at),
};

/**
 * Apply a plan's client-side filtering, ordering and limit to raw REST hits.
 * Exported and pure so the `is:merged` / PR-in-issues semantics gap that the
 * repo-scoped endpoints create is covered by tests, not by hope.
 */
export function applyPostFilters(hits, plan) {
  let out = hits.filter((h) => (plan.postFilter || []).every((name) => POST_FILTERS[name](h)));
  if (plan.sortBy === 'mergedAt') {
    out = out.slice().sort((x, y) =>
      new Date(mergedAtOf(y)).getTime() - new Date(mergedAtOf(x)).getTime());
  }
  return plan.limit ? out.slice(0, plan.limit) : out;
}

function mergedAtOf(hit) {
  return hit.merged_at ?? hit.pull_request?.merged_at ?? null;
}

/**
 * Shape a REST hit like `gh --json <fields>` would. Handles all three hit
 * shapes we now see: `/search/issues` items, `/repos/…/issues` items (where a
 * PR's merge time hides under `pull_request`), and `/repos/…/pulls` items.
 */
export function shapeHit(hit, fields) {
  const map = {
    number: () => hit.number,
    title: () => hit.title,
    body: () => hit.body ?? '',
    url: () => hit.html_url,
    labels: () => (hit.labels || []).map((l) => ({ name: typeof l === 'string' ? l : l.name })),
    author: () => ({ login: hit.user?.login ?? '' }),
    createdAt: () => hit.created_at,
    updatedAt: () => hit.updated_at,
    closedAt: () => hit.closed_at,
    // null, never closed_at: an abandoned PR has a closed_at and no merge, and
    // callers date "merged in the last 24h" off this field.
    mergedAt: () => mergedAtOf(hit),
    isDraft: () => Boolean(hit.draft),
    reviewDecision: () => '', // needs a second call per PR; callers treat '' as "unknown"
    state: () => (hit.state || '').toUpperCase(),
  };
  const out = {};
  for (const f of fields) out[f] = map[f] ? map[f]() : null;
  return out;
}

function ghHeaders(token, hasBody) {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'swift2-scripts',
    ...(hasBody ? { 'content-type': 'application/json' } : {}),
  };
}

function restError(plan, res) {
  const base = `GitHub REST ${plan.method} ${plan.path} → ${res.status} ${res.text}`;
  // A 401 here is almost never "the token is wrong". In cloud runners GH_TOKEN
  // is a proxy-scoped PLACEHOLDER that only authenticates *through* the egress
  // proxy, which swaps in the real credential. Any request that reaches GitHub
  // directly therefore gets a flat 401 — which is precisely what a bypassed
  // proxy looks like (#2008). Name that, so the next person does not spend
  // another two weeks re-diagnosing a transport bug as a credentials bug.
  if (res.status === 401) {
    return new Error(
      `${base}\n` +
      'A 401 from a cloud runner usually means THE PROXY WAS BYPASSED, not that the token is bad:\n' +
      `  · HTTPS_PROXY set: ${Boolean(proxyForHost('api.github.com'))}\n` +
      `  · fetch is proxy-aware (booted with --use-env-proxy/NODE_USE_ENV_PROXY=1): ${FETCH_IS_PROXY_AWARE}\n` +
      'Invoke as `node --use-env-proxy <script>` and retry. See #2008 and docs/agents/runners.md.',
    );
  }
  if (plan.kind === 'search' && (res.status === 403 || res.status === 404)) {
    return new Error(
      `${base}\n` +
      'The global /search namespace is blocked for repo-scoped sessions (#1869).\n' +
      'This call needs full-text search, which has no /repos/{owner}/{repo} equivalent — ' +
      'run it where the gh CLI is installed, or dedupe from a repo-scoped list instead.',
    );
  }
  return new Error(base);
}

/**
 * Execute a plan against the REST API.
 *
 * `request` is injectable purely so the page loop — and the truncation signal
 * it produces — is testable without a network or a token. Production callers
 * take the default.
 */
export async function rest(plan, token, request = httpsRequest) {
  const url = (page) => {
    const base = `https://api.github.com${plan.path}`;
    return page > 1 ? `${base}${plan.path.includes('?') ? '&' : '?'}page=${page}` : base;
  };

  if (plan.kind === 'list') {
    const hits = [];
    const pages = maxPagesFor(plan.limit);
    let sawFinalPage = false;
    let pagesFetched = 0;
    for (let page = 1; page <= pages; page++) {
      const res = await request(url(page), { method: plan.method, headers: ghHeaders(token, false) });
      if (res.status < 200 || res.status >= 300) throw restError(plan, res);
      const batch = JSON.parse(res.text || '[]');
      hits.push(...batch);
      pagesFetched = page;
      // A SHORT PAGE IS THE ONLY PROOF the API had nothing more. Record it
      // rather than letting each caller re-derive it from a row count.
      if (batch.length < PER_PAGE) { sawFinalPage = true; break; }
      // Stop as soon as we can satisfy the limit. Every extra page is a request
      // we're charged for and a second we don't have — but a satisfied limit
      // says nothing about what lies beyond it, so `complete` stays false.
      if (applyPostFilters(hits, plan).length >= plan.limit) break;
    }
    const capExhausted = !sawFinalPage && pagesFetched >= pages;
    if (capExhausted) warnPageCapExhausted(plan, pagesFetched);
    return {
      stdout: JSON.stringify(applyPostFilters(hits, plan).map((h) => shapeHit(h, plan.fields))),
      complete: sawFinalPage,
      capExhausted,
      pagesFetched,
    };
  }

  const res = await request(url(1), {
    method: plan.method,
    headers: ghHeaders(token, Boolean(plan.body)),
    ...(plan.body ? { body: JSON.stringify(plan.body) } : {}),
  });
  const ok = res.status >= 200 && res.status < 300;
  if (!ok && !(plan.tolerate || []).includes(res.status)) throw restError(plan, res);
  if (plan.kind === 'search') {
    const json = JSON.parse(res.text || '{}');
    const items = json.items || [];
    return {
      stdout: JSON.stringify(items.map((h) => shapeHit(h, plan.fields))),
      // /search reports the size of the full match set, so completeness here is
      // exact rather than inferred — this call fetches page 1 only.
      complete: typeof json.total_count === 'number' ? items.length >= json.total_count : false,
      capExhausted: false,
    };
  }
  if (!ok) return { stdout: '' }; // tolerated (e.g. label already exists)
  let json = {};
  try { json = JSON.parse(res.text || '{}'); } catch { /* non-JSON body */ }
  return { stdout: json.html_url || JSON.stringify(json) };
}

/**
 * Completeness for a list served by the real gh CLI.
 *
 * gh filters server-side and returns at most `--limit` rows, so a SHORT result
 * is proof there was nothing more — the row-count test is sound on this path
 * (it is only the REST fallback that post-filters after paging). Computing it
 * here means `complete` means the same thing on both transports, so callers
 * stop branching on which one they got.
 */
function cliListCompleteness(args, stdout) {
  const [a, b] = args;
  if (!((a === 'issue' || a === 'pr') && b === 'list')) return {};
  const limit = Math.max(1, Number(flag(args, '--limit')) || 30);
  let rows;
  try { rows = JSON.parse(String(stdout ?? '')); } catch { return {}; }
  if (!Array.isArray(rows)) return {};
  return { complete: rows.length < limit, capExhausted: false, pagesFetched: 1 };
}

/**
 * Run a gh command. Uses the CLI when present, REST when it isn't.
 * Returns `{ stdout }` so it is a drop-in for the old promisified execFile.
 *
 * List calls additionally carry `{ complete, capExhausted, pagesFetched }` —
 * see the contract on `warnPageCapExhausted` above. A caller that must not act
 * on a partial list should require `complete === true`, never a row count.
 */
export async function gh(args, opts = {}) {
  const bin = await resolveGh();
  if (bin) {
    const out = await execFileAsync(bin, args, { maxBuffer: 16 * 1024 * 1024, ...opts });
    return { ...out, ...cliListCompleteness(args, out.stdout) };
  }

  const token = findToken();
  const plan = planRest(args, defaultRepo());
  if (!plan) {
    throw new Error(
      `gh CLI not found and no REST fallback implemented for: gh ${args.join(' ')}\n` +
      `Add it to planRest() in scripts/lib/gh.mjs, or install gh in this runner.`,
    );
  }
  if (!token) {
    throw new Error(
      'gh CLI not found AND no GitHub token available, so the REST fallback cannot run.\n' +
      'Set GH_TOKEN or GITHUB_TOKEN in this environment (see docs/agents/runners.md).\n' +
      `Wanted: gh ${args.join(' ')}`,
    );
  }
  return rest(plan, token);
}

/** True when GitHub is reachable at all — for callers that want to degrade early. */
export async function githubReachable() {
  return Boolean((await resolveGh()) || findToken());
}
