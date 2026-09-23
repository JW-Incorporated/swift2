// Vercel production deploy failure check — deterministic, zero-AI.
//
// WHY THIS EXISTS (t_85667a3c). The 2026-09-23 incident: PR #4534 merged to
// `main`, Vercel's production deploy for `swift2-web` failed at commit
// e17860a76, and nothing surfaced it — Joey found the site stale hours
// later and had to ask directly (t_3dab9cf8's own investigation, and the
// founder complaint that opened this task). watchdog.yml already has
// checks for the *prod site itself* (the "Prod smoke check" step, which
// only catches an outage that has ALREADY reached the live site) and for
// *scheduled workflows* (the "Scheduled workflows healthy" step, which
// only watches GitHub Actions cron jobs) — but nothing here ever asked
// Vercel's own deployment API whether the last production build actually
// shipped. `scripts/ops/collect-maintenance.mjs` reads that same API
// already, but only once a day, folded into the Founders' Brief's
// maintenance section — a founder reading the brief 8+ hours later is
// exactly the same "found out too late" shape this task exists to close.
// This is the missing PIECE: a standing, hourly, standalone check with a
// REAL @-mention, independent of the daily brief.
//
// WHY "LATEST", NOT A WINDOWED COUNT (unlike
// scripts/ops/lib/maintenance.mjs's `summarizeVercelDeployments`, which
// counts every failure in a rolling window for the brief's trend view):
// this check asks one narrower, alarm-shaped question — "is the site
// currently running last-known-good code, or is main ahead of what's
// actually live?" — so only the MOST RECENT production deployment per
// project matters. A failed deploy immediately superseded by a successful
// redeploy (the exact "self-resolves within one retry" case this task
// asks not to double-ping on) clears itself the moment the newer
// deployment becomes the latest — no separate resolved/reset bookkeeping
// needed, and `upsert-alert.sh` already only notifies on a state CHANGE,
// so a standing-green recheck never re-pings either.
//
// SCOPE (named plainly, not guessed): only Vercel deploy failures are
// covered here. Two sibling failure classes the task named as
// "content is stuck and nobody would notice" are explicitly OUT of this
// change's scope and are not silently assumed covered:
//   - A Tree/social workflow failing silently: watchdog.yml's existing
//     "Scheduled workflows healthy" and "Content lane liveness checks"
//     steps already cover scheduled-workflow and content-lane silence;
//     whether their existing GitHub-issue-only delivery should also gain
//     a founder @-mention is a judgment call left to a founder decision
//     (see HUMAN-ACTIONS.md) rather than guessed at here.
//   - A kanban card sitting blocked on breaking-news-tagged work: kanban
//     is a Hermes-side system with no presence in this repo at all; a
//     Swift2 PR cannot reach into it. Out of scope for this change.
//
// Usage: node --use-env-proxy scripts/watchdog/vercel-deploy-check.mjs \
//          --alert-body /tmp/alert-body.md
// Exit: 0 = latest production deploy for the watched project is READY —
//           caller closes the alert.
//       1 = latest production deploy is ERROR/CANCELED, OR no VERCEL_TOKEN
//           / the Vercel API could not be reached — caller opens the
//           alert. Per the same invariant `ops/lib/maintenance.mjs`
//           documents ("null never renders as green"), an unconfirmed
//           state is treated as alarm-worthy, not silently clear, so a
//           revoked/expired token cannot make this check go dark the way
//           the 2026-08-15 Supabase rotation did to news-worker.
import { writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';

export const WATCHED_PROJECT = process.env.VERCEL_WATCH_PROJECT || 'swift2-web';
const FETCH_TIMEOUT_MS = 20_000;

/**
 * Reduce a Vercel `GET /v7/deployments` payload's `.deployments` array to
 * the single newest PRODUCTION deployment per project. Pure, unit-testable
 * without any network access.
 */
export function latestProductionDeploys(deployments) {
  if (!Array.isArray(deployments)) return null;
  const byProject = new Map();
  for (const d of deployments) {
    if (d.target !== 'production') continue;
    const createdMs = typeof d.createdAt === 'number' ? d.createdAt : Date.parse(d.created ?? '');
    if (!Number.isFinite(createdMs)) continue;
    const name = d.name ?? d.projectId ?? 'unknown';
    const existing = byProject.get(name);
    if (!existing || createdMs > existing.createdAtMs) {
      byProject.set(name, {
        project: name,
        state: d.readyState ?? d.state ?? 'UNKNOWN',
        createdAtMs: createdMs,
        createdAt: new Date(createdMs).toISOString(),
        url: d.url ? `https://${d.url}` : null,
        uid: d.uid ?? d.id ?? null,
      });
    }
  }
  return [...byProject.values()].sort((a, b) => a.project.localeCompare(b.project));
}

const FAILING_STATES = new Set(['ERROR', 'CANCELED']);

/**
 * Evaluate the alarm state for one watched project. Pure — takes the
 * already-reduced `latestProductionDeploys()` output (or null on a fetch
 * failure) so it is unit-testable without `fetch`.
 */
export function evaluate({ latest, watchProject = WATCHED_PROJECT, fetchOk = true }) {
  if (!fetchOk) {
    return {
      status: 'unknown',
      reason:
        `Could not reach the Vercel deployments API (missing/invalid VERCEL_TOKEN, or the request itself failed). ` +
        `Per this repo's "null never renders as green" rule, this counts as an alarm, not a clear check — ` +
        `a revoked token must not make production-deploy failures invisible the way the 2026-08-15 Supabase ` +
        `key rotation did to news-worker.`,
    };
  }
  const deploy = (latest || []).find((d) => d.project === watchProject);
  if (!deploy) {
    return {
      status: 'unknown',
      reason: `No production deployment for project "${watchProject}" was returned by the Vercel API at all — cannot confirm the site is on last-known-good code.`,
    };
  }
  if (FAILING_STATES.has(deploy.state)) {
    return {
      status: 'confirmed-failure',
      reason: `The latest production deployment for "${watchProject}" (${deploy.uid ?? 'unknown id'}, created ${deploy.createdAt}) has state **${deploy.state}**. main is ahead of what is actually live on longlivets.com.`,
      deploy,
    };
  }
  return {
    status: 'confirmed-ok',
    reason: `The latest production deployment for "${watchProject}" (created ${deploy.createdAt}) has state ${deploy.state}. Production is on last-known-good code.`,
    deploy,
  };
}

async function fetchDeployments() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { ok: false, deployments: null };
  const headers = { Authorization: `Bearer ${token}` };
  const team = process.env.VERCEL_TEAM_ID
    ? `&teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}`
    : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.vercel.com/v7/deployments?limit=100${team}`, {
      headers,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    const body = JSON.parse(text);
    return { ok: true, deployments: body?.deployments ?? null };
  } catch (err) {
    console.error(`vercel-deploy-check: fetch failed: ${err.message ?? err}`);
    return { ok: false, deployments: null };
  } finally {
    clearTimeout(timer);
  }
}

function renderBody(result, watchProject) {
  const heading = {
    'confirmed-failure': `The last production deploy for **${watchProject}** FAILED.`,
    unknown: `The Vercel production-deploy check could not confirm the deploy state for **${watchProject}**.`,
    'confirmed-ok': `Production deploys for **${watchProject}** are healthy.`,
  }[result.status];
  const lines = [heading, '', result.reason];
  if (result.deploy?.url) lines.push('', `Failed deployment: https://${result.deploy.uid ? `vercel.com/deployments/${result.deploy.uid}` : result.deploy.url}`);
  lines.push(
    '',
    'This is the hourly, zero-AI Vercel production-deploy check (watchdog.yml, scripts/watchdog/vercel-deploy-check.mjs, t_85667a3c). ' +
      'It reads the Vercel deployments API directly rather than waiting for the next Founders\' Brief.',
  );
  return lines.join('\n') + '\n';
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };

  const { ok, deployments } = await fetchDeployments();
  const latest = ok ? latestProductionDeploys(deployments) : null;
  const result = evaluate({ latest, fetchOk: ok });
  console.log(`vercel-deploy-check: ${result.status} — ${result.reason}`);

  const alertFile = arg('--alert-body');
  if (alertFile) writeFileSync(alertFile, renderBody(result, WATCHED_PROJECT));

  return result.status === 'confirmed-ok' ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'vercel-deploy-check.mjs';
if (invokedDirectly) {
  runMain(async () => {
    try {
      return await main();
    } catch (e) {
      console.error(`✗ vercel-deploy-check could not run: ${e.message}`);
      return 1;
    }
  }, { name: 'vercel-deploy-check' });
}
