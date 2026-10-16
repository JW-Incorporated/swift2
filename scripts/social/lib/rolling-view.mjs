// Issue #5885: read the poster's retry state from the rolling state branch
// tip, not only from main's (possibly stale) view. Runs BEFORE
// post-queue.mjs and touches nothing but the local checkout:
//   1. social/posted|failed records on the rolling tip are overlaid
//      ADDITIVELY (never overwrite, never delete a local record);
//   2. any social/queue file whose name now also appears in posted/ or
//      failed/ is dropped from the checkout, so the poster cannot retry an
//      item a recent run already posted or retired. This is the same
//      "remove the queue file" the P0-05 invariant asks a human to do.
// Queue contents are never copied from the tip (a founder edit on main must
// win). No rolling branch -> main's view, unchanged. Any git error throws:
// the run fails loudly before anything can be posted.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const LEDGER_DIRS = ['social/posted', 'social/failed'];

const run = (cwd, args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

function lsRemoteHasBranch(cwd, remote, branch) {
  try {
    run(cwd, ['ls-remote', '--exit-code', '--heads', remote, branch]);
    return true;
  } catch (err) {
    if (err.status === 2) return false;
    throw new Error(`rolling-view: could not read ${branch} from ${remote} (${String(err.stderr ?? err.message).trim()})`, { cause: err });
  }
}

const jsonNames = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : []);

/** @returns {{mode: 'main-only'|'rolling', overlaid: string[], dropped: string[]}} */
export function applyRollingView({ cwd, branch, remote = 'origin', log = console.log }) {
  if (!lsRemoteHasBranch(cwd, remote, branch)) {
    log(`rolling-view: ${branch} does not exist — main's view is the whole view.`);
    return { mode: 'main-only', overlaid: [], dropped: [] };
  }
  const ref = `refs/remotes/${remote}/${branch}`;
  try {
    run(cwd, ['fetch', '--quiet', '--depth=1', remote, `+refs/heads/${branch}:${ref}`]);
  } catch (err) {
    throw new Error(`rolling-view: could not fetch ${branch} (${String(err.stderr ?? err.message).trim()})`, { cause: err });
  }
  const overlaid = [];
  for (const dir of LEDGER_DIRS) {
    let listed;
    try {
      listed = run(cwd, ['ls-tree', '--name-only', ref, `${dir}/`]).toString('utf8').split('\n').filter((p) => p.endsWith('.json'));
    } catch (err) {
      throw new Error(`rolling-view: could not list ${dir} on ${branch} (${String(err.stderr ?? err.message).trim()})`, { cause: err });
    }
    for (const rel of listed) {
      const dest = path.join(cwd, rel);
      if (existsSync(dest)) continue;
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(dest, run(cwd, ['show', `${ref}:${rel}`]));
      overlaid.push(rel);
    }
  }
  const settled = new Set(LEDGER_DIRS.flatMap((d) => jsonNames(path.join(cwd, d))));
  const dropped = jsonNames(path.join(cwd, 'social/queue')).filter((f) => settled.has(f));
  for (const f of dropped) rmSync(path.join(cwd, 'social/queue', f));
  log(`rolling-view: overlaid ${overlaid.length} posted/failed record(s) from ${branch}; dropped ${dropped.length} already-settled queue item(s)${dropped.length ? `: ${dropped.join(' ')}` : ''}.`);
  return { mode: 'rolling', overlaid, dropped };
}
