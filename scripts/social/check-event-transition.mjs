#!/usr/bin/env node
// Social event-mode transition trigger (t_4ebbe8ba, card step 7 —
// implementing t_60c73aaa's approved design's mid-week trigger). Runs
// event-status.mjs, hash-diffs its transition-relevant fields against the
// last-seen value (SAME hash-diff technique the site-diff adapter uses for
// countdown detection, per the design's own instruction — see
// apps/worker/src/sources/site-diff.ts's header), and on a normal<->event
// (or wind-down) transition, dispatches routine-tree-weekly-plan.yml with
// mode=replan so the calendar picks up the new state immediately instead
// of waiting for next Monday.
//
// State lives in a committed repo file (social/state/event-status.json),
// not a DB row — this workflow has no Supabase write path of its own and
// doesn't need one; the file is small, append-free (overwritten in place),
// and reviewed the same way growth-snapshot.yml's metrics commits are.
//
// No new approval gate: this only ever dispatches a REPLAN, which produces
// a draft calendar PR a founder still reviews — the founder ✅ gate on
// every actual post (social-approval-poll.mjs) is completely untouched
// (card step 7, Founder D3=A).
//
//   node scripts/social/check-event-transition.mjs [--dry-run]
//
// Exits 0 whether or not a transition fired; only a genuine failure (can't
// read/write state, event-status.mjs itself errors) is a non-zero exit —
// this runs unattended on a schedule and a "nothing changed" tick must
// never redden the job.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { runMain } from '../lib/cli.mjs';
import { transitionKey } from './lib/event-status.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE_FILE = path.join(ROOT, 'social', 'state', 'event-status.json');

export async function readLastState(file = STATE_FILE) {
  try {
    return JSON.parse(await readFile(file, 'utf-8'));
  } catch {
    return null;
  }
}

export async function writeState(status, file = STATE_FILE) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(status, null, 2)}\n`, 'utf-8');
}

/** Runs event-status.mjs as a child process (tsx, since it imports .ts
 * files) and parses its one JSON line. Separate from lib/event-status.mjs's
 * pure functions so this stays a thin, testable-by-injection wrapper —
 * tests pass a fake `runEventStatus` rather than actually spawning tsx. */
export function runEventStatusCli() {
  const scriptPath = path.join(ROOT, 'scripts', 'social', 'event-status.mjs');
  const out = execFileSync(
    process.execPath,
    [path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), scriptPath],
    { encoding: 'utf-8' },
  );
  const lastLine = out.trim().split('\n').filter(Boolean).pop();
  return JSON.parse(lastLine);
}

/** Pure decision: given the previous and current status, does this tick
 * need a replan dispatch? True exactly when their transitionKey differs —
 * heat/daysToResolution churn between runs never fires this on its own. */
export function transitioned(previousStatus, currentStatus) {
  if (!previousStatus) return true; // first-ever run always establishes a baseline
  return transitionKey(previousStatus) !== transitionKey(currentStatus);
}

function dispatchReplan({ repo, ghToken }) {
  execFileSync(
    'gh',
    ['workflow', 'run', 'routine-tree-weekly-plan.yml', '--repo', repo, '-f', 'mode=replan'],
    {
      env: { ...process.env, GH_TOKEN: ghToken },
      stdio: 'inherit',
    },
  );
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const current = runEventStatusCli();
  const previous = await readLastState();

  const fired = transitioned(previous, current);
  console.log(
    `[check-event-transition] previous=${previous ? transitionKey(previous) : '(none)'} current=${transitionKey(current)} fired=${fired}`,
  );

  if (fired && !dryRun) {
    const repo = process.env.GITHUB_REPOSITORY;
    const ghToken = process.env.GH_DISPATCH_TOKEN;
    if (!repo || !ghToken) {
      console.log(
        '[check-event-transition] GITHUB_REPOSITORY/GH_DISPATCH_TOKEN not set — skipping the replan dispatch (local/dry run).',
      );
    } else {
      dispatchReplan({ repo, ghToken });
      console.log(
        `[check-event-transition] dispatched routine-tree-weekly-plan.yml mode=replan (transition: ${previous ? transitionKey(previous) : '(none)'} -> ${transitionKey(current)})`,
      );
    }
  }

  if (!dryRun) await writeState(current);
  return 0;
}

// Only run when invoked directly as a CLI (`node check-event-transition.mjs`
// or `npx tsx check-event-transition.mjs`) — NOT on import. Without this
// guard, importing this module's pure helpers for unit tests
// (check-event-transition.test.ts) would also execute `main()`, spawning a
// real tsx subprocess and attempting a real state read/write/dispatch as a
// side effect of loading the file. Same convention scripts/lib/cli.mjs's
// own header implies (`runMain` is meant to wrap a script's own entry
// point) but current-feed.ts-adjacent scripts in this repo don't yet all
// state it explicitly, so it's spelled out here.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMain(main, { name: 'check-event-transition' });
}
