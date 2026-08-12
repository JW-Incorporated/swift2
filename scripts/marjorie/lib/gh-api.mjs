// A minimal authenticated GitHub REST caller for the brief's deterministic
// collectors.
//
// WHY THIS EXISTS AND NOT `scripts/lib/gh.mjs`:
// `gh.mjs` translates a *gh argv* into REST. The collectors here need raw
// endpoints that have no `gh <noun> <verb>` equivalent in that translator —
// `/organizations/{org}/settings/billing/usage`, `/actions/runs`,
// `/actions/workflows`. Rather than widen `planRest()` (which PR #1887 is
// actively rewriting, and which would conflict), this is a small separate
// caller with one job: GET a path, return JSON.
//
// It is CLI-first for exactly the reason #1887 documents: in cloud runners the
// token is a proxy-scoped credential, and `gh` already knows how to speak
// through the proxy. Node's built-in `fetch` does NOT honour HTTPS_PROXY
// unless the process was *booted* with `--use-env-proxy`, so a fetch-only
// implementation silently bypasses the proxy and gets a flat 401.
//
// FOLLOW-UP DONE (#2008): `directRequest()` used a bare `fetch`, which bypasses
// HTTPS_PROXY unless the process was booted with `--use-env-proxy` — the same
// silent-bypass class of bug that #2008 fixed in `gh.mjs`. It now goes through
// `httpsRequest()`, the one transport in this repo that is proxy-correct on
// both paths.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolveGh, findToken, httpsRequest } from '../../lib/gh.mjs';

const execFileAsync = promisify(execFile);

export class GhApiError extends Error {
  constructor(message, { status, path } = {}) {
    super(message);
    this.name = 'GhApiError';
    this.status = status;
    this.path = path;
  }
}

async function directRequest(path, token) {
  const res = await httpsRequest(`https://api.github.com${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'swift2-marjorie',
      'x-github-api-version': '2022-11-28',
    },
  });
  const text = res.text ?? '';
  if (res.status < 200 || res.status >= 300) {
    throw new GhApiError(`GitHub REST GET ${path} → ${res.status} ${text.slice(0, 300)}`, { status: res.status, path });
  }
  return text ? JSON.parse(text) : null;
}

/**
 * GET a GitHub REST path and return parsed JSON.
 * `path` starts with a slash, e.g. `/repos/o/r/actions/runs?per_page=1`.
 */
export async function ghApi(path) {
  const bin = await resolveGh();
  if (bin) {
    try {
      // `gh api` inherits the CLI's auth AND its proxy handling.
      const { stdout } = await execFileAsync(bin, ['api', path.replace(/^\//, '')], {
        maxBuffer: 32 * 1024 * 1024,
      });
      return stdout ? JSON.parse(stdout) : null;
    } catch (err) {
      // gh prints the API body on stdout even for 4xx; surface it, don't hide it.
      const detail = (err.stdout || err.stderr || err.message || '').toString().slice(0, 400);
      const status = Number((detail.match(/HTTP (\d{3})/) || [])[1]) || undefined;
      throw new GhApiError(`gh api ${path} failed: ${detail}`, { status, path });
    }
  }
  const token = findToken();
  if (!token) {
    throw new GhApiError(
      `No gh CLI and no GH_TOKEN/GITHUB_TOKEN, so ${path} cannot be fetched.\n` +
      'Set GH_TOKEN in this runner (see docs/agents/runners.md).',
      { path },
    );
  }
  return directRequest(path, token);
}

/**
 * Like `ghApi`, but returns `fallback` instead of throwing.
 *
 * Every collector in this directory is a *reporting* path: a brief that fails
 * to render because one optional metric 404'd is worse than a brief that says
 * "this metric is unavailable". Callers pass a fallback that renders honestly
 * (usually `null`, which the formatters print as "unavailable"), and the
 * reason is carried out on `.error` so the brief can name it.
 */
export async function ghApiSoft(path, fallback = null) {
  try {
    return { ok: true, data: await ghApi(path) };
  } catch (err) {
    // A 401 IS NOT AN OPTIONAL-METRIC FAILURE. It means this runner cannot
    // authenticate to GitHub at all, so every other collector is about to fail
    // the same way — and softening it renders a brief full of honest-looking
    // "unavailable" lines that still exits 0. That is exactly the silent
    // failure #2008 is about, so credential failures stay fatal. (403 stays
    // soft: the repo-scoped /search ban and rate limits are real, expected,
    // per-endpoint degradations — see #1869.)
    if (err?.status === 401) throw err;
    return { ok: false, data: fallback, error: err.message };
  }
}
