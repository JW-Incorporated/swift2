#!/usr/bin/env node
// Table-driven clock for the frequent workflows GitHub's cron keeps dropping
// (docs/decisions.md 2026-10-06 "Clock dispatch table"). bot-chat-poll.yml's
// 5-minute poll (primary) and watchdog.yml's backup job call this: for each
// entry in clock-table.json it dispatches the workflow on main unless a
// `schedule` or `workflow_dispatch` run started within minGapMinutes.
// One entry's gh error never stops the others; the script always exits 0.
//
//   GH_TOKEN=... node scripts/ops/clock-dispatch.mjs [--repo owner/name]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const TABLE = JSON.parse(readFileSync(new URL('./clock-table.json', import.meta.url), 'utf8'));

const defaultGh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 });

const firstLine = (err) => String(err?.stderr || err?.message || err).trim().split('\n')[0];

export function dispatchOne(entry, { gh, repo, now, log }) {
  const { workflow, minGapMinutes, inputs = {} } = entry;
  try {
    const out = gh(['run', 'list', '--repo', repo, '--workflow', workflow, '--limit', '20', '--json', 'createdAt,event']);
    // workflow_run-event runs are not clock starts; only schedule/workflow_dispatch runs count.
    const last = JSON.parse(out || '[]').find((r) => r.event === 'schedule' || r.event === 'workflow_dispatch')?.createdAt;
    if (last) {
      const ageMs = now - Date.parse(last);
      if (ageMs < minGapMinutes * 60_000) {
        log(`${workflow}: last run ${Math.floor(ageMs / 60_000)}m ago (<${minGapMinutes}m) - skipping`);
        return 'skipped';
      }
    }
    const fields = Object.entries(inputs).flatMap(([k, v]) => ['-f', `${k}=${v}`]);
    gh(['workflow', 'run', workflow, '--repo', repo, '--ref', 'main', ...fields]);
    log(`${workflow}: dispatched (last run: ${last ?? 'none'})`);
    return 'dispatched';
  } catch (err) {
    const msg = firstLine(err);
    const unknown = /HTTP 404|could not find any workflows/i.test(msg);
    log(`::warning::clock dispatch of ${workflow} failed${unknown ? ' (unknown workflow?)' : ''}: ${msg}`);
    return 'error';
  }
}

export function clockDispatch({ gh = defaultGh, repo, now = Date.now(), log = console.log, table = TABLE } = {}) {
  return table.map((entry) => ({ workflow: entry.workflow, result: dispatchOne(entry, { gh, repo, now, log }) }));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const i = process.argv.indexOf('--repo');
  const repo = (i > 0 && process.argv[i + 1]) || process.env.REPO || process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
  try {
    clockDispatch({ repo });
  } catch (err) {
    console.log(`::warning::clock dispatch crashed: ${firstLine(err)}`);
  }
  process.exit(0);
}
