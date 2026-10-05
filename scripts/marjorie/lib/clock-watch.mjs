// M7 clock coverage: both the poll and alarm consume this same verdict.
import { execFileSync } from 'node:child_process';

export const POLL_WORKFLOW = 'bot-chat-poll.yml';
export const CLOCK_TITLE = 'Clock is not firing';
export const SLOT_MS = 5 * 60_000;
export const GRACE_MS = 30 * 60_000;
const HOUR_MS = 60 * 60_000;
export const validSince = (since, now) => typeof since === 'string' && Number.isFinite(Date.parse(since)) && Date.parse(since) <= now;

export function gapVerdict({ runs, now, since }) {
  const start = Math.max(now - HOUR_MS, validSince(since, now) ? Date.parse(since) + GRACE_MS : -Infinity);
  const end = now - 10 * 60_000;
  const missed = [];
  let checked = 0;
  const served = new Set(runs.filter((r) => r.head_branch === 'main' && ['schedule', 'workflow_dispatch'].includes(r.event))
    .map((r) => Math.floor(Date.parse(r.created_at) / SLOT_MS) * SLOT_MS));
  for (let slot = Math.ceil(start / SLOT_MS) * SLOT_MS; slot <= end; slot += SLOT_MS) {
    checked += 1;
    if (!served.has(slot)) missed.push(new Date(slot).toISOString());
  }
  return { ok: true, alert: missed.length >= 2, checked, missed, validSince: validSince(since, now) };
}

// No subprocess error/body is exposed: gh may include private data in errors.
export function ghJson(execImpl, endpoint) {
  return JSON.parse(execImpl('gh', ['api', '--method', 'GET', endpoint], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000, maxBuffer: 8 * 1024 * 1024,
  }));
}

export function readVerdict({ execImpl = execFileSync, repo, now = Date.now(), since }) {
  try {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('repo');
    const created = encodeURIComponent(`>=${new Date(now - HOUR_MS).toISOString()}`);
    const data = ghJson(execImpl, `repos/${repo}/actions/workflows/${POLL_WORKFLOW}/runs?branch=main&created=${created}&per_page=100`);
    if (!Array.isArray(data.workflow_runs) || !Number.isInteger(data.total_count) || data.total_count !== data.workflow_runs.length ||
      data.workflow_runs.some((r) => !r || !Number.isFinite(Date.parse(r.created_at)) || typeof r.head_branch !== 'string' || typeof r.event !== 'string')) throw new Error('history');
    return gapVerdict({ runs: data.workflow_runs, now, since });
  } catch {
    return { ok: false, alert: false, checked: 0, missed: [], validSince: validSince(since, now) };
  }
}

export function readOpenClockAlert({ execImpl = execFileSync, repo }) {
  try {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('repo');
    for (let page = 1; page <= 10; page += 1) {
      const issues = ghJson(execImpl, `repos/${repo}/issues?state=open&labels=watchdog-alert&per_page=100&page=${page}`);
      if (!Array.isArray(issues) || issues.some((issue) => !issue || typeof issue.title !== 'string')) throw new Error('issues');
      if (issues.some((issue) => !issue.pull_request && issue.title === CLOCK_TITLE)) return { ok: true, open: true };
      if (issues.length < 100) return { ok: true, open: false };
    }
    throw new Error('page cap');
  } catch {
    return { ok: false, open: false };
  }
}

export function clockBody(verdict, now) {
  return [CLOCK_TITLE, '', `Poll coverage check: ${verdict.missed.length} five-minute slots were not served on main.`, '',
    '- stage: `clock-silent`', `- checked at: ${new Date(now).toISOString()}`,
    `- slots checked: ${verdict.checked}`, `- missed slots: ${verdict.missed.join(', ') || 'none'}`,
    `- activation timestamp valid: ${verdict.validSince}`, '',
    'Any main poll run serves its slot, including a GitHub cron or manual dispatch.',
    'If both the host clock and GitHub cron are dead, detection waits for a surviving cron.',
    'Check the longlive-doorbell service (docs/ops/doorbell.md). The standing alert remains open until coverage recovers.',
  ].join('\n');
}

export function clockRecoveryBody(verdict, now) {
  return [CLOCK_TITLE, '', 'Poll coverage recovered below the alert threshold on main.', '',
    '- stage: `clock-silent`', `- checked at: ${new Date(now).toISOString()}`,
    `- slots checked: ${verdict.checked}`, `- missed slots: ${verdict.missed.join(', ') || 'none'}`,
    `- activation timestamp valid: ${verdict.validSince}`, '',
    'The standing clock alert can close. A later coverage gap will open a new incident and notify again.',
  ].join('\n');
}

export function watchClock({ execImpl = execFileSync, repo, now = Date.now(), since, dryRun = false, log = console.log }) {
  const verdict = readVerdict({ execImpl, repo, now, since });
  if (!verdict.ok) { log('::warning::clock watch: run history unreadable'); return verdict; }
  if (dryRun) { log(verdict.alert ? clockBody(verdict, now) : clockRecoveryBody(verdict, now)); return verdict; }
  try {
    // REST issue pages are authoritative here; search indexing can lag an upsert.
    const issue = readOpenClockAlert({ execImpl, repo });
    if (!issue.ok) throw new Error('issues');
    if (issue.open === verdict.alert) return verdict;
    const action = verdict.alert ? 'open' : 'close';
    execImpl('gh', ['workflow', 'run', 'bot-chat-alarm.yml', '--repo', repo, '--ref', 'main', '-f', 'stage=clock-silent'],
      { stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000 });
    log(`clock watch: dispatched clock-silent to ${action} the standing alert`);
    return verdict;
  } catch {
    log('::warning::clock watch: alert lookup or dispatch failed');
    return { ...verdict, ok: false };
  }
}
