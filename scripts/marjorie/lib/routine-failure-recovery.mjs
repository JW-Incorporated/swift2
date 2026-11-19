// Recovery auto-close for routine-failure issues (scripts/marjorie/routine-failure-triage.mjs).
// Triage files one issue per workflow per UTC day but nothing closed them once the
// routine ran green again: 18 from 2026-10-27/28 sat open for three weeks. Each sweep
// now closes an open failure issue once its routine has recovered. Plain code, no LLM.
//
// Only issues triage FILED are touched: the `routine-failure` label AND a failure marker
// AND the exact title triage writes for that marker (lib/routine-failure-keys.mjs).
// Adopted Tree receipts (other titles) and any other issue are never closed.
//
// "Recovered" is per trigger: every failing run the issue records (body + triage's own
// repeat-failure comments) is looked up for its event, and for EACH of those events the
// newest decisive completed main run of that same event must be a success newer than
// that event's last failure — so a green manual dispatch never closes a failing
// schedule. An unreadable failing run means "do not close". A failure after the close
// files the next sequence (triage), never a silent comment on this closed issue.
//
//   node scripts/marjorie/routine-failure-triage.mjs --recover --dry-run
import { apiFor, listIssuesByLabels } from './issues-rest.mjs';
import { COMMENT_MARKER, failureTitle, parseFailureMarkers } from './routine-failure-keys.mjs';

export const RECOVERY_LABEL = 'routine-failure';
export const RECOVERY_MARKER = '<!-- routine-failure-recovered -->';
// A run that never did anything says nothing about recovery; a cancelled one may be a timeout, so it blocks.
const IGNORED_CONCLUSIONS = new Set(['skipped', 'neutral']);
const RUNS_PER_PAGE = 20;
const RUN_ID_RE = /\/actions\/runs\/(\d+)/g;

const short = (err) => String(err?.message || err).split('\n')[0].slice(0, 160);

/** { workflow, day, seq } iff this issue is one triage filed (label + marker + exact title); else null. */
export function filedFailure(issue) {
  if (!(issue.labels || []).some((l) => l.name === RECOVERY_LABEL)) return null;
  return parseFailureMarkers(issue.body).find((m) => issue.title === failureTitle(m.workflow, m.day, m.seq)) ?? null;
}

/** Run ids of the failures this issue records: its body plus triage's own repeat-failure comments. */
export function failingRunIds(body, comments) {
  const texts = [body, ...(comments || []).map((c) => c.body).filter((b) => String(b ?? '').includes(COMMENT_MARKER))];
  return [...new Set(texts.flatMap((t) => [...String(t ?? '').matchAll(RUN_ID_RE)].map((m) => m[1])))];
}

/** Newest completed main run that actually ran (skipped/neutral ignored), or null. */
export function latestDecisiveRun(runs) {
  return (runs || []).find((r) => !IGNORED_CONCLUSIONS.has(r.conclusion)) ?? null;
}

export function recoveryComment(workflow, runs) {
  const named = runs.map((r) => `${r.event} ${r.html_url}`).join(', ');
  return `Recovered: \`${workflow}\` ran green on main since this failure (${named}). Closed automatically by routine-failure-triage.\n\n${RECOVERY_MARKER}`;
}

const getJson = async (gh, path) => JSON.parse(String((await gh(['api', path])).stdout || 'null'));

/** null = recovered, with the green runs; else the reason it is kept. */
async function recoveryVerdict(issue, workflow, { repo, gh, api, runCache, listCache }) {
  const comments = (await api(`/repos/${repo}/issues/${issue.number}/comments?per_page=100`)) || [];
  const ids = failingRunIds(issue.body, comments);
  if (ids.length === 0) return { reason: 'no failing run recorded' };
  const lastFailure = new Map();
  for (const id of ids) {
    if (!runCache.has(id)) runCache.set(id, getJson(gh, `repos/${repo}/actions/runs/${id}`).catch(() => null));
    const run = await runCache.get(id);
    if (!run?.event || !Date.parse(run.created_at)) return { reason: `failing run ${id} unreadable` };
    lastFailure.set(run.event, Math.max(lastFailure.get(run.event) ?? 0, Date.parse(run.created_at)));
  }
  const greens = [];
  for (const [event, failedAt] of lastFailure) {
    const key = `${workflow} ${event}`;
    if (!listCache.has(key)) {
      const path = `repos/${repo}/actions/workflows/${workflow}.yml/runs?branch=main&status=completed&event=${encodeURIComponent(event)}&per_page=${RUNS_PER_PAGE}`;
      listCache.set(key, getJson(gh, path).then((o) => latestDecisiveRun(o?.workflow_runs)));
    }
    const latest = await listCache.get(key);
    if (!latest || latest.conclusion !== 'success') return { reason: `latest ${event} run ${latest ? latest.conclusion : 'missing'}` };
    const at = Date.parse(latest.created_at);
    if (!(at > failedAt && at > Date.parse(issue.createdAt))) return { reason: `no green ${event} run since the failure` };
    greens.push({ ...latest, event });
  }
  return { greens };
}

/**
 * Closes open failure issues whose routine has recovered. Never throws.
 * Returns [{ number, workflow, action: 'closed' | 'would-close' | 'kept', reason?, runs? }].
 */
export async function recover({ repo, gh, dryRun = false, log = console.log, warn = log } = {}) {
  const results = [];
  const api = apiFor(gh);
  let open;
  try {
    open = await listIssuesByLabels(api, { repo, labels: [RECOVERY_LABEL], state: 'open', limit: 500 });
  } catch (err) {
    warn(`recovery: could not list open ${RECOVERY_LABEL} issues: ${short(err)}`);
    return results;
  }
  const ctx = { repo, gh, api, runCache: new Map(), listCache: new Map() };
  for (const issue of open) {
    const filed = filedFailure(issue);
    if (!filed) continue;
    const base = { number: issue.number, workflow: filed.workflow };
    let verdict;
    try {
      verdict = await recoveryVerdict(issue, filed.workflow, ctx);
    } catch (err) {
      warn(`recovery: could not judge #${issue.number} (${filed.workflow}): ${short(err)}`);
      continue;
    }
    if (!verdict.greens) {
      results.push({ ...base, action: 'kept', reason: verdict.reason });
      continue;
    }
    const runs = verdict.greens.map((r) => r.html_url);
    if (dryRun) {
      log(`recovery: would close #${issue.number} (${filed.workflow}) — green ${verdict.greens.map((r) => `${r.event} ${r.html_url}`).join(', ')}`);
      results.push({ ...base, action: 'would-close', runs });
      continue;
    }
    try {
      await gh(['issue', 'close', String(issue.number), '--repo', repo, '--reason', 'completed', '--comment', recoveryComment(filed.workflow, verdict.greens)]);
      log(`recovery: closed #${issue.number} (${filed.workflow})`);
      results.push({ ...base, action: 'closed', runs });
    } catch (err) {
      warn(`recovery: could not close #${issue.number}: ${short(err)}`);
    }
  }
  return results;
}
