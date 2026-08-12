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
// judge: it verifies, places by era, and authors. This script never writes
// content and never calls a model.
//
// Usage:
//   node scripts/appearance-discovery/discover.mjs                # DRY RUN (default): print, no gh calls
//   node scripts/appearance-discovery/discover.mjs --file         # actually file issues (needs GH_TOKEN or gh auth)
//   node scripts/appearance-discovery/discover.mjs --file --max 10 --max-age-days 30
//
// Dry-run makes NO GitHub calls at all (network use is only the RSS fetches),
// so it is safe anywhere and is what the tests and reviewers exercise.
//
// Exit code: non-zero when any channel failed to fetch/parse, when filing was
// refused (dedupe fail-closed), or when any issue create failed — loud beats
// quiet (see runners.md: a silent no-op is indistinguishable from a broken run).
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh, httpsRequest } from '../lib/gh.mjs';
import { CHANNELS, feedUrl } from './channels.mjs';
import { parseFeed, looksLikeFeed } from './lib/feed.mjs';
import { matchRule, isFresh } from './lib/filter.mjs';
import { knownIdsFromIssueBodies, planFilings, fingerprintMarker } from './lib/dedupe.mjs';

const INTAKE_LABEL = 'intake';
// Matches the label as it already exists on the repo — the upsert is a no-op
// then, and a first run on a fork recreates it identically.
const INTAKE_COLOR = '1D76DB';
const INTAKE_DESC = 'Real-world event dropped for content authoring';
const LEDGER_LIMIT = 1000;
const FETCH_TIMEOUT_MS = 30_000;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}
const FILE_MODE = process.argv.includes('--file');
const MAX_PER_RUN = Math.max(1, Number(arg('--max', 10)) || 10);
const MAX_AGE_DAYS = Math.max(1, Number(arg('--max-age-days', 30)) || 30);

function withTimeout(promise, ms, what) {
  let timer;
  const bomb = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${what}`)), ms);
  });
  return Promise.race([promise, bomb]).finally(() => clearTimeout(timer));
}

/** Fetch + parse one channel feed. Throws with a channel-named error. */
async function fetchChannel(channel) {
  const url = feedUrl(channel.channelId);
  const res = await withTimeout(httpsRequest(url), FETCH_TIMEOUT_MS, url);
  if (res.status !== 200) throw new Error(`${channel.name}: feed HTTP ${res.status}`);
  if (!looksLikeFeed(res.text)) throw new Error(`${channel.name}: response is not an Atom feed`);
  const { channelTitle, entries } = parseFeed(res.text);
  return { channelTitle, entries };
}

/** Every .mjs under supabase/seed, concatenated — the "already site content" corpus. */
export function readSeedCorpus(root) {
  const dir = join(root, 'supabase', 'seed');
  let text = '';
  for (const f of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!f.isFile() || !/\.(mjs|json)$/.test(f.name)) continue;
    text += readFileSync(join(f.parentPath ?? f.path, f.name), 'utf8');
  }
  return text;
}

/**
 * The dedupe ledger: every intake issue ever filed (open AND closed), read via
 * the repo-scoped issues list (scripts/lib/gh.mjs — never /search, #1869/#2008).
 * `complete` is authoritative only when the row count is under the limit.
 */
async function loadLedger() {
  const { stdout } = await gh([
    'issue', 'list', '--label', INTAKE_LABEL, '--state', 'all',
    '--json', 'number,body', '--limit', String(LEDGER_LIMIT),
  ]);
  const rows = JSON.parse(stdout || '[]');
  return {
    ids: knownIdsFromIssueBodies(rows.map((r) => r?.body)),
    issues: rows.length,
    complete: rows.length < LEDGER_LIMIT,
  };
}

function issueTitle(c) {
  const day = (c.published || '').slice(0, 10) || 'date unknown';
  return `intake: YouTube appearance — ${c.channelName}: “${c.title}” (published ${day})`;
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
      'issue', 'create', '--title', issueTitle(c), '--body-file', bodyPath, '--label', INTAKE_LABEL,
    ]);
    return stdout.trim();
  } finally {
    try { unlinkSync(bodyPath); } catch { /* best-effort cleanup */ }
  }
}

async function main() {
  const root = join(fileURLToPath(import.meta.url), '..', '..', '..');
  const now = Date.now();
  const failures = [];
  const candidates = [];
  let totalEntries = 0;

  console.log(`appearance-discovery: ${FILE_MODE ? 'FILE mode' : 'DRY RUN (no gh calls)'} — ${CHANNELS.length} channels, window ${MAX_AGE_DAYS}d, cap ${MAX_PER_RUN}/run`);

  for (const channel of CHANNELS) {
    try {
      const { channelTitle, entries } = await fetchChannel(channel);
      totalEntries += entries.length;
      const hits = [];
      for (const e of entries) {
        const rule = matchRule(e, channel);
        if (!rule || !isFresh(e.published, now, MAX_AGE_DAYS)) continue;
        hits.push({ ...e, rule, channelId: channel.channelId, channelName: channel.name, channelWhy: channel.why });
      }
      candidates.push(...hits);
      console.log(`  ✓ ${channel.name} (feed title: "${channelTitle}") — ${entries.length} entries, ${hits.length} relevant+fresh`);
    } catch (e) {
      failures.push(`${channel.name}: ${e.message}`);
      console.error(`  ✗ ${channel.name}: ${e.message}`);
    }
  }

  // Oldest first, so under the per-run cap nothing starves: what is cut today
  // is the newest, which is still fresh (and re-discovered) tomorrow.
  candidates.sort((a, b) => Date.parse(a.published) - Date.parse(b.published));

  const seedText = readSeedCorpus(root);
  // Assigned on every path below; `null` means "unreadable", which planFilings
  // turns into a refusal rather than a blind file.
  let ledger;
  if (FILE_MODE) {
    try {
      ledger = await loadLedger();
      console.log(`ledger: ${ledger.issues} intake issues scanned, ${ledger.ids.size} video ids known${ledger.complete ? '' : ' (POSSIBLY TRUNCATED)'}`);
    } catch (e) {
      console.error(`ledger: unavailable — ${e.message}`);
      ledger = null; // planFilings refuses on this
    }
  } else {
    // Dry run: no gh calls by contract. Pretend the ledger is empty-and-complete
    // so the printout shows the full candidate set; the header says so.
    ledger = { ids: new Set(), issues: 0, complete: true };
  }

  const plan = planFilings(candidates, { ledger, seedText, max: MAX_PER_RUN });

  for (const s of plan.skipped) console.log(`  skip [${s.reason}] ${s.videoId} — ${s.channelName}: ${s.title}`);
  for (const c of plan.toFile) console.log(`  ${FILE_MODE ? 'FILE' : 'would file'} [${c.rule}] ${c.videoId} — ${issueTitle(c)}`);

  let filed = 0;
  const createFailures = [];
  if (plan.refuse) {
    console.error(`REFUSED to file: ${plan.refuse}`);
  } else if (FILE_MODE && plan.toFile.length) {
    // Label upsert doubles as the write preflight (same pattern as the CIE):
    // find out GitHub is unwritable before filing, not halfway through.
    await gh(['label', 'create', INTAKE_LABEL, '--color', INTAKE_COLOR, '--description', INTAKE_DESC, '--force']);
    for (const c of plan.toFile) {
      try {
        const url = await createIntakeIssue(c);
        filed++;
        console.log(`  filed ${url}`);
      } catch (e) {
        createFailures.push(`${c.videoId}: ${String(e?.stderr || e?.message || e).slice(0, 300)}`);
        console.error(`  FAILED to file ${c.videoId}: ${e.message}`);
      }
    }
  }

  console.log(
    `summary: ${CHANNELS.length - failures.length}/${CHANNELS.length} channels ok, ${totalEntries} entries, ` +
    `${candidates.length} relevant+fresh, ${plan.toFile.length} ${FILE_MODE ? 'to file' : 'would file'}, ` +
    `${plan.skipped.length} skipped, ${filed} filed${plan.refuse ? ', REFUSED (fail closed)' : ''}`,
  );
  if (failures.length) console.error(`channel failures:\n  ${failures.join('\n  ')}`);
  if (createFailures.length) console.error(`create failures:\n  ${createFailures.join('\n  ')}`);

  if (failures.length || createFailures.length || plan.refuse) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`appearance-discovery: fatal — ${e.stack || e}`);
  process.exitCode = 1;
});
