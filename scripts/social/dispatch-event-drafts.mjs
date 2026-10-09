#!/usr/bin/env node
// Same-day Tree drafts for time-sensitive events (Bots v2 W8). Finds open
// `intake:` issues no social item covers yet, applies the daily cap and the
// dedupe label, and dispatches routine-tree-event-draft.yml for each pick. An
// issue made with the workflow token fires no `issues` event, so this scan (run
// every two hours, and straight after the news desk files) is the trigger.
//
//   node scripts/social/dispatch-event-drafts.mjs [--dry-run]
//
// Dispatch only — it never writes a queue file, an approval, or a post. The
// dedupe label goes on BEFORE the dispatch and comes off again if the dispatch
// fails, so an event is never run twice and never lost to a transient error.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { listOpenDraftPrs, readPrQueueItems } from './lib/draft-prs.mjs';
import { DISPATCH_LABEL, EVENT_DAILY_CAP, fromRestIssue, pickEvents } from './lib/event-dispatch.mjs';
import { readJsonDir } from './lib/social-fs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVENT_WORKFLOW = 'routine-tree-event-draft.yml';
const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60_000 });

const firstLine = (err) => String(err?.message ?? err).split('\n')[0];

/**
 * Labels (dedupe marker first), then dispatches, each pick. One pick's failure —
 * including a failed rollback of its label — never aborts the rest.
 */
export function dispatchPicks(run, picks, { dryRun = false, log = console.log } = {}) {
  for (const pick of picks) {
    log(`  dispatch #${pick.number}: ${pick.title.slice(0, 100)}`);
    if (dryRun) continue;
    try {
      run(['label', 'create', DISPATCH_LABEL, '--color', 'ededed', '--description', 'Machine-only: a same-day Tree event draft was dispatched for this intake issue']);
    } catch {
      /* already exists */
    }
    try {
      run(['issue', 'edit', String(pick.number), '--add-label', DISPATCH_LABEL]);
      run(['workflow', 'run', EVENT_WORKFLOW, '--ref', 'main', '-f', `issue=${pick.number}`]);
    } catch (err) {
      try {
        run(['issue', 'edit', String(pick.number), '--remove-label', DISPATCH_LABEL]);
        log(`::warning::dispatch-event-drafts: dispatching ${EVENT_WORKFLOW} for #${pick.number} failed — label removed so the next scan retries (${firstLine(err)})`);
      } catch (rollbackErr) {
        log(`::warning::dispatch-event-drafts: #${pick.number} failed (${firstLine(err)}) and its label could not be removed (${firstLine(rollbackErr)}) — it stays marked and is not retried; remaining picks continue`);
      }
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const nowMs = Date.now();
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const repo = process.env.GITHUB_REPOSITORY || JSON.parse(gh(['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;

  // REST, not `gh issue list`: only REST carries author_association, which the trust check needs.
  const issues = JSON.parse(gh(['api', `repos/${repo}/issues?labels=intake&state=open&per_page=50`])).map(fromRestIssue).filter(Boolean);
  const dispatchedToday = JSON.parse(gh(['issue', 'list', '--label', DISPATCH_LABEL, '--state', 'all', '--search', `updated:>=${today}`, '--limit', '20', '--json', 'number'])).length;
  const social = path.join(ROOT, 'social');
  const drafts = listOpenDraftPrs(gh).flatMap((pr) => readPrQueueItems(gh, repo, pr)).filter((i) => i.data);
  const socialItems = [...(await readJsonDir(path.join(social, 'posted'))), ...(await readJsonDir(path.join(social, 'queue'))), ...drafts];

  const { picks, skipped } = pickEvents({ issues, socialItems, nowMs, dispatchedToday });
  console.log(`dispatch-event-drafts${dryRun ? ' (dry run)' : ''}: ${issues.length} open intake issue(s), ${dispatchedToday}/${EVENT_DAILY_CAP} dispatched today, ${picks.length} to dispatch`);
  const old = skipped.filter((s) => s.why.startsWith('older than'));
  if (old.length) console.log(`  ${old.length} older intake issue(s) outside the window`);
  for (const s of skipped.filter((x) => !x.why.startsWith('older than'))) console.log(`  skip #${s.number}: ${s.why}`);
  dispatchPicks(gh, picks, { dryRun });
  return 0;
}

if (process.argv[1]?.endsWith('dispatch-event-drafts.mjs')) runMain(main, { name: 'dispatch-event-drafts' });
