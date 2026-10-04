#!/usr/bin/env node
// One-off scrub of the contaminated Facebook `engagement_lead` rows found in
// issue #4885 (founder decision HA #98: scrub, don't wait).
//
// WHAT WENT WRONG (see apps/worker/src/sources/facebook-groups-parser.ts's
// own comments for the code-level detail): the fb-export ingest run wrote
// ~72 `platform='facebook'`, `status='new'` leads whose `locator`/`context`
// begin with a leftover HTML tag fragment (`role="article"
// data-posinset="65">`) and, right behind it, a private Facebook group
// member's real name in full — unhashed, contradicting the "authors are
// hashed, never stored raw" posture (docs/decisions.md 2026-08-25).
//
// WHY DELETE RATHER THAN REDACT: the stored value is a lossy 80-char excerpt
// of post text. There is no way to recover the clean excerpt from it — the
// leaked name and the real post text are interleaved in one string with no
// delimiter. Re-running the ingest against the same saved exports with the
// fixed parser regenerates these rows cleanly, so deleting is both the
// complete privacy fix and recoverable (the exports are still in the private
// `facebook-exports` Storage bucket). Every row this script deletes is
// `status='new'`: never emailed, never posted, no `community_post_ledger`
// entry pointing at it.
//
// SAFETY: dry-run is the DEFAULT. Nothing is deleted without `--apply`.
// Candidate rows are matched on all three of
//   1. platform='facebook' AND status='new'
//   2. `community` in the known Facebook group slugs
//      (scripts/knowledge/fb-groups-checklist.mjs, the 7 groups of #4885)
//   3. the leaked-markup signature below — an HTML attribute fragment or a
//      stray `>` in the excerpt, which clean parser output can never contain
// so a row written by any other path, or by the fixed parser, is never
// eligible. `--json-out <file>` writes the full pre-delete contents of every
// deleted row (ids + values) so the action is auditable and reversible.
//
//   node scripts/community/fb-lead-scrub.mjs                      # dry run, prints the plan
//   node scripts/community/fb-lead-scrub.mjs --apply --json-out /tmp/scrubbed.json
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (service-role client via
// scripts/lib/supabase.mjs, same as fb-export-ingest.mjs) — these tables are
// RLS'd service-role-only (20260917000000_community_engine.sql).

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { FB_GROUPS_CHECKLIST } from '../knowledge/fb-groups-checklist.mjs';

/**
 * Leaked-markup signatures. Clean parser output is `stripTags`ed text: it
 * cannot contain an `attr="value"` pair or a bare `<`/`>`, so either is
 * conclusive evidence the row came from the pre-fix parser.
 *  - `role="article" data-posinset="65">` — the exact #4885 bug-1 fragment
 *  - any `name="..."` attribute fragment, or `name=` immediately followed by
 *    a quote, with or without the closing `>`
 *  - a stray `<` or `>` anywhere in the excerpt
 */
const MARKUP_SIGNATURES = [
  /\b[a-zA-Z_:][-a-zA-Z0-9_:.]*=["']/,
  /[<>]/,
];

/** Separator `fb-export-ingest.mjs` puts between the group name and the excerpt in `locator`. */
const LOCATOR_SEPARATOR = ' — ';
/**
 * How far into the excerpt the signature must appear. The leak is always the
 * FIRST thing in the derived text (the fragment of the tag the block was
 * sliced from), so anchoring the check to the head avoids false-positiving a
 * clean row whose post text happens to contain a `<`/`>` later on (e.g.
 * "selling these for > $20").
 */
const SIGNATURE_HEAD_CHARS = 60;

/** The excerpt half of a `locator` (`"<group name> — <excerpt>"`), or the whole string if unseparated. */
function excerptOf(value) {
  const at = value.indexOf(LOCATOR_SEPARATOR);
  return at === -1 ? value : value.slice(at + LOCATOR_SEPARATOR.length);
}

/**
 * True when this stored string shows the #4885 leaked-markup signature at
 * the head of its excerpt. Clean parser output is `stripTags`ed text and can
 * never begin with an `attr="value"` fragment or a stray angle bracket.
 */
export function hasLeakedMarkup(value) {
  if (typeof value !== 'string' || value === '') return false;
  const head = excerptOf(value).slice(0, SIGNATURE_HEAD_CHARS);
  return MARKUP_SIGNATURES.some((re) => re.test(head));
}

/** `facebook:<slug>` ids for every group in the export checklist. */
export function knownFacebookCommunities(checklist = FB_GROUPS_CHECKLIST) {
  return checklist.map((group) => `facebook:${group.slug}`);
}

/**
 * Decides whether one fetched `engagement_lead` row is a #4885 casualty.
 * All of: facebook + status 'new' + a known group community + the leaked
 * markup signature in `locator` or `context`.
 */
export function isContaminatedLead(row, { communities = knownFacebookCommunities() } = {}) {
  if (!row) return false;
  if (row.platform !== 'facebook') return false;
  if (row.status !== 'new') return false;
  if (!communities.includes(row.community)) return false;
  return hasLeakedMarkup(row.locator) || hasLeakedMarkup(row.context);
}

export function parseArgs(argv) {
  const flags = { apply: false, jsonOut: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--apply') flags.apply = true;
    else if (argv[i] === '--json-out') {
      flags.jsonOut = argv[i + 1] ?? null;
      i += 1;
    }
  }
  return flags;
}

/** Groups candidate rows by `community` for the printed summary. */
export function summarizeByCommunity(rows) {
  const counts = new Map();
  for (const row of rows) counts.set(row.community, (counts.get(row.community) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([community, count]) => ({ community, count }));
}

async function fetchFacebookNewLeads(supabase) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('id, platform, community, kind, locator, context, status, created_at')
    .eq('platform', 'facebook')
    .eq('status', 'new');
  if (error) throw new Error(`engagement_lead select failed: ${error.message}`);
  return data ?? [];
}

async function deleteLeads(supabase, ids) {
  let deleted = 0;
  // Chunked so one oversized `in` filter can't blow the URL length limit.
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { error } = await supabase.from('engagement_lead').delete().in('id', chunk);
    if (error) throw new Error(`engagement_lead delete failed: ${error.message}`);
    deleted += chunk.length;
  }
  return deleted;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const supabase = serviceClient();
  if (!supabase) {
    console.error('fb-lead-scrub: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected in apps/worker/.env).');
    return 1;
  }

  const rows = await fetchFacebookNewLeads(supabase);
  const communities = knownFacebookCommunities();
  const candidates = rows.filter((row) => isContaminatedLead(row, { communities }));
  const untouched = rows.length - candidates.length;

  console.log(
    `fb-lead-scrub: ${rows.length} facebook status='new' lead(s) found, ` +
      `${candidates.length} match the #4885 contamination signature, ${untouched} left alone.`,
  );
  for (const { community, count } of summarizeByCommunity(candidates)) {
    console.log(`  ${community}: ${count}`);
  }

  if (flags.jsonOut) {
    writeFileSync(flags.jsonOut, JSON.stringify(candidates, null, 2));
    console.log(`fb-lead-scrub: wrote ${candidates.length} candidate row(s) to ${flags.jsonOut}`);
  }

  if (candidates.length === 0) {
    console.log('fb-lead-scrub: nothing to scrub.');
    return 0;
  }
  if (!flags.apply) {
    console.log('fb-lead-scrub: dry run (default) — pass --apply to delete these rows.');
    return 0;
  }

  const deleted = await deleteLeads(
    supabase,
    candidates.map((row) => row.id),
  );
  console.log(`fb-lead-scrub: deleted ${deleted} engagement_lead row(s).`);
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'fb-lead-scrub' });
}
