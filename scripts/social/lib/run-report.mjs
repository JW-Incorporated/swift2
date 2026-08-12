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
  /** Due, but not publishable yet through no fault of its own — its media is
   * not live on the site yet, so the platform's fetch would 404. Costs no
   * attempt and ships itself once the image PR is merged and deployed. */
  WAITING: 'waiting',
};

/** Past this many hours overdue, a `skipped`/`waiting` item stops being a
 * normal wait and becomes a delivery failure that reddens the run. The lower
 * rung of the escalation ladder: lib/queue.mjs's isStaleDue (48h) then
 * RETIRES the item to social/failed/ a full day after this makes it loud —
 * 24h alerts a human while the item is still recoverable (merge the image PR
 * and it ships), 48h moves it. Kept as its own constant so this module stays
 * free of queue-selection imports. */
export const STUCK_AFTER_HOURS = 24;

/** True for a skipped/waiting outcome that has been in that state long
 * enough to count as broken rather than pending. */
export function isStuck(outcome) {
  return (
    (outcome.kind === OUTCOME.SKIPPED || outcome.kind === OUTCOME.WAITING) &&
    typeof outcome.overdueHours === 'number' &&
    outcome.overdueHours >= STUCK_AFTER_HOURS
  );
}

/**
 * True if this run contains an outcome that must turn the Action red.
 *
 * Permanent failures (an item that burned all its attempts and landed in
 * social/failed/) qualify. A mid-retry attempt is genuinely transient — the
 * item is still queued and the next run picks it up — and reddening every
 * half-hourly run for one would train everyone to ignore the signal, which is
 * the exact failure mode this module exists to fix.
 *
 * A skipped or waiting item ALSO qualifies once it has been stuck for more
 * than STUCK_AFTER_HOURS (2026-08-11). Those two states cost no attempt by
 * design, which means they can never reach social/failed/ through the
 * attempts counter — so an item in one of them was, until now, capable of
 * failing to post FOREVER inside a green run.
 * `social/queue/2026-08-09-august-augustine-ig.json` did exactly that for two
 * days: the era-art repetition guard skipped it every 30 minutes, each run
 * logged an error and exited 0, its X twin published fine, and the founders'
 * brief counted the day as healthy. A wait with no bound and no alarm is
 * indistinguishable from a silent drop; this is the bound. (The 48h isStaleDue
 * rule then retires such an item to social/failed/ a day later — see
 * STUCK_AFTER_HOURS above for the ladder.)
 */
export function hasBlockingFailure(outcomes) {
  return outcomes.some((o) => o.kind === OUTCOME.FAILED || isStuck(o));
}

/** Groups outcomes by kind, preserving input order within each group. */
export function groupOutcomes(outcomes) {
  const groups = { posted: [], retrying: [], failed: [], skipped: [], waiting: [] };
  for (const outcome of outcomes) groups[outcome.kind]?.push(outcome);
  return groups;
}

/** "3h" / "2d 4h", for report lines about how long something has been stuck. */
function formatOverdue(hours) {
  if (typeof hours !== 'number' || hours <= 0) return 'just now';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return rest ? `${days}d ${rest}h` : `${days}d`;
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
  const stuck = [...groups.skipped, ...groups.waiting].filter(isStuck);
  push(`STUCK >${STUCK_AFTER_HOURS}h`, stuck);
  push('skipped', groups.skipped.filter((o) => !isStuck(o)));
  push('waiting on deploy', groups.waiting.filter((o) => !isStuck(o)));
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
 *
 * `abortReason` (optional) marks a run that had due work but stopped before
 * attempting any of it (missing credentials) — it replaces the headline,
 * because "nothing due" would be a lie for such a run.
 */
export function formatReportMarkdown(outcomes, { runUrl, abortReason } = {}) {
  const groups = groupOutcomes(outcomes);
  const lines = abortReason
    ? [
        '**social-poster: ⛔ RUN ABORTED — nothing was attempted**',
        '',
        abortReason,
        '',
      ]
    : [`**social-poster: ${summarizeRun(outcomes)}**`, ''];

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

  const stuck = [...groups.skipped, ...groups.waiting].filter(isStuck);
  if (stuck.length) {
    lines.push(
      `### ⛔ ${stuck.length} item${stuck.length === 1 ? '' : 's'} STUCK more than ${STUCK_AFTER_HOURS}h past schedule — not posted, not failed, going nowhere`,
      '',
      'These are blocked in a state that costs no retry, so they would otherwise sit here indefinitely without ever reaching `social/failed/` (the 48h staleness rule retires them a day from now). Nothing will unblock them on its own — a human has to change the item or the thing blocking it.',
      '',
    );
    for (const outcome of stuck) {
      lines.push(
        `- \`${outcome.file}\` (${outcome.platform}) — overdue ${formatOverdue(outcome.overdueHours)} — ${outcome.error}`,
      );
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

  const skipped = groups.skipped.filter((o) => !isStuck(o));
  if (skipped.length) {
    lines.push(`### ⏭️ ${skipped.length} skipped (left in the queue, no attempt spent)`, '');
    for (const outcome of skipped) {
      lines.push(`- \`${outcome.file}\` (${outcome.platform}) — ${outcome.error}`);
    }
    lines.push('');
  }

  const waiting = groups.waiting.filter((o) => !isStuck(o));
  if (waiting.length) {
    lines.push(
      `### ⏳ ${waiting.length} waiting on deploy (media not live yet — no attempt spent)`,
      '',
      'Each of these ships automatically on the first run after its image PR is merged and deployed. Nothing is broken; they are holding, not failing.',
      '',
    );
    for (const outcome of waiting) {
      lines.push(
        `- \`${outcome.file}\` (${outcome.platform}) — waiting ${formatOverdue(outcome.overdueHours)} — ${outcome.error}`,
      );
    }
    lines.push('');
  }

  if (groups.posted.length) {
    lines.push(`### ✅ ${groups.posted.length} posted`, '');
    for (const outcome of groups.posted) {
      lines.push(
        `- \`${outcome.file}\` (${outcome.platform}) — ${outcome.url}` +
          (outcome.facebookError
            ? ` — ⚠️ the Facebook Page cross-post FAILED (the ${outcome.platform} post itself is live): ${outcome.facebookError}`
            : ''),
      );
    }
    lines.push('');
  }

  if (outcomes.length === 0 && !abortReason) lines.push('Nothing was due this run.', '');
  if (runUrl) lines.push(`[Full run log](${runUrl})`, '');
  return lines.join('\n');
}

/**
 * GitHub Actions annotation lines (`::error::` / `::warning::`) so failures
 * show up on the run page and the Checks tab, not just in the raw log.
 * A posted item whose Facebook cross-post failed gets a warning (the primary
 * post is live, so it must not redden the run — but a Page that quietly stops
 * accepting posts must not be invisible either). An aborted run gets an
 * ::error:: of its own.
 */
export function formatAnnotations(outcomes, { abortReason } = {}) {
  const groups = groupOutcomes(outcomes);
  const held = [...groups.skipped, ...groups.waiting];
  return [
    ...(abortReason
      ? [`::error title=social-poster: run aborted::${abortReason}`]
      : []),
    ...groups.failed.map(
      (o) =>
        `::error title=social-poster: ${o.platform} post permanently failed::${o.file} exhausted all attempts and was NOT published — ${o.error}`,
    ),
    // A stuck item is an ::error::, not a ::warning::. It never spends an
    // attempt, so it can never escalate itself — the annotation is the only
    // escalation it has.
    ...held
      .filter(isStuck)
      .map(
        (o) =>
          `::error title=social-poster: post stuck ${formatOverdue(o.overdueHours)} past schedule::${o.file} has been blocked for ${formatOverdue(o.overdueHours)} and cannot unblock itself — ${o.error}`,
      ),
    ...groups.retrying.map(
      (o) =>
        `::warning title=social-poster: ${o.platform} post retrying::${o.file} attempt ${o.attempts} failed — ${o.error}`,
    ),
    ...groups.skipped
      .filter((o) => !isStuck(o))
      .map((o) => `::warning title=social-poster: post skipped::${o.file} — ${o.error}`),
    ...groups.waiting
      .filter((o) => !isStuck(o))
      .map(
        (o) =>
          `::warning title=social-poster: post waiting on deploy::${o.file} — media not live yet, no attempt spent — ${o.error}`,
      ),
    ...groups.posted
      .filter((o) => o.facebookError)
      .map(
        (o) =>
          `::warning title=social-poster: facebook cross-post failed::${o.file} posted to ${o.platform}, but the Facebook Page cross-post failed — ${o.facebookError}`,
      ),
  ];
}
