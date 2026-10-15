// Social posting-gap watchdog (issue #5881). Deterministic, zero-AI.
//
// WHY THIS EXISTS: watchdog.yml already alarms on the social lane's INPUTS —
// a failed daily-draft run (#5697), a down poster — but nothing watched the
// OUTCOME, "did a post actually land". A lane that drafts, approves and
// dispatches perfectly while every send silently no-ops looks green all the
// way down, and detection waited for the weekly Monday scorecard (which has
// itself died before). This measures the only thing that can't be faked: a
// new file in social/posted/.
//
// The signal is each posted record's own `postedAt` (written by the poster
// when the platform accepted the post), not the filename and not the file
// mtime: ~10% of posted filenames carry no date (`pipeline-test-ig.json`),
// and in a fresh Actions checkout every mtime is clone time, so both of those
// would be wrong.
//
// Usage:
//   node scripts/watchdog/check-posting-gap.mjs --alert-body /tmp/posting-gap.md
//   node scripts/watchdog/check-posting-gap.mjs --tree-ping open|recovered \
//     [--alert-url <url>]
// Exit: 0 = within tolerance, or frozen — caller closes the alert.
//       1 = over the threshold — caller opens the alert.
//       2 = the check itself broke — caller must not report this as "clear".
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { post } from '../marjorie/lib/discord.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
export const POSTED_DIR = join(ROOT, 'social', 'posted');

/** The founder's ask, verbatim: "nothing new in social/posted/ for more than
 * 48h". Strictly greater — exactly 48h is still silent. */
export const GAP_THRESHOLD_HOURS = 48;
/** A `postedAt` an hour or so ahead of the runner's clock is ordinary skew and
 * clamps to zero age. Further ahead than this is a corrupt record, and a
 * corrupt far-future timestamp would otherwise mask a real gap forever — so it
 * is `unknown`, never a pass. */
export const MAX_FUTURE_SKEW_HOURS = 1;
/** Not 'Tree': this line is the watchdog's, and the channel should never read
 * it as something Tree chose to say. */
export const WATCHDOG_WEBHOOK_USERNAME = 'Watchdog';

/** Same semantics as social-poster.yml's own freeze check (set, and neither
 * "false" nor "0"), so the two can never disagree about whether the lane is
 * deliberately stopped. */
export function isFrozen(value) {
  const freeze = String(value ?? '').trim();
  return freeze !== '' && freeze !== 'false' && freeze !== '0';
}

/**
 * Every readable `postedAt` under `dir`, plus the records that carry none.
 * A single unparseable file is skipped rather than failing the whole check —
 * one bad record must not blind the alarm — but it is counted and named in the
 * alert body, because if the skipped record happens to be the newest one the
 * reported gap is an overstatement.
 *
 * Throws if the directory itself cannot be read; that is `unknown`, not zero.
 */
export function readPostedTimestamps(dir = POSTED_DIR, { readDir = readdirSync, readFile = readFileSync } = {}) {
  const entries = [];
  const malformed = [];
  for (const name of readDir(dir).filter((file) => file.endsWith('.json'))) {
    let postedAt;
    try {
      postedAt = JSON.parse(readFile(join(dir, name), 'utf8'))?.postedAt;
    } catch {
      malformed.push(name);
      continue;
    }
    const ms = Date.parse(postedAt ?? '');
    if (Number.isNaN(ms)) {
      malformed.push(name);
      continue;
    }
    entries.push({ name, postedAt: new Date(ms).toISOString(), ms });
  }
  entries.sort((a, b) => a.ms - b.ms || a.name.localeCompare(b.name));
  return { entries, malformed };
}

/**
 * Pure. `{ status: 'frozen' | 'ok' | 'gap' | 'unknown', ... }` — takes
 * already-read entries so it is unit-testable without the filesystem.
 */
export function evaluateGap({
  entries = [],
  malformed = [],
  now = new Date(),
  thresholdHours = GAP_THRESHOLD_HOURS,
  freeze,
} = {}) {
  if (isFrozen(freeze)) {
    return { status: 'frozen', reason: `SOCIAL_FREEZE is set ("${String(freeze).trim()}") — a founder has deliberately stopped the lane. Kill switch, not a fault.` };
  }
  if (entries.length === 0) {
    return {
      status: 'unknown',
      reason: malformed.length
        ? `no record under social/posted/ carries a readable \`postedAt\` (${malformed.length} unreadable: ${malformed.slice(0, 5).join(', ')})`
        : 'social/posted/ holds no posted records at all, so there is no last-post time to measure from',
      malformed,
    };
  }

  // Picked here rather than trusted from the caller's ordering: the newest
  // record is the whole measurement, and a caller that hands over an unsorted
  // list must not be able to turn a healthy lane into a false alarm.
  const newest = entries.reduce((a, b) => (b.ms > a.ms ? b : a));
  const rawHours = (now.getTime() - newest.ms) / 3_600_000;
  if (rawHours < -MAX_FUTURE_SKEW_HOURS) {
    return {
      status: 'unknown',
      reason: `the newest \`postedAt\` (\`${newest.name}\`, ${newest.postedAt}) is ${Math.abs(rawHours).toFixed(1)}h in the future — that record is corrupt, and trusting it would hide a real gap`,
      newest,
      malformed,
    };
  }
  const hours = Math.max(0, rawHours);
  return {
    status: hours > thresholdHours ? 'gap' : 'ok',
    hours,
    newest,
    malformed,
    thresholdHours,
  };
}

/** The alert-issue body, the console line, and the one-line #longlive-tree
 * ping, all from one verdict so the three can never drift. */
export function renderResult(result, { now = new Date(), thresholdHours = GAP_THRESHOLD_HOURS } = {}) {
  const checkedAt = now.toISOString();
  const malformedNote = result.malformed?.length
    ? `\n\n${result.malformed.length} record(s) under social/posted/ carry no readable \`postedAt\` and were skipped (${result.malformed.slice(0, 5).join(', ')}) — if one of those is the newest post, the gap above is an overstatement.`
    : '';

  if (result.status === 'frozen') {
    return {
      exitCode: 0,
      line: `posting-gap: FROZEN — ${result.reason}`,
      body: `No posting-gap alarm while the lane is frozen. ${result.reason} Checked ${checkedAt}.\n`,
      treeLine: null,
    };
  }
  if (result.status === 'ok') {
    const hours = result.hours.toFixed(1);
    return {
      exitCode: 0,
      line: `posting-gap: OK — newest post ${result.newest.postedAt} (${hours}h ago; threshold ${thresholdHours}h).`,
      body: `Social posting is current. Newest post: \`${result.newest.name}\` at ${result.newest.postedAt} (${hours} hours old at ${checkedAt}); the alarm fires above ${thresholdHours} hours.${malformedNote}\n`,
      treeLine: `✅ Posting recovered — a new post landed: \`${result.newest.name}\` at ${result.newest.postedAt} (${hours}h ago). The posting-gap alarm is clear.`,
    };
  }
  if (result.status === 'gap') {
    const hours = result.hours.toFixed(1);
    return {
      exitCode: 1,
      line: `posting-gap: GAP — newest post ${result.newest.postedAt} (${hours}h ago; threshold ${thresholdHours}h).`,
      body: `@sffan15-sys — nothing new has landed in \`social/posted/\` for **${hours} hours** (alarm threshold ${thresholdHours}h, checked ${checkedAt}). Newest post: \`${result.newest.name}\` at ${result.newest.postedAt}.\n\nThe drafting and poster alarms are green-or-silent on this condition by design — they watch the lane's inputs, this watches its outcome. Likely causes, cheapest first: nothing approved in \`social/queue/\` for the poster to send; approvals stamped but the poster's sends failing; a platform token expired. Start at the most recent \`social-poster.yml\` run.\n\nThis alert closes itself the next time a post lands.${malformedNote}\n`,
      treeLine: `⚠️ No new post has landed in \`social/posted/\` for ${hours} hours (threshold ${thresholdHours}h). Newest: \`${result.newest.name}\` at ${result.newest.postedAt}. Check the latest \`social-poster.yml\` run and whether anything is approved in \`social/queue/\`.`,
    };
  }
  return {
    exitCode: 2,
    line: `posting-gap: UNKNOWN — ${result.reason}.`,
    body: `@sffan15-sys — the social posting-gap check could not reach a verdict as of ${checkedAt}: ${result.reason}. This is an alert, not a silent pass — posting liveness is currently unverified.${malformedNote}\n`,
    treeLine: `⚠️ The posting-gap watchdog could not reach a verdict: ${result.reason}. Posting liveness is unverified.`,
  };
}

/** One verdict, from the filesystem and the environment. */
export function checkPostingGap({ dir = POSTED_DIR, env = process.env, now = new Date(), fs: fsDeps } = {}) {
  let read;
  try {
    read = readPostedTimestamps(dir, fsDeps ?? {});
  } catch (error) {
    return renderResult({ status: 'unknown', reason: `social/posted/ could not be read (${error.message})` }, { now });
  }
  return renderResult(evaluateGap({ ...read, now, freeze: env.SOCIAL_FREEZE }), { now });
}

/**
 * The #longlive-tree leg. Sent by the plain watchdog job, never by an agent,
 * and only on a state CHANGE — the caller passes `open` or `recovered` only
 * when `upsert-alert.sh` reported it actually opened or closed an issue, which
 * is the same "never re-ping a standing alert" rule that script applies to
 * #marjorie. No webhook configured is a clean no-op, same as every other
 * Discord leg in this repo.
 */
export async function pingTree(treeLine, { env = process.env, url = '', postImpl = post } = {}) {
  if (!treeLine) return 'nothing-to-send';
  const webhook = env.DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL;
  if (!webhook) {
    console.log('posting-gap: DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL is not configured — no #longlive-tree ping (clean no-op).');
    return 'skipped';
  }
  const text = url ? `${treeLine}\nWatchdog alert: ${url}` : treeLine;
  const result = await postImpl(text, { webhook, username: WATCHDOG_WEBHOOK_USERNAME });
  if (!result?.ok) {
    console.log(`posting-gap: #longlive-tree ping failed (${result?.error ?? result?.status ?? 'unknown'}) — the watchdog-alert issue still carries the alarm.`);
    return 'failed';
  }
  console.log('posting-gap: pinged #longlive-tree.');
  return 'sent';
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const result = checkPostingGap({});
  console.log(result.line);

  const treePing = arg('--tree-ping');
  if (treePing) {
    // A `recovered` ping must not be sent off a `gap` verdict (or the reverse):
    // the caller's state came from upsert-alert.sh, this one from the files, and
    // a disagreement means the condition flipped mid-step. Stay quiet rather
    // than announce the wrong thing.
    const expected = treePing === 'recovered' ? 'ok' : 'gap';
    const actual = result.exitCode === 0 ? 'ok' : result.exitCode === 1 ? 'gap' : 'unknown';
    if (actual !== expected) {
      console.log(`posting-gap: asked to ping "${treePing}" but the current verdict is "${actual}" — not sending.`);
      return 0;
    }
    await pingTree(result.treeLine, { url: arg('--alert-url') ?? '' });
    return 0;
  }

  const alertBody = arg('--alert-body');
  if (alertBody) writeFileSync(alertBody, result.body);
  return result.exitCode;
}

const invokedDirectly = process.argv[1]?.split(/[\\/]/).pop() === 'check-posting-gap.mjs';
if (invokedDirectly) {
  runMain(
    async () => {
      try {
        return await main();
      } catch (error) {
        // A crash in the check is `unknown` (2), never `gap` (1) — runMain's
        // default of 1 would make the caller open a posting-gap alert whose
        // body file was never written. The body is written here for the same
        // reason: upsert-alert.sh needs one to exist.
        const alertBody = arg('--alert-body');
        const fallback = renderResult({
          status: 'unknown',
          reason: `the check itself failed (${error.message})`,
        });
        console.error(`✗ posting-gap check could not run: ${error.message}`);
        if (alertBody) writeFileSync(alertBody, fallback.body);
        return 2;
      }
    },
    { name: 'check-posting-gap' },
  );
}
