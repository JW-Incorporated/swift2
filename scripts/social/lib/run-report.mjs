// Pure reporting logic for the social poster — kept separate from the
// network/filesystem code in post-queue.mjs so it's unit-testable.
//
// Why this exists (2026-08-11): between 2026-07-21 and 2026-08-04, twelve
// queue items — eleven X (hard 403 from X's API) and one Instagram (issue
// #1897) — exhausted their 3 attempts and were moved to social/failed/, and
// EVERY one of those social-poster runs
// finished green. The only trace was a console.error line buried in an Action
// log nobody reads, and a queue-state PR whose body was fixed boilerplate
// ("see the run log for what happened to each item"). Proof:
// https://github.com/JW-Incorporated/swift2/actions/runs/30981473515 —
// conclusion `success`, log line "2026-08-04-mine-rush-release-x.json failed 3
// times, moved to social/failed/". X was dark for two weeks before anyone
// asked. A failure that costs nothing to ignore gets ignored, so this module
// makes the poster's outcome an artifact: a summary the run page, the PR body
// and the exit code all carry.

/** Outcome kinds, in the order they're summarised. */
export const OUTCOME = {
  POSTED: 'posted',
  RETRYING: 'retrying',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

/**
 * True if this run contains an outcome that must turn the Action red.
 *
 * Only permanent failures (an item that burned all its attempts and landed in
 * social/failed/) qualify. A mid-retry attempt is genuinely transient — the
 * item is still queued and the next run picks it up — and reddening every
 * half-hourly run for one would train everyone to ignore the signal, which is
 * the exact failure mode this module exists to fix. A `skipped` item (the
 * generic era-art guard) is a deliberate authoring block, not a delivery
 * failure.
 */
export function hasBlockingFailure(outcomes) {
  return outcomes.some((o) => o.kind === OUTCOME.FAILED);
}

/** Groups outcomes by kind, preserving input order within each group. */
export function groupOutcomes(outcomes) {
  const groups = { posted: [], retrying: [], failed: [], skipped: [] };
  for (const outcome of outcomes) groups[outcome.kind]?.push(outcome);
  return groups;
}

/**
 * One-line headline, e.g.
 * `2 posted (instagram 1, x 1) · 1 PERMANENTLY FAILED (x 1) · 1 retrying (x 1)`.
 * Zero-count segments are omitted; an all-clear run reads `nothing due`.
 */
export function summarizeRun(outcomes) {
  if (outcomes.length === 0) return 'nothing due';
  const groups = groupOutcomes(outcomes);
  const segments = [];
  const push = (label, items) => {
    if (items.length) segments.push(`${items.length} ${label} (${platformBreakdown(items)})`);
  };
  push('posted', groups.posted);
  push('PERMANENTLY FAILED', groups.failed);
  push('retrying', groups.retrying);
  push('skipped', groups.skipped);
  return segments.join(' · ');
}

function platformBreakdown(items) {
  const counts = new Map();
  for (const item of items) counts.set(item.platform, (counts.get(item.platform) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([platform, n]) => `${platform} ${n}`)
    .join(', ');
}

/**
 * Markdown report for the run page's job summary and the queue-state PR body.
 * Leads with the bad news: a reader who only sees the first line must be able
 * to tell whether anything is broken.
 */
export function formatReportMarkdown(outcomes, { runUrl } = {}) {
  const groups = groupOutcomes(outcomes);
  const lines = [`**social-poster: ${summarizeRun(outcomes)}**`, ''];

  if (groups.failed.length) {
    lines.push(
      `### ⛔ ${groups.failed.length} post${groups.failed.length === 1 ? '' : 's'} permanently failed — NOT published, will not retry`,
      '',
      'These items burned all their attempts and moved to `social/failed/`. They are gone from the schedule until a human requeues them.',
      '',
    );
    for (const outcome of groups.failed) {
      lines.push(`- \`${outcome.file}\` (${outcome.platform}) — ${outcome.error}`);
    }
    lines.push('');
  }

  if (groups.retrying.length) {
    lines.push(`### ⚠️ ${groups.retrying.length} retrying`, '');
    for (const outcome of groups.retrying) {
      lines.push(
        `- \`${outcome.file}\` (${outcome.platform}) attempt ${outcome.attempts} — ${outcome.error}`,
      );
    }
    lines.push('');
  }

  if (groups.skipped.length) {
    lines.push(`### ⏭️ ${groups.skipped.length} skipped (left in the queue, no attempt spent)`, '');
    for (const outcome of groups.skipped) {
      lines.push(`- \`${outcome.file}\` (${outcome.platform}) — ${outcome.error}`);
    }
    lines.push('');
  }

  if (groups.posted.length) {
    lines.push(`### ✅ ${groups.posted.length} posted`, '');
    for (const outcome of groups.posted) {
      lines.push(`- \`${outcome.file}\` (${outcome.platform}) — ${outcome.url}`);
    }
    lines.push('');
  }

  if (outcomes.length === 0) lines.push('Nothing was due this run.', '');
  if (runUrl) lines.push(`[Full run log](${runUrl})`, '');
  return lines.join('\n');
}

/**
 * GitHub Actions annotation lines (`::error::` / `::warning::`) so failures
 * show up on the run page and the Checks tab, not just in the raw log.
 */
export function formatAnnotations(outcomes) {
  const groups = groupOutcomes(outcomes);
  return [
    ...groups.failed.map(
      (o) =>
        `::error title=social-poster: ${o.platform} post permanently failed::${o.file} exhausted all attempts and was NOT published — ${o.error}`,
    ),
    ...groups.retrying.map(
      (o) =>
        `::warning title=social-poster: ${o.platform} post retrying::${o.file} attempt ${o.attempts} failed — ${o.error}`,
    ),
    ...groups.skipped.map(
      (o) => `::warning title=social-poster: post skipped::${o.file} — ${o.error}`,
    ),
  ];
}
