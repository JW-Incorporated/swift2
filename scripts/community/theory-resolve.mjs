#!/usr/bin/env node
// Theory resolution matcher (Community Engine plan §3.3, Phase 2 card
// P2-3): "a nightly job matches `predicts + predicted_date` against Vault
// moments; a hit sets `outcome` and creates an `egg_ledger` precedent
// candidate (human-reviewed PR like any Vault change)." Folds into the
// existing nightly `sync:content` job per docs/AUTOMATION.md's own P2-3
// row note ("folds into the existing nightly `sync:content` job") — run
// standalone here (`npm run theory:resolve`) and wired into `sync:content`
// as its own step, same pattern as knowledge-coverage.mjs.
//
// WHAT THIS DOES NOT DO: it never writes to `egg_ledger` directly. Every
// other write to that table in this repo goes through the canonical sync
// off real, human-authored Vault seed content
// (scripts/sync-clown-knowledge.mjs's upsertEggLedger, sourced from
// supabase/seed/theories/**) — there is no existing precedent anywhere in
// this repo for an automated process inserting a "confirmed" precedent
// row unreviewed, and the plan text is explicit either way ("a
// human-reviewed PR like any Vault change"). So this script's egg_ledger
// output is a REPORT of precedent CANDIDATES
// (docs/audits/theory-resolutions.md) a human/content-session turns into
// an actual `supabase/seed/theories/*.mjs` entry, exactly the same
// human-in-the-loop path every other egg_ledger row already takes. The
// only DB writes here are to `fan_theory_candidate` itself
// (resolved_outcome/resolved_at/resolved_moment_id — P2-3's own migration,
// 20260919000000_theory_promote_resolve.sql), which make the matcher
// idempotent (a resolved candidate is never re-matched).
//
// MATCH RULE (this card's own call, no existing precedent for "match a
// prediction against a moment" anywhere in this repo): a `live_theory`
// promoted from a `fan_theory_candidate` (origin='fan') with `predicts`
// set on its source candidate matches a Vault `moment:*` knowledge_doc
// when (a) the moment's `date` is on/after the candidate's
// `predicted_date` minus a small grace window (predictions often land a
// few days early/late) and (b) the two share at least one symbol —
// deliberately conservative (both a date AND a symbol match) since a
// false-positive "prediction confirmed" claim is a real reputational cost
// the plan's own guardrails (§6) take seriously elsewhere.
//
//   npm run theory:resolve
//   node scripts/community/theory-resolve.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeClient } from '../lib/pg.mjs';
import { runMain } from '../lib/cli.mjs';
import { ROOT } from '../lib/longlive-sync-shared.mjs';
import { loadWorkerEnvLocal } from '../sync-clown-knowledge.mjs';

const OUT_FILE = path.join(ROOT, 'docs', 'audits', 'theory-resolutions.md');
const GRACE_DAYS_BEFORE = 14; // a moment dated up to this many days BEFORE predicted_date can still confirm an early hit
const GRACE_DAYS_AFTER = 60; // a moment dated more than this many days AFTER predicted_date is too stale to credibly confirm that specific prediction

function daysBetween(a, b) {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000,
  );
}

/** Pure: finds the CLOSEST-dated Vault moment each candidate's prediction
 * matches (date within [-GRACE_DAYS_BEFORE, +GRACE_DAYS_AFTER] of
 * predicted_date, plus at least one shared symbol). Nearest-in-time, not
 * first-in-list — vaultMoments has no guaranteed order, and a generic
 * shared symbol (e.g. a recurring number) could otherwise match an
 * unrelated moment years away purely by list position. A tight upper
 * bound also matters here: `resolved_at` makes a candidate
 * un-rescannable (see module header), so wrongly matching a distant
 * moment would permanently foreclose a later, genuinely correct match.
 * Exported for unit testing without any DB. */
export function matchPredictions(candidates, vaultMoments) {
  const matches = [];
  for (const c of candidates) {
    if (!c.predicts || !c.predictedDate) continue;
    let best;
    let bestAbsDelta = Infinity;
    for (const m of vaultMoments) {
      if (!m.date) continue;
      const delta = daysBetween(c.predictedDate, m.date); // moment date minus predicted date
      if (delta < -GRACE_DAYS_BEFORE || delta > GRACE_DAYS_AFTER) continue; // outside the grace window either direction
      const sharedSymbol = (c.symbols ?? []).some((s) => (m.symbols ?? []).includes(s));
      if (!sharedSymbol) continue;
      const absDelta = Math.abs(delta);
      if (absDelta < bestAbsDelta) {
        best = m;
        bestAbsDelta = absDelta;
      }
    }
    if (best) matches.push({ candidate: c, moment: best });
  }
  return matches;
}

/** Pure: renders the precedent-candidate report. Exported for unit testing. */
export function buildResolutionsReport({ matches, generatedAt = new Date().toISOString() }) {
  const lines = [];
  lines.push('# Fan theory resolutions — precedent candidates');
  lines.push('');
  lines.push(
    `Generated ${generatedAt} by \`scripts/community/theory-resolve.mjs\` — regenerated nightly ` +
      '(folds into `sync:content`). A row here is a fan theory whose `predicts`/`predicted_date` ' +
      'matched a real Vault moment on date + symbol; each is a CANDIDATE for a new `egg_ledger` ' +
      'entry, never auto-written — a human/content session authors the actual ' +
      '`supabase/seed/theories/*.mjs` row, same as any other precedent (§3.3: "a nightly job ... ' +
      'creates an `egg_ledger` precedent candidate (human-reviewed PR like any Vault change)").',
  );
  lines.push('');
  if (matches.length === 0) {
    lines.push('No new resolutions this run.');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('| Theory | Predicts | Predicted | Matched moment | Moment date | Symbols |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const { candidate: c, moment: m } of matches) {
    lines.push(
      `| ${c.claim.replace(/\|/g, '\\|')} | ${c.predicts} | ${c.predictedDate} | ${m.title.replace(/\|/g, '\\|')} (${m.id}) | ${m.date} | ${(c.symbols ?? []).join(', ') || '—'} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

async function loadVaultMoments(client) {
  const { rows } = await client.query(
    `select id, title, date, symbols from public.knowledge_doc where kind = 'moment' and date is not null`,
  );
  return rows;
}

async function loadCandidates(client) {
  const { rows } = await client.query(
    `select id, claim, symbols, predicts, predicted_date
       from public.fan_theory_candidate
      where status in ('accepted')
        and predicts is not null
        and predicted_date is not null
        and resolved_at is null`,
  );
  return rows.map((r) => ({
    id: r.id,
    claim: r.claim,
    symbols: r.symbols ?? [],
    predicts: r.predicts,
    predictedDate:
      r.predicted_date instanceof Date
        ? r.predicted_date.toISOString().slice(0, 10)
        : r.predicted_date,
  }));
}

async function markResolved(client, matches) {
  for (const { candidate, moment } of matches) {
    await client.query(
      `update public.fan_theory_candidate
          set resolved_outcome = 'confirmed', resolved_at = now(), resolved_moment_id = $2
        where id = $1`,
      [candidate.id, moment.id],
    );
  }
}

async function main() {
  await loadWorkerEnvLocal();
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.log(
      'theory-resolve: no SUPABASE_DB_URL reachable — writing an empty report, matching skipped this run.',
    );
    const report = buildResolutionsReport({ matches: [] });
    await mkdir(path.dirname(OUT_FILE), { recursive: true });
    await writeFile(OUT_FILE, report, 'utf-8');
    return;
  }

  const client = makeClient(connectionString);
  await client.connect();
  let matches;
  try {
    const [candidates, vaultMoments] = await Promise.all([
      loadCandidates(client),
      loadVaultMoments(client),
    ]);
    matches = matchPredictions(candidates, vaultMoments);
    if (matches.length > 0) await markResolved(client, matches);
  } finally {
    await client.end();
  }

  const report = buildResolutionsReport({ matches });
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, report, 'utf-8');
  console.log(
    `theory-resolve: ${matches.length} new resolution(s) — wrote ${path.relative(ROOT, OUT_FILE)}.`,
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'theory-resolve' });
}
