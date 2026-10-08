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
// LEGITIMATE AUTO-SKIP vs REAL FAILURE (issue #4616, 2026-09-29 false
// alarm). Vercel reports readyState CANCELED for two very different
// situations:
//   1. A genuinely aborted/failed build (what this check exists to catch).
//   2. Vercel's own "Ignored Build Step" auto-skip, when the commit only
//      touches paths outside the app's build inputs (e.g. a data file
//      under social/feedback/). That is Vercel correctly deciding no
//      rebuild was needed — the site is NOT stale, nothing failed.
// The Vercel `GET /v7/deployments` payload alone does not cleanly
// distinguish these two (both are readyState CANCELED with no separate
// flag). The reliable signal is the GitHub Deployments status API for the
// SAME COMMIT: Vercel posts a commit status with `description: "Skipped -
// Not affected"` for case 2, and nothing resembling that for case 1. So a
// CANCELED deploy only clears the alarm when this cross-check POSITIVELY
// confirms the skip via GitHub's API for that exact commit — see
// `isLegitimateSkipStatus` / `applySkipOverride` below. Consistent with
// "null never renders as green": if the commit sha is missing, the GitHub
// API call fails, or no skip-shaped status is found, the CANCELED stays a
// confirmed-failure and still alarms. ERROR is never eligible for this
// override — an ERROR is never a legitimate auto-skip.
//
// Usage: node --use-env-proxy scripts/watchdog/vercel-deploy-check.mjs \
//          --alert-body /tmp/alert-body.md
// Exit: 0 = latest production deploy for the watched project is READY, or
//           a CANCELED deploy was positively confirmed as Vercel's own
//           legitimate "not affected" auto-skip — caller closes the alert.
//       1 = latest production deploy is a real ERROR/CANCELED failure, OR
//           no VERCEL_TOKEN / the Vercel API could not be reached — caller
//           opens the alert. Per the same invariant `ops/lib/maintenance.mjs`
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
        // Needed to cross-check a CANCELED deploy against the GitHub
        // Deployments status API for the same commit (see
        // `isLegitimateSkipStatus` / `applySkipOverride` below). Vercel's
        // deployments payload carries this under `meta.githubCommitSha`.
        commitSha: d.meta?.githubCommitSha ?? null,
      });
    }
  }
  return [...byProject.values()].sort((a, b) => a.project.localeCompare(b.project));
}

const FAILING_STATES = new Set(['ERROR', 'CANCELED']);
// Only CANCELED is ever eligible for the legitimate-auto-skip override —
// an ERROR is never Vercel's own "not affected" skip, so it always alarms
// regardless of any cross-check result.
const SKIP_ELIGIBLE_STATES = new Set(['CANCELED']);

/**
 * Evaluate the alarm state for one watched project. Pure — takes the
 * already-reduced `latestProductionDeploys()` output (or null on a fetch
 * failure) so it is unit-testable without `fetch`. Does NOT itself decide
 * the legitimate-auto-skip override (see `applySkipOverride`); a CANCELED
 * deploy is always `confirmed-failure` at this stage.
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

/**
 * Does one GitHub commit-status entry (from
 * `GET /repos/{owner}/{repo}/commits/{sha}/status`) look like Vercel's own
 * "Ignored Build Step" auto-skip, rather than a real failure? Pure,
 * unit-testable without any network access.
 *
 * Confirmed shape from issue #4616's false alarm (dpl_ApJCx54DfzffC9jSQi3vSYwcXKvW,
 * sha ce7f39e0): `{ context: "Vercel", state: "success", description: "Skipped - Not affected" }`.
 * Matched loosely (case-insensitive "skip" in the description, from the
 * Vercel context) rather than on the exact string, since Vercel's own
 * wording for this case is not a documented, stable contract — but the
 * match still requires the Vercel context, so an unrelated status with the
 * word "skip" in it elsewhere cannot false-positive this into a clear.
 */
export function isLegitimateSkipStatus(status) {
  if (!status || typeof status !== 'object') return false;
  if (String(status.context ?? '').toLowerCase() !== 'vercel') return false;
  return /skip/i.test(String(status.description ?? ''));
}

/**
 * Given the initial `evaluate()` result and the outcome of the GitHub
 * commit-status cross-check, decide whether a CANCELED "confirmed-failure"
 * should be downgraded to a non-alarming `confirmed-skipped`. Pure —
 * takes `skipConfirmed` as a plain boolean/undefined so it is fully
 * unit-testable without any network access.
 *
 * `skipConfirmed`:
 *   - `true`  — the GitHub API returned a status matching
 *               `isLegitimateSkipStatus` for this deploy's commit sha.
 *   - `false` — the GitHub API was reachable and answered, but no matching
 *               status was found (a real cancel/abort).
 *   - `undefined` — the cross-check could not run at all (no commit sha on
 *               the deploy, or the GitHub API call itself failed).
 * Only `true` clears the alarm. Both `false` and `undefined` leave the
 * original `confirmed-failure` in place — "null never renders as green"
 * applies to this cross-check exactly as it does to the primary Vercel
 * fetch: an unconfirmable skip must alarm, not silently clear.
 */
export function applySkipOverride(result, skipConfirmed) {
  if (result.status !== 'confirmed-failure') return result;
  if (!SKIP_ELIGIBLE_STATES.has(result.deploy?.state)) return result;
  if (skipConfirmed !== true) return result;
  return {
    status: 'confirmed-skipped',
    reason:
      `The latest production deployment for "${result.deploy.project}" (${result.deploy.uid ?? 'unknown id'}, created ${result.deploy.createdAt}) ` +
      `has state **CANCELED**, but GitHub's own commit status for that deploy's commit (${result.deploy.commitSha}) confirms this was Vercel's ` +
      `legitimate "not affected" auto-skip (a commit that doesn't touch the app's build inputs), not a real aborted build. ` +
      `Production is on last-known-good code.`,
    deploy: result.deploy,
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

/**
 * Cross-check a single commit against GitHub's combined commit-status API
 * to see whether Vercel's own status for it looks like a legitimate
 * "not affected" auto-skip. Returns `true`/`false` when the GitHub API
 * answered, or `undefined` if the call could not be made/completed at all
 * (missing token, network failure, non-2xx response) — see
 * `applySkipOverride`'s header for why `undefined` must NOT be treated the
 * same as `false` by the caller (both currently alarm, but they are
 * different failure shapes and are kept distinct for observability).
 */
async function fetchSkipConfirmation(sha) {
  if (!sha) return undefined;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) return undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`vercel-deploy-check: GitHub commit-status lookup failed: HTTP ${res.status}`);
      return undefined;
    }
    const body = await res.json();
    const statuses = Array.isArray(body?.statuses) ? body.statuses : [];
    return statuses.some(isLegitimateSkipStatus);
  } catch (err) {
    console.error(`vercel-deploy-check: GitHub commit-status lookup failed: ${err.message ?? err}`);
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

function renderBody(result, watchProject) {
  const heading = {
    'confirmed-failure': `The last production deploy for **${watchProject}** FAILED.`,
    unknown: `The Vercel production-deploy check could not confirm the deploy state for **${watchProject}**.`,
    'confirmed-ok': `Production deploys for **${watchProject}** are healthy.`,
    'confirmed-skipped': `Production deploys for **${watchProject}** are healthy (last deploy was a legitimate Vercel auto-skip).`,
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
  let result = evaluate({ latest, fetchOk: ok });

  // Only ever attempt the skip cross-check for a CANCELED deploy that is
  // currently a confirmed-failure — an ERROR, an unknown, or an already-ok
  // result never needs it (see applySkipOverride's own eligibility guard,
  // duplicated here as an early-out so a healthy run never makes an extra
  // GitHub API call).
  if (result.status === 'confirmed-failure' && result.deploy?.state === 'CANCELED') {
    const skipConfirmed = await fetchSkipConfirmation(result.deploy.commitSha);
    result = applySkipOverride(result, skipConfirmed);
  }

  console.log(`vercel-deploy-check: ${result.status} — ${result.reason}`);

  const alertFile = arg('--alert-body');
  if (alertFile) writeFileSync(alertFile, renderBody(result, WATCHED_PROJECT));

  return result.status === 'confirmed-ok' || result.status === 'confirmed-skipped' ? 0 : 1;
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
