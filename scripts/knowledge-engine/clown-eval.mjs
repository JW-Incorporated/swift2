#!/usr/bin/env node
// Clownbot — retro eval battery over confirmed eggs (PLAN.md Stage 12,
// proposal §7 eval bullet item 1): "retro battery over confirmed eggs with
// post-reveal docs hidden (target top-3 ≥ 60%)."
//
// GROUND TRUTH (checked before writing this, not assumed): confirmed eggs
// come from `egg_ledger`, built by `scripts/lib/knowledge-rows.mjs`'s
// `buildEggLedgerRow()` from real Vault seed data — no DB read needed to GET
// the eggs (`sync-clown-knowledge.mjs`'s exported `buildAll()` builds them
// from `supabase/seed/theories/**` directly). That same builder's own
// comment records that `reveal_doc_id` is ALWAYS null in this corpus today
// ("the source data has no separate reveal-specific document") and
// `hint_doc_id` equals the egg's own id — the theory's one knowledge_doc
// write-up covers both the hint and the confirmation. So "hide the
// post-reveal knowledge_doc row" is applied as: hide `reveal_doc_id` when
// present (the literal ask, for whenever the ingestion pipeline starts
// populating it); when it's null (the universal case today), hide
// `hint_doc_id` instead — the only write-up doc that exists — otherwise
// there is nothing to hide and every run would trivially "pass" by finding
// the untouched answer doc via plain search. Documented deviation, not a
// silent guess.
//
// "top-3 retrieved/cited items" is the proposal's own phrase, undefined
// further there — operationalized here as: the first 3 ids of
// `take.citedIds` when the run produced a take (the model's own priority
// order), else the first 3 ids surfaced into the pool (seed first, in
// discovery order) when the run degraded. "the actual right answer" is the
// hidden egg's own id (`egg:<eraId>:<slug>`) — the model must reach it via
// SOME other channel (an unrelated doc mentioning the same symbols, or the
// `precedents()` tool reading `egg_ledger` directly, which is NOT touched by
// this hide — only `knowledge_doc` is) once the direct write-up is hidden.
// This is the harness proving Stage 10's methodology-first design actually
// works: precedent reasoning, not literal recall.
//
// Requires a live model key AND a live, writable Supabase project (the hide/
// restore needs `SUPABASE_DB_URL` write access — a read-only anon key cannot
// flip `redline_ok`). Degrades to a clear skip, never a crash, when either
// is missing — same pattern as `sync-clown-knowledge.mjs`/`knowledge-
// coverage.mjs` tonight. NOT wired into CI (spends real money against the
// real Anthropic API and mutates a live table, even if only transiently).
//
// Also runs the grounding check (Stage 12 item 4, `clown-grounding.ts`) on
// every cited id from every take this eval produces — a hallucinated or
// screened-out citation is reported as a failure alongside the hit rate.
//
//   ANTHROPIC_API_KEY=sk-... npm run clown:eval
//   npm run clown:eval -- --limit 10
//
// Exit codes: 0 = ran, hit rate >= target AND zero grounding failures;
// 1 = ran, below target or a grounding failure found; 2 = skipped (no key/DB
// reachable, or zero eligible eggs in the seed data).

import { makeClient } from '../lib/pg.mjs';
import { buildAll, loadWorkerEnvLocal } from '../sync-clown-knowledge.mjs';
import { runClownAgent } from '../../apps/web/lib/longlive/clown-agent.ts';
import { toolSearch } from '../../apps/web/lib/longlive/clown-agent-tools.ts';
import { groundCitations } from '../../apps/web/lib/longlive/clown-grounding.ts';
import { ClownUsage } from '../../apps/web/lib/longlive/clown-usage.ts';

const TARGET_TOP3_HIT_RATE = 0.6;

const ARGV = process.argv.slice(2);
function flagValue(name) {
  const eq = ARGV.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(`--${name}=`.length);
  const i = ARGV.indexOf(`--${name}`);
  if (i !== -1 && ARGV[i + 1] && !ARGV[i + 1].startsWith('--')) return ARGV[i + 1];
  return null;
}
const LIMIT = flagValue('limit') ? Number(flagValue('limit')) : 30;

function top3ForRun(run, rightAnswerId) {
  const ids = run.take?.citedIds?.length ? run.take.citedIds : [...run.pool.keys()];
  const top3 = ids.slice(0, 3);
  return { top3, hit: top3.includes(rightAnswerId) };
}

async function checkGrounding(pg, citedIds) {
  if (citedIds.length === 0) return { ok: true, problems: [] };
  const { rows } = await pg.query(
    'select id, redline_ok from public.knowledge_doc where id = any($1::text[])',
    [citedIds],
  );
  const store = new Map(rows.map((r) => [r.id, { redlineOk: r.redline_ok }]));
  return groundCitations(citedIds, store);
}

async function evalOneEgg(pg, egg, docTitleById) {
  const hideIds = egg.reveal_doc_id
    ? [egg.reveal_doc_id]
    : egg.hint_doc_id
      ? [egg.hint_doc_id]
      : [];
  const rightAnswerId = egg.id;
  const title = docTitleById.get(egg.hint_doc_id) ?? docTitleById.get(egg.id) ?? egg.mechanism;
  const query = `What's the deal with ${title}?`;

  if (hideIds.length > 0) {
    await pg.query(
      'update public.knowledge_doc set redline_ok = false where id = any($1::text[])',
      [hideIds],
    );
  }
  try {
    const seed = await toolSearch(query);
    const usage = new ClownUsage(1);
    const run = await runClownAgent(usage, [{ role: 'user', text: query }], seed, { query });
    const { top3, hit } = top3ForRun(run, rightAnswerId);
    const citedIds = run.take?.citedIds ?? [];
    const grounding = await checkGrounding(pg, citedIds);
    return {
      eggId: egg.id,
      query,
      hiddenIds: hideIds,
      top3,
      hit,
      grounding,
      degraded: run.take === null,
    };
  } finally {
    if (hideIds.length > 0) {
      await pg.query(
        'update public.knowledge_doc set redline_ok = true where id = any($1::text[])',
        [hideIds],
      );
    }
  }
}

async function main() {
  await loadWorkerEnvLocal();

  const missing = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!process.env.SUPABASE_DB_URL) missing.push('SUPABASE_DB_URL');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey)
    missing.push('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or _ANON_KEY)');

  if (missing.length > 0) {
    console.log(
      `clown-eval: SKIPPING — missing ${missing.join(', ')}. This eval calls the live Anthropic API and a live,\n` +
        "writable Supabase project (it temporarily hides each confirmed egg's write-up doc, then restores it).\n" +
        'Nothing was called, nothing was spent, no data was touched.',
    );
    return 2;
  }

  const { knowledgeDocs, eggLedgerRows } = await buildAll();
  const docTitleById = new Map(knowledgeDocs.map((d) => [d.id, d.title]));
  const eligible = eggLedgerRows.filter((e) => e.confirmed && (e.hint_doc_id || e.reveal_doc_id));

  if (eligible.length === 0) {
    console.log(
      'clown-eval: SKIPPING — no confirmed egg_ledger rows with a hint/reveal doc found in the Vault seed data.',
    );
    return 2;
  }

  const sample = LIMIT ? eligible.slice(0, LIMIT) : eligible;
  console.log(
    `clown-eval: ${sample.length}/${eligible.length} confirmed egg(s), target top-3 hit rate >= ${TARGET_TOP3_HIT_RATE * 100}%.`,
  );

  const pg = makeClient(process.env.SUPABASE_DB_URL);
  await pg.connect();
  const results = [];
  const errors = [];
  try {
    for (const egg of sample) {
      try {
        results.push(await evalOneEgg(pg, egg, docTitleById));
      } catch (err) {
        errors.push({ eggId: egg.id, message: err instanceof Error ? err.message : String(err) });
      }
    }
  } finally {
    await pg.end();
  }

  for (const r of results) {
    console.log(
      `[${r.hit ? 'HIT ' : 'miss'}] ${r.eggId} — "${r.query}" — top3: ${r.top3.join(', ') || '(none)'}` +
        `${r.degraded ? ' (degraded run — no key/cap/timeout)' : ''}${r.grounding.ok ? '' : ' — GROUNDING FAILURE'}`,
    );
    for (const p of r.grounding.problems) {
      console.log(`         cited ${p.id}: ${p.reason}`);
    }
  }
  for (const e of errors) {
    console.log(`[ERROR] ${e.eggId} — ${e.message}`);
  }

  const hits = results.filter((r) => r.hit).length;
  const hitRate = results.length > 0 ? hits / results.length : 0;
  const groundingFailures = results.filter((r) => !r.grounding.ok);

  console.log(
    `\nclown-eval: top-3 hit rate ${hits}/${results.length} (${(hitRate * 100).toFixed(1)}%), ` +
      `target ${TARGET_TOP3_HIT_RATE * 100}%. Grounding failures: ${groundingFailures.length}. Errors: ${errors.length}.`,
  );

  if (results.length === 0) {
    console.log(
      'clown-eval: every egg errored before producing a result — nothing was actually evaluated.',
    );
    return 2;
  }

  const pass = hitRate >= TARGET_TOP3_HIT_RATE && groundingFailures.length === 0;
  console.log(
    pass ? 'clown-eval: PASS' : 'clown-eval: BELOW TARGET or a grounding failure was found',
  );
  return pass ? 0 : 1;
}

process.exitCode = await main();
