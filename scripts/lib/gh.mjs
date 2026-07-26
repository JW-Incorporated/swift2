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
// The REST fallback deliberately covers ONLY the four call shapes this repo
// actually uses. An unrecognised command throws a loud, specific error rather
// than silently returning nothing — a scan that reports success while filing
// no tickets is worse than one that crashes.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const CANDIDATE_PATHS = [
  '/usr/local/bin/gh',
  '/usr/bin/gh',
  '/opt/homebrew/bin/gh',
  '/home/linuxbrew/.linuxbrew/bin/gh',
  join(homedir(), '.local', 'bin', 'gh'),
];

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

/** Pull `--flag value` out of a gh argv. */
function flag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

/**
 * Translate a supported gh argv into a REST request descriptor.
 * Pure and exported so the mapping is unit-testable without a network or a token.
 * Returns null for commands the fallback does not implement.
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
    const limit = flag(args, '--limit') || '30';
    const state = flag(args, '--state') || 'open';
    const search = flag(args, '--search');
    const label = flag(args, '--label');
    const fields = (flag(args, '--json') || 'number').split(',');
    const q = [
      `repo:${repo}`,
      `type:${a === 'pr' ? 'pr' : 'issue'}`,
      state === 'all' ? null : state === 'merged' ? 'is:merged' : `state:${state}`,
      label ? `label:"${label}"` : null,
      search || null,
    ].filter(Boolean).join(' ');
    return {
      method: 'GET',
      path: `/search/issues?q=${encodeURIComponent(q)}&per_page=${Math.min(Number(limit) || 30, 100)}`,
      kind: 'list',
      fields,
    };
  }

  if (a === 'issue' && b === 'create') {
    const bodyFile = flag(args, '--body-file');
    const labels = [];
    args.forEach((v, i) => { if (v === '--label') labels.push(args[i + 1]); });
    return {
      method: 'POST',
      path: `/repos/${repo}/issues`,
      body: {
        title: flag(args, '--title'),
        body: bodyFile ? readFileSync(bodyFile, 'utf8') : (flag(args, '--body') || ''),
        labels,
      },
      kind: 'create',
    };
  }

  return null;
}

/** Shape a REST search hit like `gh --json <fields>` would. */
function shapeHit(hit, fields) {
  const map = {
    number: () => hit.number,
    title: () => hit.title,
    body: () => hit.body ?? '',
    url: () => hit.html_url,
    labels: () => (hit.labels || []).map((l) => ({ name: typeof l === 'string' ? l : l.name })),
    author: () => ({ login: hit.user?.login ?? '' }),
    createdAt: () => hit.created_at,
    closedAt: () => hit.closed_at,
    mergedAt: () => hit.pull_request?.merged_at ?? hit.closed_at,
    isDraft: () => Boolean(hit.draft),
    reviewDecision: () => '', // not exposed by the search API; callers treat '' as "unknown"
    state: () => (hit.state || '').toUpperCase(),
  };
  const out = {};
  for (const f of fields) out[f] = map[f] ? map[f]() : null;
  return out;
}

async function rest(plan, token) {
  const res = await fetch(`https://api.github.com${plan.path}`, {
    method: plan.method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'swift2-scripts',
      ...(plan.body ? { 'content-type': 'application/json' } : {}),
    },
    ...(plan.body ? { body: JSON.stringify(plan.body) } : {}),
  });
  if (!res.ok && !(plan.tolerate || []).includes(res.status)) {
    throw new Error(`GitHub REST ${plan.method} ${plan.path} → ${res.status} ${await res.text()}`);
  }
  if (plan.kind === 'list') {
    const json = await res.json();
    return { stdout: JSON.stringify((json.items || []).map((h) => shapeHit(h, plan.fields))) };
  }
  if (!res.ok) return { stdout: '' }; // tolerated (e.g. label already exists)
  const json = await res.json().catch(() => ({}));
  return { stdout: json.html_url || JSON.stringify(json) };
}

/**
 * Run a gh command. Uses the CLI when present, REST when it isn't.
 * Returns `{ stdout }` so it is a drop-in for the old promisified execFile.
 */
export async function gh(args, opts = {}) {
  const bin = await resolveGh();
  if (bin) return execFileAsync(bin, args, { maxBuffer: 16 * 1024 * 1024, ...opts });

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
