#!/usr/bin/env node
// Fallback clock for bot-failure-triage.yml's SWEEP (docs/decisions.md 2026-10-05,
// BOTS-LOOP). GitHub drops most scheduled runs in this repo, including that
// workflow's own cron, so bot-chat-poll.yml (5-minute clock) and watchdog.yml
// (backup) call this: it dispatches the sweep unless one started under 25
// minutes ago. Never fails its host job: a gh error is a ::warning:: and exit 0.
//
//   GH_TOKEN=... node scripts/marjorie/dispatch-triage-sweep.mjs [--repo owner/name]
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const WORKFLOW = 'bot-failure-triage.yml';
export const MIN_GAP_MS = 25 * 60_000;

const defaultGh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 });

export function dispatchSweep({ gh = defaultGh, repo, now = Date.now(), log = console.log } = {}) {
  try {
    const out = gh(['run', 'list', '--repo', repo, '--workflow', WORKFLOW, '--limit', '20', '--json', 'createdAt,event']);
    // workflow_run-event runs are created on every routine completion (even when the job is skipped); only sweep starts count.
    const last = JSON.parse(out || '[]').find((r) => r.event === 'schedule' || r.event === 'workflow_dispatch')?.createdAt;
    if (last) {
      const ageMs = now - Date.parse(last);
      if (ageMs < MIN_GAP_MS) {
        log(`last triage run ${Math.floor(ageMs / 60_000)}m ago (<25m) - skipping dispatch`);
        return 'skipped';
      }
    }
    gh(['workflow', 'run', WORKFLOW, '--repo', repo, '--ref', 'main']);
    log(`dispatched bot-failure-triage sweep (last run: ${last ?? 'none'})`);
    return 'dispatched';
  } catch (err) {
    log(`::warning::triage sweep dispatch failed: ${String(err?.stderr || err?.message || err).trim().split('\n')[0]}`);
    return 'error';
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const i = process.argv.indexOf('--repo');
  const repo = (i > 0 && process.argv[i + 1]) || process.env.REPO || process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
  dispatchSweep({ repo });
  process.exit(0);
}
