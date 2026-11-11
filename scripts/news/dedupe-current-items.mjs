#!/usr/bin/env node
/**
 * Content fix 7 — live cleanup of existing duplicate current_items (owner
 * report 2026-10-13: three "Taylor's song removed from Trump video" posts
 * and two "Nashville Songwriters Hall of Fame" posts live at once, before
 * the write-time same-event gate existed). REUSES the exact same gate/merge
 * code the extract stage now runs at write time
 * (apps/worker/src/extract/dedupe-gate.ts, write-knowledge.ts) — this script
 * imports those modules directly rather than reimplementing any judgment.
 *
 * Walks live (non-expired, non-promoted, non-already-merged) current_items
 * newest-first, era by era is not needed (one era at a time via --era, or
 * every era present). For each item, loads its own 7-day candidate window
 * (same window the write-time gate uses) and runs the SAME
 * evaluateSameEventGate() used by apps/worker/src/extract/run-extract-stage.ts.
 * When a group of items is confirmed the same event, the earliest/highest-
 * tier item is kept as the original (same "keep the original" framing the
 * write-time gate already encodes — the ORIGINAL is whichever one is already
 * live when a NEW one is being evaluated; here it's whichever one this
 * script visits FIRST, oldest-first within a confirmed group so the one that
 * ran first/had more time to pick up corroboration is the keeper), new facts
 * are merged into it, and every other item in the group is HIDDEN via
 * `merged_into` (never hard-deleted — write-knowledge.ts's
 * `markDuplicateMerged`).
 *
 * DRY RUN BY DEFAULT: with no --live flag (or DRY_RUN=true from the
 * workflow_dispatch input), this only PRINTS each group — kept id+headline,
 * discarded ids+headlines, the facts that would merge — and writes nothing.
 * Pass --live (or DRY_RUN=false) to actually update the DB.
 *
 *   node scripts/news/dedupe-current-items.mjs                 (dry run, all eras)
 *   node scripts/news/dedupe-current-items.mjs --era tloas      (dry run, one era)
 *   node scripts/news/dedupe-current-items.mjs --live           (writes!)
 */

import { createWorkerDbClient } from '../../apps/worker/src/db/client.ts';
import { ExtractUsageStore, supabaseExtractUsageDb } from '../../apps/worker/src/extract/usage-store.ts';
import { evaluateSameEventGate } from '../../apps/worker/src/extract/dedupe-gate.ts';
import { mergeNewFactsIntoOriginal, markDuplicateMerged } from '../../apps/worker/src/extract/write-knowledge.ts';

const ARGV = process.argv.slice(2);
const LIVE = ARGV.includes('--live') || String(process.env.DRY_RUN ?? 'true').toLowerCase() === 'false';
const eraArgIdx = ARGV.indexOf('--era');
const ERA_FILTER = eraArgIdx >= 0 ? ARGV[eraArgIdx + 1] : undefined;

function toClusterSource(row) {
  return { outletName: row?.name ?? '', url: row?.url ?? '', tier: row?.tier ?? 'unverified' };
}

async function loadLiveItems(db) {
  let query = db
    .from('current_item')
    .select('id, era_id, observed_on, headline, summary, detail, sources, image_url, heat, source_tier, created_at')
    .is('promoted_to', null)
    .is('merged_into', null)
    .gt('expires_at', new Date().toISOString())
    .order('observed_on', { ascending: true }) // oldest first — earliest item in a group becomes the keeper
    .order('created_at', { ascending: true });
  if (ERA_FILTER) query = query.eq('era_id', ERA_FILTER);
  const { data, error } = await query;
  if (error) throw new Error(`load live items failed: ${error.message}`);
  return data ?? [];
}

const SOURCE_TIER_ORDER = ['official', 'established', 'fan', 'unverified'];

function tierRank(tier) {
  const i = SOURCE_TIER_ORDER.indexOf(tier);
  return i === -1 ? SOURCE_TIER_ORDER.length : i;
}

async function main() {
  const db = createWorkerDbClient();
  const usage = await ExtractUsageStore.create(supabaseExtractUsageDb(db));

  const items = await loadLiveItems(db);
  console.log(`dedupe-current-items: ${items.length} live candidate item(s)${ERA_FILTER ? ` (era=${ERA_FILTER})` : ''}, dry_run=${!LIVE}`);

  // mergedAway tracks ids already folded into a keeper THIS RUN, so a later
  // item in the walk is never re-evaluated against something that already
  // got hidden a moment ago.
  const mergedAway = new Set();
  // keepers: live pool this run actually treats as "already live" for the
  // gate's candidate set — starts as every item, shrinks as duplicates merge.
  let keepers = [...items];

  let groupsFound = 0;
  let mergedCount = 0;
  let discardedCount = 0;
  let heldCount = 0;

  for (const item of items) {
    if (mergedAway.has(item.id)) continue; // already hidden earlier this run as someone else's duplicate

    // Candidates = every OTHER still-live keeper in the same era, regardless
    // of the 7-day write-time window — a live cleanup pass should catch
    // older stragglers too, not just the write-time gate's rolling window.
    const candidatePool = keepers
      .filter((c) => c.id !== item.id && c.era_id === item.era_id && !mergedAway.has(c.id))
      .map((c) => ({
        id: c.id,
        headline: c.headline,
        summary: c.summary,
        detail: c.detail ?? '',
        sources: (c.sources ?? []).map(toClusterSource),
        imageUrl: c.image_url ?? null,
        heat: c.heat ?? 0,
      }));
    if (candidatePool.length === 0) continue;

    const decision = await evaluateSameEventGate(usage, candidatePool, {
      headline: item.headline,
      summary: item.summary,
      detail: item.detail ?? '',
    });

    if (decision.action === 'publish') continue; // not a duplicate of anything live

    if (decision.action === 'hold') {
      heldCount++;
      console.log(`HELD: ${item.id} "${item.headline}" — ${decision.reason}`);
      continue;
    }

    // decision.action is 'merge' or 'discard' — item IS a confirmed
    // duplicate of decision.candidateId. Per the spec's "keep the earliest/
    // highest-tier item as the original" rule: since we walk oldest-first,
    // decision.candidateId here is always the EARLIER item unless its
    // source tier is strictly worse than this (later) item's — in that one
    // case, flip which one survives.
    const original = items.find((c) => c.id === decision.candidateId);
    if (!original) continue;

    let keepId = original.id;
    let dropId = item.id;
    let dropRow = item;
    let keepRow = original;
    if (tierRank(item.source_tier) < tierRank(original.source_tier)) {
      // the later item is actually higher-tier — it becomes the keeper
      keepId = item.id;
      dropId = original.id;
      dropRow = original;
      keepRow = item;
    }

    groupsFound++;
    const mergedSummary = decision.action === 'merge' ? decision.mergedSummary : undefined;
    const mergedDetail = decision.action === 'merge' ? decision.mergedDetail : undefined;
    const newFactsLine = decision.action === 'merge' ? ` facts merged: ${mergedSummary}` : ' (no new facts — discard only)';
    console.log(
      `GROUP: keep ${keepId} "${keepRow.headline}" <- discard ${dropId} "${dropRow.headline}" —${newFactsLine}`,
    );

    if (decision.action === 'discard') discardedCount++;
    else mergedCount++;

    if (LIVE) {
      await mergeNewFactsIntoOriginal(
        db,
        keepId,
        {
          headline: keepRow.headline,
          summary: keepRow.summary,
          detail: keepRow.detail ?? '',
          sources: (keepRow.sources ?? []).map(toClusterSource),
          imageUrl: keepRow.image_url ?? null,
        },
        {
          ...(mergedSummary ? { mergedSummary, mergedDetail } : {}),
          duplicateSources: (dropRow.sources ?? []).map(toClusterSource),
          duplicateImageUrl: dropRow.image_url ?? null,
        },
      );
      await markDuplicateMerged(db, dropId, keepId);
    }

    mergedAway.add(dropId);
    keepers = keepers.filter((k) => k.id !== dropId);
  }

  console.log(
    `dedupe-current-items: done — groups=${groupsFound} merged=${mergedCount} discarded=${discardedCount} held=${heldCount} dry_run=${!LIVE}`,
  );
  if (!LIVE && groupsFound > 0) {
    console.log('Dry run only — no rows were changed. Re-run with --live (or DRY_RUN=false) to apply.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
