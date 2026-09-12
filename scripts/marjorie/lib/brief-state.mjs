// GH fetch helpers for the Founders' Brief (split out of assemble-brief.mjs,
// M1 audit — file was 449 lines, cap is 300). This is the only module in the
// split that touches the network.

import { gh as ghRun } from '../../lib/gh.mjs';
import { checkRunners, loadRunnerCadence } from '../standing-checks.mjs';
import { readCurrentDone, readDoneHistory } from '../done-history.mjs';
import { readOpenActions } from '../human-actions.mjs';
import { fetchContentShipped } from '../content-shipped.mjs';
import { fetchSubmissionCounts } from './submissions.mjs';
import { buildTreeLines } from './tree-line.mjs';
import { DAY_MS } from './brief-sections.mjs';

const REPO = 'JW-Incorporated/swift2';

export async function gh(args) {
  const { stdout } = await ghRun(args);
  return JSON.parse(stdout || '[]');
}

// Same fetch as `gh()`, but also surfaces `capExhausted` — `allPRs` is an
// org-wide, high-volume list a busy day can push past gh.mjs's page cap, and
// `checkRunners` (Site's Vault Run freshness check) must report a runner as
// UNKNOWN rather than a confident DARK when that happens (#3689).
export async function ghWithCompleteness(args) {
  const { stdout, capExhausted } = await ghRun(args);
  return { rows: JSON.parse(stdout || '[]'), capExhausted: Boolean(capExhausted) };
}

// #3689: `gh()` above throws away the `capExhausted` flag gh.mjs computes for
// every list call. Nothing in the current six sections reads a list where a
// silent truncation could hide a founder-facing fact the way it did for the
// old founder-decision bank (that system is gone from this brief entirely —
// see assemble-brief.mjs's header note), but this loud-refusal helper is
// kept, exported and tested as a small, generically useful guard against
// exactly that failure mode, for whichever future source next needs it.
export async function ghCriticalList(args) {
  const { stdout, capExhausted } = await ghRun(args);
  const rows = JSON.parse(stdout || '[]');
  if (capExhausted) {
    throw new Error(
      `assemble-brief: the query \`gh ${args.join(' ')}\` hit gh.mjs's page cap and is INCOMPLETE. ` +
      'Treating a truncated fetch as a complete one is the exact #3689 failure mode — refusing to run ' +
      'rather than post a brief built on a silently short list.',
    );
  }
  return rows;
}

/**
 * One fetch pass for the whole brief. Everything downstream is pure, so this
 * is the only place that touches the network — and the only place that can
 * fail.
 */
export async function fetchState(repo = REPO, { now = Date.now() } = {}) {
  const [
    { rows: allPRs, capExhausted: allPRsCapExhausted },
    alerts,
    dispatched,
    submissions,
  ] = await Promise.all([
    // Org-wide, high-volume list: also feeds Site's Vault Run freshness
    // check via checkRunners, hence ghWithCompleteness (#3689).
    ghWithCompleteness(['pr', 'list', '--repo', repo, '--state', 'all', '--limit', '100', '--json', 'number,title,createdAt,mergedAt,headRefName,state']),
    // `--state all`, not open-only: Since-yesterday's "opened/closed in 24h"
    // line needs issues that already closed inside the window too.
    gh(['issue', 'list', '--repo', repo, '--label', 'watchdog-alert', '--state', 'all', '--limit', '100', '--json', 'number,title,createdAt,closedAt,state']),
    gh(['issue', 'list', '--repo', repo, '--label', 'marjorie-filed', '--state', 'open', '--limit', '200', '--json', 'number,createdAt']),
    fetchSubmissionCounts(repo, { now }),
  ]);

  const contentShipped = await fetchContentShipped(repo, new Date(now - DAY_MS).toISOString()).catch(() => []);

  return {
    allPRs, allPRsCapExhausted,
    alerts,
    dispatched,
    submissions,
    contentShipped,
    treeLines: buildTreeLines({ now }),
    doneItems: readCurrentDone(),
    doneSeries: readDoneHistory(),
    openActions: readOpenActions({ now }),
    cadence: loadRunnerCadence(),
    now,
  };
}

export { checkRunners, REPO };
