#!/usr/bin/env node
// Appearance discovery — the zero-LLM detection half of "detect
// deterministically, judge with an LLM, a human merges".
//
// Polls the public RSS feed of each curated channel (channels.mjs), filters
// for Taylor-relevance with the deterministic rules documented there, dedupes
// STATELESSLY against the repo (existing intake issues open+closed via the
// repo-scoped issues list, plus the seed corpus — see lib/dedupe.mjs for why
// there is no state file and why dedupe fails closed), and files one `intake`
// issue per genuinely new video. The existing content engine (Content Shift —
// see docs/agents/content-shift.md § "YouTube appearance intake") is the
// judge: it verifies, places by era, and authors — the slow lane. This
// script never calls a model and never claims anything about a video's
// CONTENT.
//
// FAST LANE (added 2026-08-25, docs/decisions.md "Detection-triggered social
// auto-post"): alongside that intake issue, FILE mode also stages a
// templated X + Instagram social/queue/*.json pair (lib/social-draft.mjs) — captions
// that only ever restates RSS metadata (title/channel/URL), never a claim
// about content. The workflow's own git step commits it via a PR; it posts
// live on schedule same as any other queue draft (no approval gate, per that
// decision) once it clears the real content gate (check-drafts.mjs).
//
// Usage:
//   node scripts/appearance-discovery/discover.mjs                # DRY RUN (default): print, no gh calls
//   node scripts/appearance-discovery/discover.mjs --file         # actually file issues + stage drafts (needs GH_TOKEN or gh auth)
//   node scripts/appearance-discovery/discover.mjs --file --max 10 --max-age-days 30
//
// Dry-run makes NO GitHub calls at all (network use is only the RSS fetches)
// and writes no files, so it is safe anywhere and is what the tests and
// reviewers exercise.
//
// Exit code: non-zero when any channel failed to fetch/parse, when filing was
// refused (dedupe fail-closed), when any issue create failed, or when a
// social pair failed to build — loud beats quiet (see runners.md: a silent
// no-op is indistinguishable from a broken run).
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh, httpsRequest } from '../lib/gh.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { CHANNELS, feedUrl } from './channels.mjs';
import { parseFeed, looksLikeFeed } from './lib/feed.mjs';
import { matchRule, isFresh } from './lib/filter.mjs';
import { videoIdsIn, planFilings, fingerprintMarker } from './lib/dedupe.mjs';
import { buildSocialDraftPair, fetchAppearanceThumbnail } from './lib/social-draft.mjs';
import { clampMaxPerRun } from './lib/spend-limits.mjs';
import { emitOfficialYoutubeEvent } from './lib/emit-official-youtube-event.mjs';
import { runMain } from '../lib/cli.mjs';

const INTAKE_LABEL = 'intake';
// Matches the label as it already exists on the repo — the upsert is a no-op
// then, and a first run on a fork recreates it identically.
const INTAKE_COLOR = '1D76DB';
const INTAKE_DESC = 'Real-world event dropped for content authoring';
const LEDGER_LIMIT = 1000;
const FETCH_TIMEOUT_MS = 30_000;
// Attempts per channel (1 retry). Worst case bounds the run:
// 14 channels x 2 attempts x 30s + backoff is under 15 minutes, which is what
// the workflow's timeout-minutes is sized against.
const FETCH_ATTEMPTS = 2;
const RETRY_DELAY_MS = 3_000;

/**
 * A positive-integer argument, or a hard exit. Everything else in this script
 * fails closed, so a typo'd `--max abc` must not silently become the default
 * and quietly change how much a run is allowed to file.
 */
function intArg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const raw = process.argv[i + 1];
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    console.error(`appearance-discovery: ${name} must be a positive integer, got "${raw}"`);
    process.exit(2);
  }
  return n;
}
// Hard ceiling on `--max`, independent of the dispatch input — see
// lib/spend-limits.mjs for the full rationale (codex review, kanban
// t_ac1281ef rounds 2-3).
const FILE_MODE = process.argv.includes('--file');
const MAX_PER_RUN = clampMaxPerRun(intArg('--max', 10));
const MAX_AGE_DAYS = intArg('--max-age-days', 30);

function withTimeout(promise, ms, what) {
  let timer;
  const bomb = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${what}`)), ms);
  });
  return Promise.race([promise, bomb]).finally(() => clearTimeout(timer));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One attempt at a feed. Separated from the retry wrapper so the retry decision
 * can distinguish "the internet blinked" from "this channel is misconfigured".
 */
async function fetchChannelOnce(channel) {
  const url = feedUrl(channel.channelId);
  const res = await withTimeout(httpsRequest(url), FETCH_TIMEOUT_MS, url);
  // 429 (rate limited) and 5xx are transient by definition; a 404 is a wrong
  // channel id, which retrying only turns into three requests for the same
  // wrong answer. Marked so the wrapper can tell them apart.
  if (res.status === 429 || res.status >= 500) {
    const e = new Error(`${channel.name}: feed HTTP ${res.status}`);
    e.transient = true;
    throw e;
  }
  if (res.status !== 200) throw new Error(`${channel.name}: feed HTTP ${res.status}`);
  return res;
}

/**
 * Fetch + parse one channel feed, with ONE retry for transient conditions.
 *
 * This lane runs unattended every day against 14 third-party feeds, and any
 * channel failure turns the whole run red (deliberately — see the exit-code
 * note in the header). Without a retry, one dropped TCP connection out of
 * fourteen is a red run and a false alarm, and an alert that cries wolf daily
 * stops being read — which is the same silent-failure class the loud exit code
 * exists to prevent, arriving from the other direction. So: retry the things
 * that are genuinely transient (socket errors, timeouts, 429, 5xx), and stay
 * loud about everything else immediately. A real outage still goes red, one
 * attempt later.
 */
async function fetchChannel(channel) {
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetchChannelOnce(channel);
      break;
    } catch (e) {
      // A timeout or a socket-level error carries no HTTP status; both are the
      // transient case. `e.transient` marks the status codes that are too.
      const transient = e.transient || !/feed HTTP \d+$/.test(e.message);
      if (!transient || attempt >= FETCH_ATTEMPTS) throw e;
      console.error(`  … ${channel.name}: ${e.message} — retrying in ${RETRY_DELAY_MS}ms`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  if (!looksLikeFeed(res.text)) throw new Error(`${channel.name}: response is not an Atom feed`);
  const { channelTitle, entries } = parseFeed(res.text);
  // Zero entries from a channel that uploads constantly is not a quiet day —
  // it is the signature of a feed shape change, and the regex parser's whole
  // failure mode is returning nothing rather than erroring. Every watched
  // channel is an active broadcaster, so treat empty as broken and say so.
  // (Loud beats quiet: a silent no-op is indistinguishable from a working run.)
  if (!entries.length) throw new Error(`${channel.name}: feed parsed to 0 entries (shape change?)`);
  return { channelTitle, entries };
}

/**
 * Every YouTube video id already cited anywhere under supabase/seed — i.e. the
 * videos that are already site content rather than news.
 *
 * Ids are EXTRACTED — from real YouTube URLs and from KEYED id fields
 * (`youtubeId: "…"`, which is how the seed actually stores most videos) — never
 * substring-matched against the raw corpus. A bare 11-character id can occur
 * inside a longer token (a content hash, another platform's id), and a
 * substring hit there would silently skip a genuine new appearance as
 * "already-in-seed" — an invisible false negative. Reuses the same matcher the
 * issue ledger uses, so there is one definition of "this text references video
 * X", and returns a Set instead of retaining the whole concatenated corpus in
 * memory.
 */
export function readSeedIds(root) {
  const dir = join(root, 'supabase', 'seed');
  const texts = [];
  for (const f of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!f.isFile() || !/\.(mjs|json)$/.test(f.name)) continue;
    texts.push(readFileSync(join(f.parentPath ?? f.path, f.name), 'utf8'));
  }
  return videoIdsIn(texts);
}

/**
 * The dedupe ledger: every intake issue ever filed (open AND closed), read via
 * the repo-scoped issues list (scripts/lib/gh.mjs — never /search, #1869/#2008).
 * `complete` comes from gh.mjs's own page loop, which reports whether it
 * reached the end of the data or stopped at a cap (#2034).
 */
async function loadLedger() {
  const res = await gh([
    'issue',
    'list',
    '--label',
    INTAKE_LABEL,
    '--state',
    'all',
    '--json',
    'number,title,body',
    '--limit',
    String(LEDGER_LIMIT),
  ]);
  const { stdout } = res;
  // Empty stdout is NOT an empty ledger. A successful "no issues" result is
  // still `[]` on stdout; genuinely blank output means the call produced
  // nothing we can interpret, and #2008's whole lesson is that an
  // uninterpretable dedupe read must not read as "nothing was filed" — that is
  // the exact coercion that duplicated #2017–#2027. Throw, so the caller
  // refuses.
  if (!String(stdout).trim()) throw new Error('issue list returned no output');
  const rows = JSON.parse(stdout);
  if (!Array.isArray(rows)) throw new Error('issue list did not return an array');
  return {
    // Titles as well as bodies: a hand-filed intake issue may carry the watch
    // URL only in its title, and it still means "this one is already known".
    ids: videoIdsIn(rows.flatMap((r) => [r?.title, r?.body])),
    issues: rows.length,
    // The truncation guard. It used to be the ONE-SIDED row-count test
    // (`rows.length < LEDGER_LIMIT`): sound on the gh-CLI path, but wrong on
    // scripts/lib/gh.mjs's REST fallback, which pages to ceil(limit/100)
    // capped at 10 pages and then drops pull requests POST-fetch — so a
    // truncated fetch could come back under the limit and still be missing
    // issues, reading as complete.
    //
    // gh.mjs now reports how its page loop ended, so this is two-sided on both
    // transports: `complete` is true only when the API itself ran out of rows
    // (#2034). The row count remains the fallback for a transport that could
    // not say, and the near-limit warning below stays as a second tripwire.
    complete: res.complete ?? rows.length < LEDGER_LIMIT,
  };
}

// GitHub rejects issue titles over 256 characters. The per-field cap in
// feed.mjs bounds the video title alone; this bounds the ASSEMBLED string,
// which also carries the channel name and the date suffix. Truncating the
// video title (not the suffix) keeps the published date legible.
const MAX_ISSUE_TITLE = 250;

function issueTitle(c) {
  const day = (c.published || '').slice(0, 10) || 'date unknown';
  const build = (title) =>
    `intake: YouTube appearance — ${c.channelName}: “${title}” (published ${day})`;
  const full = build(c.title);
  if (full.length <= MAX_ISSUE_TITLE) return full;
  const over = full.length - MAX_ISSUE_TITLE;
  return build(`${c.title.slice(0, Math.max(0, c.title.length - over - 1))}…`);
}

function issueBody(c) {
  return [
    `**Watch URL:** ${c.url}`,
    `**Channel:** ${c.channelName} (\`${c.channelId}\`) — ${c.channelWhy}`,
    `**Published:** ${c.published || '(missing from feed)'}`,
    `**Matched rule:** \`${c.rule}\` (deterministic filter — see \`scripts/appearance-discovery/channels.mjs\`)`,
    `**Fingerprint (video id):** \`${c.videoId}\``,
    '',
    '**What this is.** Machine-detected from the channel’s public RSS feed by the',
    'zero-LLM appearance-discovery workflow (`.github/workflows/appearance-discovery.yml`).',
    'Detection is deterministic and UNVERIFIED — nobody has watched this video or',
    'checked a single claim. The drop is never the copy.',
    '',
    '**Triage:** per `docs/content-ops/intake.md`, plus the appearance rules in',
    '`docs/agents/content-shift.md` § "YouTube appearance intake" — verify the URL',
    'via YouTube oEmbed, place by published date against `supabase/seed/eras-data.mjs`',
    'era ranges, ENRICH an existing timeline item (add this link to `moment.sources`)',
    'if the moment already exists rather than duplicating it, category default `music`;',
    'official-channel performances/documentaries may also become a `videos/<era>.mjs`',
    'entry only if they fit the existing kind enum; a fan re-upload is never a `videos`',
    '`officialUrl`.',
    '',
    '---',
    '_Filed by appearance-discovery (deterministic detection; this is a lead, not copy)._',
    fingerprintMarker(c.videoId),
  ].join('\n');
}

async function createIntakeIssue(c) {
  // Body via temp file, never argv — same ENAMETOOLONG guard as the CIE filer.
  const bodyPath = join(tmpdir(), `yt-intake-${c.videoId}-${Date.now()}.md`);
  writeFileSync(bodyPath, issueBody(c), 'utf8');
  try {
    const { stdout } = await gh([
      'issue',
      'create',
      '--title',
      issueTitle(c),
      '--body-file',
      bodyPath,
      '--label',
      INTAKE_LABEL,
    ]);
    return stdout.trim();
  } finally {
    try {
      unlinkSync(bodyPath);
    } catch {
      /* best-effort cleanup */
    }
  }
}

function supabaseAdmin() {
  return serviceClient();
}

async function main() {
  const root = join(fileURLToPath(import.meta.url), '..', '..', '..');
  const now = Date.now();
  const failures = [];
  const candidates = [];
  let totalEntries = 0;

  console.log(
    `appearance-discovery: ${FILE_MODE ? 'FILE mode' : 'DRY RUN (no gh calls)'} — ${CHANNELS.length} channels, window ${MAX_AGE_DAYS}d, cap ${MAX_PER_RUN}/run`,
  );

  for (const channel of CHANNELS) {
    try {
      const { channelTitle, entries } = await fetchChannel(channel);
      totalEntries += entries.length;
      const hits = [];
      for (const e of entries) {
        const rule = matchRule(e, channel);
        if (!rule || !isFresh(e.published, now, MAX_AGE_DAYS)) continue;
        hits.push({
          ...e,
          rule,
          channelId: channel.channelId,
          channelName: channel.name,
          channelWhy: channel.why,
        });
      }
      candidates.push(...hits);
      console.log(
        `  ✓ ${channel.name} (feed title: "${channelTitle}") — ${entries.length} entries, ${hits.length} relevant+fresh`,
      );
    } catch (e) {
      failures.push(`${channel.name}: ${e.message}`);
      console.error(`  ✗ ${channel.name}: ${e.message}`);
    }
  }

  // Oldest first, so under the per-run cap nothing starves: what is cut today
  // is the newest, which is still fresh (and re-discovered) tomorrow.
  candidates.sort((a, b) => Date.parse(a.published) - Date.parse(b.published));

  const seedIds = readSeedIds(root);
  // Assigned on every path below; `null` means "unreadable", which planFilings
  // turns into a refusal rather than a blind file.
  let ledger;
  if (FILE_MODE) {
    try {
      // The label upsert runs BEFORE the ledger read, not after: the read is
      // filtered by this label, and if querying a non-existent label errors,
      // the run would refuse forever and never reach the line that creates it.
      // It doubles as the write preflight (same pattern as the CIE) — find out
      // GitHub is unwritable before filing, not halfway through.
      await gh([
        'label',
        'create',
        INTAKE_LABEL,
        '--color',
        INTAKE_COLOR,
        '--description',
        INTAKE_DESC,
        '--force',
      ]);
      ledger = await loadLedger();
      console.log(
        `ledger: ${ledger.issues} intake issues scanned, ${ledger.ids.size} video ids known${ledger.complete ? '' : ' (POSSIBLY TRUNCATED)'}`,
      );
      // Tripwire for both ceiling problems: the one-sided truncation test above,
      // and the fact that `--state all` makes this population MONOTONIC — at the
      // limit the lane refuses every day and does NOT self-heal, because nothing
      // ever reduces the count. Warn with room to act rather than discovering it
      // the day filing stops.
      if (ledger.issues >= LEDGER_LIMIT * 0.8) {
        console.error(
          `ledger: WARNING — ${ledger.issues}/${LEDGER_LIMIT} intake issues. This ceiling does not self-heal: ` +
            "at the limit every run refuses permanently. Raise LEDGER_LIMIT (and gh.mjs's page cap) or narrow the query.",
        );
      }
    } catch (e) {
      console.error(`ledger: unavailable — ${e.message}`);
      ledger = null; // planFilings refuses on this
    }
  } else {
    // Dry run: no gh calls by contract. Pretend the ledger is empty-and-complete
    // so the printout shows the full candidate set; the header says so.
    ledger = { ids: new Set(), issues: 0, complete: true };
  }

  const plan = planFilings(candidates, { ledger, seedIds, max: MAX_PER_RUN });

  for (const s of plan.skipped)
    console.log(`  skip [${s.reason}] ${s.videoId} — ${s.channelName}: ${s.title}`);
  for (const c of plan.toFile)
    console.log(
      `  ${FILE_MODE ? 'FILE' : 'would file'} [${c.rule}] ${c.videoId} — ${issueTitle(c)}`,
    );

  let filed = 0;
  let staged = 0;
  const createFailures = [];
  const draftFailures = [];
  if (plan.refuse) {
    console.error(`REFUSED to file: ${plan.refuse}`);
  } else if (FILE_MODE && plan.toFile.length) {
    // (The label upsert / write preflight already ran before the ledger read.)
    const notifDb = supabaseAdmin();
    if (!notifDb) {
      console.log(
        '  notifications: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — skipping official_youtube events (see SETUP_NOTIFICATIONS.md)',
      );
    }
    for (const c of plan.toFile) {
      try {
        const url = await createIntakeIssue(c);
        filed++;
        console.log(`  filed ${url}`);
      } catch (e) {
        createFailures.push(`${c.videoId}: ${String(e?.stderr || e?.message || e).slice(0, 300)}`);
        console.error(`  FAILED to file ${c.videoId}: ${e.message}`);
        continue; // no fast-lane draft for a video whose slow-lane lead didn't even file
      }
      // Notifications Phase 2 producer seam: 'all-uploads' candidates
      // (Taylor's own channel) fire an official_youtube event. Never
      // blocks or undoes the issue that already filed — same "loud, not
      // fatal" posture as the social-draft step below.
      if (notifDb) {
        try {
          const notifResult = await emitOfficialYoutubeEvent(c, { db: notifDb });
          if (notifResult.emitted) console.log(`  notified official_youtube for ${c.videoId}`);
        } catch (e) {
          console.error(`  FAILED to emit official_youtube event for ${c.videoId}: ${e.message}`);
        }
      }
      // Fast lane (docs/decisions.md 2026-08-25): stage an X + Instagram
      // social/queue/ pair alongside the intake issue. Instagram supplies the
      // Facebook cross-post, so there is no third queue item.
      // Never blocks or undoes the issue that already filed — a bad draft is
      // loud, not fatal, same "loud beats quiet" posture as everything else
      // in this script. The workflow's own git step (appearance-discovery.yml)
      // commits whatever lands here via a PR; check-drafts.mjs is the real
      // content gate before it can ever post.
      try {
        const { drafts, media } = buildSocialDraftPair(c);
        const thumbnail = await fetchAppearanceThumbnail(c);
        writeFileSync(join(root, media.repoPath), thumbnail.bytes);
        for (const { filename, item } of drafts) {
          writeFileSync(
            join(root, 'social', 'queue', filename),
            `${JSON.stringify(item, null, 2)}\n`,
            'utf8',
          );
          staged++;
          console.log(`  staged social/queue/${filename}`);
        }
      } catch (e) {
        draftFailures.push(`${c.videoId}: ${e.message}`);
        console.error(`  FAILED to stage social draft for ${c.videoId}: ${e.message}`);
      }
    }
  } else if (!FILE_MODE) {
    // Dry run: preview what the fast lane would stage, without touching the
    // filesystem, thumbnail network, or gh — buildSocialDraftPair is pure.
    for (const c of plan.toFile) {
      try {
        const { drafts } = buildSocialDraftPair(c);
        for (const { filename } of drafts) console.log(`  would stage social/queue/${filename}`);
      } catch (e) {
        console.log(`  would FAIL to stage a social draft for ${c.videoId}: ${e.message}`);
      }
    }
  }

  console.log(
    `summary: ${CHANNELS.length - failures.length}/${CHANNELS.length} channels ok, ${totalEntries} entries, ` +
      `${candidates.length} relevant+fresh, ${plan.toFile.length} ${FILE_MODE ? 'to file' : 'would file'}, ` +
      `${plan.skipped.length} skipped, ${filed} filed, ${staged} staged${plan.refuse ? ', REFUSED (fail closed)' : ''}`,
  );
  if (failures.length) console.error(`channel failures:\n  ${failures.join('\n  ')}`);
  if (createFailures.length) console.error(`create failures:\n  ${createFailures.join('\n  ')}`);
  if (draftFailures.length)
    console.error(`social draft failures:\n  ${draftFailures.join('\n  ')}`);

  if (failures.length || createFailures.length || draftFailures.length || plan.refuse)
    process.exitCode = 1;
}

runMain(main, { name: 'discover' });
