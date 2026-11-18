// Recovery auto-close for routine-failure issues (scripts/marjorie/routine-failure-triage.mjs).
// Triage files one issue per workflow per UTC day but nothing closed them once the
// routine ran green again: 18 from 2026-10-27/28 sat open for three weeks. Each sweep
// now closes an open failure issue whose workflow's latest decisive main run is a
// success that started after the issue was filed. Plain code, no LLM.
//
// Only issues this script's triage FILED are touched: the `routine-failure` label AND
// the hidden `<!-- routine-failure: <workflow> <day> -->` marker AND the exact title
// triage writes for that marker. Adopted Tree receipts (other titles) and any other
// issue are never closed.
//
//   node scripts/marjorie/routine-failure-triage.mjs --recover --dry-run
import { apiFor, listIssuesByLabels } from './issues-rest.mjs';

export const RECOVERY_LABEL = 'routine-failure';
export const RECOVERY_MARKER = '<!-- routine-failure-recovered -->';
const MARKER_RE = /<!-- routine-failure: ([a-z0-9][a-z0-9-]*) (\d{4}-\d{2}-\d{2}) -->/;
// A run that never did anything says nothing about recovery; a cancelled one may be a timeout, so it blocks.
const IGNORED_CONCLUSIONS = new Set(['skipped', 'neutral']);
const RUNS_PER_PAGE = 20;

const short = (err) => String(err?.message || err).split('\n')[0].slice(0, 160);

/** { workflow, day } iff this issue is one triage filed (label + marker + exact title); else null. */
export function filedFailure(issue) {
  if (!(issue.labels || []).some((l) => l.name === RECOVERY_LABEL)) return null;
  const m = MARKER_RE.exec(String(issue.body ?? ''));
  if (!m) return null;
  const [, workflow, day] = m;
  return issue.title === `routine failure: ${workflow} ${day}` ? { workflow, day } : null;
}

/** Newest completed main run that actually ran (skipped/neutral ignored), or null. */
export function latestDecisiveRun(runs) {
  return (runs || []).find((r) => !IGNORED_CONCLUSIONS.has(r.conclusion)) ?? null;
}

export function recoveryComment(workflow, run) {
  return `Recovered: \`${workflow}\` ran green on main at ${run.updated_at ?? run.created_at} — ${run.html_url}. Closed automatically by routine-failure-triage.\n\n${RECOVERY_MARKER}`;
}

/**
 * Closes open failure issues whose routine has recovered. Never throws.
 * Returns [{ number, workflow, action: 'closed' | 'would-close' | 'kept', reason?, run? }].
 */
export async function recover({ repo, gh, dryRun = false, log = console.log, warn = log } = {}) {
  const results = [];
  let open;
  try {
    open = await listIssuesByLabels(apiFor(gh), { repo, labels: [RECOVERY_LABEL], state: 'open', limit: 500 });
  } catch (err) {
    warn(`recovery: could not list open ${RECOVERY_LABEL} issues: ${short(err)}`);
    return results;
  }
  const byWorkflow = new Map();
  for (const issue of open) {
    const filed = filedFailure(issue);
    if (!filed) continue;
    if (!byWorkflow.has(filed.workflow)) byWorkflow.set(filed.workflow, []);
    byWorkflow.get(filed.workflow).push(issue);
  }
  for (const [workflow, issues] of byWorkflow) {
    let run;
    try {
      const out = JSON.parse(String((await gh(['api', `repos/${repo}/actions/workflows/${workflow}.yml/runs?branch=main&status=completed&per_page=${RUNS_PER_PAGE}`])).stdout || '{}'));
      run = latestDecisiveRun(out.workflow_runs);
    } catch (err) {
      warn(`recovery: could not list runs for ${workflow}: ${short(err)}`);
      continue;
    }
    for (const issue of issues) {
      const base = { number: issue.number, workflow };
      if (!run || run.conclusion !== 'success') {
        results.push({ ...base, action: 'kept', reason: run ? `latest run ${run.conclusion}` : 'no completed run' });
        continue;
      }
      if (!(Date.parse(run.created_at) > Date.parse(issue.createdAt))) {
        results.push({ ...base, action: 'kept', reason: 'no green run since the issue was filed' });
        continue;
      }
      if (dryRun) {
        log(`recovery: would close #${issue.number} (${workflow}) — green run ${run.html_url}`);
        results.push({ ...base, action: 'would-close', run: run.html_url });
        continue;
      }
      try {
        await gh(['issue', 'close', String(issue.number), '--repo', repo, '--reason', 'completed', '--comment', recoveryComment(workflow, run)]);
        log(`recovery: closed #${issue.number} (${workflow}) — green run ${run.html_url}`);
        results.push({ ...base, action: 'closed', run: run.html_url });
      } catch (err) {
        warn(`recovery: could not close #${issue.number}: ${short(err)}`);
      }
    }
  }
  return results;
}
