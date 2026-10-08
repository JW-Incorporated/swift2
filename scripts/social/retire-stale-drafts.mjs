#!/usr/bin/env node
// Retires social-draft PRs that sat unapproved past 48h (Bots v2 W8).
//
// Why a separate sweep: the poster's 48h rule (post-queue.mjs) retires items in
// `social/queue/` on main, and social-approval-poll.mjs only ever stamps and
// merges — nothing closes an UNMERGED draft, so six dated daily PRs sat open for
// up to ten days (#4471…#4574) and kept their photos and slots hostage. This is
// that missing step. It closes with a `retired:` comment (deliberately not
// `reject:` — retirement is not a verdict, so the drafter learns nothing from it
// and the "closed without a reason" backstop accepts it). It never merges,
// approves, stamps or touches a queue file.
//
//   node scripts/social/retire-stale-drafts.mjs            # dry run: prints what it would close
//   node scripts/social/retire-stale-drafts.mjs --apply    # closes them (the daily-draft workflow only)
import { execFileSync } from 'node:child_process';
import { runMain } from '../lib/cli.mjs';
import { STALE_DRAFT_HOURS, listOpenDraftPrs, readDraftPr, readPrQueueItems, staleReason } from './lib/draft-prs.mjs';
import { isMain } from '../lib/is-main.mjs';

export const MAX_RETIRED_PER_RUN = 12;
export const RETIRED_PREFIX = 'retired:';

export const retiredComment = (reason) =>
  `${RETIRED_PREFIX} ${reason} — past the ${STALE_DRAFT_HOURS}h window the poster applies to every queued item, so this draft is closed unmerged. ` +
  'This is housekeeping, not a rejection: nothing in it was judged. The daily draft re-queues the slot if it is still live.';

/** Decides (and, with `apply`, performs) the retirements. `runGh(args) -> stdout`. */
export function sweep(runGh, { repo, nowMs, apply = false, hours = STALE_DRAFT_HOURS }) {
  const decisions = [];
  for (const pr of listOpenDraftPrs(runGh)) {
    const reason = staleReason(pr, readPrQueueItems(runGh, repo, pr), nowMs, hours);
    if (!reason) {
      decisions.push({ pr: pr.number, retire: false });
      continue;
    }
    const retire = decisions.filter((d) => d.retire).length < MAX_RETIRED_PER_RUN;
    if (retire && apply) {
      // The list is minutes old: re-read the PR and re-decide from fresh labels, head and stamps, so an
      // approval stamped (or a hold added) since the list is never closed over. A Discord ✅ the poll has
      // not stamped yet is not knowable here (the workflow holds no bot token); the stamp is what counts.
      const fresh = readDraftPr(runGh, pr.number);
      const again = fresh ? staleReason(fresh, readPrQueueItems(runGh, repo, fresh), nowMs, hours) : null;
      if (!again) {
        decisions.push({ pr: pr.number, retire: false, changed: true });
        continue;
      }
      runGh(['pr', 'close', String(pr.number), '--comment', retiredComment(again)]);
    }
    decisions.push({ pr: pr.number, retire, reason, createdAt: pr.createdAt });
  }
  return decisions;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const run = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60_000 });
  const repo = process.env.GITHUB_REPOSITORY || JSON.parse(run(['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;
  const decisions = sweep(run, { repo, nowMs: Date.now(), apply });
  const retiring = decisions.filter((d) => d.retire);
  console.log(`retire-stale-drafts (${apply ? 'APPLIED' : 'dry run'}): ${decisions.length} open social-draft PR(s), ${retiring.length} ${apply ? 'closed' : 'would be closed'}`);
  for (const d of retiring) console.log(`  #${d.pr} — ${d.reason} (opened ${d.createdAt})`);
  return 0;
}

if (process.argv[1]?.endsWith('retire-stale-drafts.mjs') || isMain(import.meta.url, process.argv[1])) {
  runMain(main, { name: 'retire-stale-drafts' });
}
