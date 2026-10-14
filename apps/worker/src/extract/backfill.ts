// Content fix 5/6 (content-fix-cards.md Card 5): "re-enrich all existing
// current_items (image + rewritten copy), hide failures". This module is
// the one-off backfill's domain logic — it deliberately REUSES the same
// pipeline code the ordinary extract stage (run-extract-stage.ts) calls,
// rather than reimplementing any of it, so a backfilled row is held/
// servable by the EXACT same rule a freshly-extracted row is:
//   - `resolveImageUrl` (Card 1 / #5628, image-resolve.ts) — image
//     resolution + the same host allowlist.
//   - `fetchTopArticleTexts` + `extractWithLLM` (Card 2 / #5627,
//     fetch-article-text.ts / haiku-client.ts) — the same bounded article
//     fetch and the same Haiku call/prompt/budget, so thin copy is
//     rewritten from real article text, not reshuffled from the stored
//     one-liner that got it held in the first place.
//   - `evaluateCurrentItemQuality` (Card 3 / #5629, packages/shared/src/
//     current-item-quality.ts) — the shared publish gate, re-run on the
//     FINAL (possibly rewritten) fields, never the original ones.
//
// OUT OF SCOPE: DUPLICATE-story merging. content-fix/7-llm-dedupe owns
// deciding whether two current_items are the same story; this module only
// ever touches one row's own image/copy/quality fields and never deletes
// a row — a row that still fails after rewriting stays held (redline_ok
// false, quality_hold_reason set), exactly like Card 3's own write path,
// never removed.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  evaluateCurrentItemQuality,
  isAllowlistedImageHost,
  sentenceCount,
  wordCount,
  CURRENT_ITEM_QUALITY_THRESHOLDS,
  type QualityHoldReason,
} from '@swift2/shared';
import { screenTopic } from '@swift2/shared/redline';
import type { SourceTier } from '@swift2/shared/news';
import { resolveImageUrl } from './image-resolve';
import { fetchTopArticleTexts } from '../sources/fetch-article-text';
import { extractWithLLM } from './haiku-client';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import type { ClusterSource } from './write-knowledge';

/** The columns this backfill needs off `current_item` — a subset of
 * `packages/core/src/knowledge/client.ts`'s `CURRENT_ITEM_COLS`, read
 * directly (not through `getCurrentItems`/`getRecentItems`) because those
 * already FILTER OUT failing rows — exactly the rows this backfill exists
 * to find and fix. */
export interface BackfillCandidateRow {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  image_url: string | null;
  sources: { name: string; url: string; tier: SourceTier }[];
  era_id: string;
}

const CANDIDATE_COLS = 'id,headline,summary,detail,image_url,sources,era_id,expires_at,promoted_to';

/** Every non-expired, non-promoted current_item — Card 5's exact scope
 * ("For every non-expired, non-promoted current_item"). Deliberately reads
 * BOTH passing and held rows: a currently-passing row still gets its image
 * re-resolved/copy re-checked (a cheap idempotent re-run, see
 * `backfillOneItem`'s header), so a row that regresses some other way is
 * also caught, not just the already-known holds. */
export async function loadBackfillCandidates(
  db: SupabaseClient,
  limit = 1000,
): Promise<BackfillCandidateRow[]> {
  const { data, error } = await db
    .from('current_item')
    .select(CANDIDATE_COLS)
    .is('promoted_to', null)
    .gt('expires_at', new Date().toISOString())
    .order('observed_on', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`backfill candidate load failed: ${error.message}`);
  return (data ?? []) as BackfillCandidateRow[];
}

/** Same "a single hit anywhere fails the whole row" posture as
 * write-knowledge.ts's own `screenAll` — reimplemented here (not imported;
 * that one is file-private) rather than widening write-knowledge.ts's
 * export surface for a one-off script. */
function screenAll(strings: readonly string[]): boolean {
  for (const s of strings) {
    if (!s) continue;
    if (screenTopic(s)) return false;
  }
  return true;
}

/** Mirrors `evaluateCurrentItemQuality`'s own summary/detail floors so this
 * module can decide WHETHER a rewrite is worth attempting before spending a
 * Haiku call — an item that already clears the floors has nothing Card 2's
 * rewrite would fix, so it is never sent to the model. */
function isThin(summary: string, detail: string): boolean {
  return (
    sentenceCount(summary) < CURRENT_ITEM_QUALITY_THRESHOLDS.summaryMinSentences ||
    summary.trim().length < CURRENT_ITEM_QUALITY_THRESHOLDS.summaryMinChars ||
    wordCount(detail) < CURRENT_ITEM_QUALITY_THRESHOLDS.detailMinWords
  );
}

export interface BackfillItemReport {
  id: string;
  headline: string;
  imageBefore: boolean;
  imageAfter: boolean;
  summaryLenBefore: number;
  summaryLenAfter: number;
  rewroteCopy: boolean;
  /** True when a rewrite was attempted but deferred — no ANTHROPIC_API_KEY,
   * or the shared extract-stage Haiku budget (usage-store.ts's per-run/
   * daily caps) was already reserved out this run. Same "defer, not drop"
   * contract as the live extract stage: an item deferred this run is
   * simply picked up again on the next backfill run. */
  deferred: boolean;
  finalOk: boolean;
  holdReason?: QualityHoldReason;
}

export interface BackfillOneResult {
  report: BackfillItemReport;
  /** The row fields a non-dry-run caller should write back. Always
   * present — even a row that ends up still held gets its re-resolved
   * image/re-screened quality fields written, so the NEXT run (or the
   * read-time defense-in-depth filters) sees the current true state, not
   * a stale one. */
  update: {
    image_url: string | null;
    summary: string;
    detail: string;
    redline_ok: boolean;
    quality_hold_reason: string | null;
  };
}

/**
 * Re-enriches ONE current_item: resolve its image (Card 1), rewrite its
 * copy if thin (Card 2), re-run the publish gate (Card 3). Idempotent on a
 * row that already passes — `resolveImageUrl` re-returns an already-
 * allowlisted image unchanged without a network call, and `isThin` skips
 * the Haiku call entirely when the stored copy already clears the floors —
 * so running this against an already-good row is cheap and a no-op change.
 */
export async function backfillOneItem(
  item: BackfillCandidateRow,
  usage: ExtractUsageStore,
  today: string,
  fetchImpl: typeof fetch = fetch,
): Promise<BackfillOneResult> {
  const sources: ClusterSource[] = (item.sources ?? []).map((s) => ({
    outletName: s.name,
    url: s.url,
    tier: s.tier,
  }));

  // Card 1 reuse — same resolution order (story/stored image first, then
  // the best source's og:image/twitter:image), same allowlist.
  const resolvedImage = await resolveImageUrl(item.image_url, sources, fetchImpl);

  let summary = item.summary;
  let detail = item.detail;
  let rewroteCopy = false;
  let deferred = false;

  if (isThin(summary, detail)) {
    // Card 2 reuse: the SAME bounded/fail-soft article-text fetch and the
    // SAME forced-tool Haiku call the live extract stage uses. There is no
    // raw news_story cluster to re-read for an already-written
    // current_item, so the existing headline/summary stand in for the
    // "cluster" the model reads — exactly the shape extractWithLLM already
    // accepts (`items: [{ title, snippet }]`) — and real article text,
    // freshly fetched from the item's own cited sources, grounds the
    // rewrite rather than letting the model pad the stale one-liner.
    const articleTexts = await fetchTopArticleTexts(
      sources.map((s) => ({ url: s.url, tier: s.tier, outletName: s.outletName })),
      fetchImpl,
    );
    const extracted = await extractWithLLM(usage, {
      items: [{ title: item.headline, snippet: summary }],
      ...(articleTexts.length > 0 ? { articleTexts } : {}),
      symbolLexiconKeys: [],
      eraId: item.era_id,
      today,
    });
    if (extracted === null) {
      // No ANTHROPIC_API_KEY, or the shared extract-stage Haiku budget
      // (usage-store.ts) is reserved out this run — expected, not an
      // error; same "defer, don't drop" contract as run-extract-stage.ts.
      deferred = true;
    } else if ((extracted.kind === 'current_item' || extracted.kind === 'both') && extracted.currentItem) {
      summary = extracted.currentItem.summary;
      detail = extracted.currentItem.detail;
      rewroteCopy = true;
    }
    // A 'skip'/fan_signal-only verdict leaves summary/detail untouched: the
    // model found nothing it could responsibly rewrite (e.g. the article
    // text was itself too thin), so the gate below holds the row on its
    // original copy — the same outcome a fresh extraction choosing to skip
    // would produce, never an invented rewrite.
  }

  // Card 3 reuse: the SAME shared gate, re-run on the FINAL headline/
  // summary/detail/image — never the row's original (possibly already-
  // held) fields — so a rewrite or a newly-resolved image can actually
  // flip the verdict.
  const quality = evaluateCurrentItemQuality({
    headline: item.headline,
    summary,
    detail,
    imageUrl: resolvedImage,
    redlineOk: screenAll([item.headline, summary, detail]),
  });

  const report: BackfillItemReport = {
    id: item.id,
    headline: item.headline,
    imageBefore: Boolean(item.image_url && isAllowlistedImageHost(item.image_url)),
    imageAfter: Boolean(resolvedImage),
    summaryLenBefore: item.summary.length,
    summaryLenAfter: summary.length,
    rewroteCopy,
    deferred,
    finalOk: quality.ok,
    ...(quality.ok ? {} : { holdReason: quality.reason }),
  };

  return {
    report,
    update: {
      image_url: resolvedImage ?? null,
      summary,
      detail,
      redline_ok: quality.ok,
      quality_hold_reason: quality.ok ? null : (quality.reason ?? null),
    },
  };
}

export interface BackfillRunResult {
  considered: number;
  rewritten: number;
  imagesResolved: number;
  nowPassing: number;
  stillHeld: number;
  deferred: number;
  /** 0 in a dry run — writes are never attempted, only reported. */
  wroteBack: number;
  reports: BackfillItemReport[];
  errors: string[];
}

export interface RunBackfillOptions {
  /** Dry run NEVER writes to `current_item` — every row is resolved/
   * rewritten/re-screened the same as a live run (so the printed report is
   * the real would-be outcome, not a guess), the result is just never
   * persisted. */
  dryRun: boolean;
  limit?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Walks every live (non-expired, non-promoted) current_item and
 * re-enriches it via `backfillOneItem`, sharing ONE `ExtractUsageStore`
 * (usage-store.ts) across the whole run — the same durable per-run/daily
 * Haiku budget accounting the live extract stage uses, so a backfill run
 * can never blow past the existing cost ceiling just because it is a
 * different caller.
 */
export async function runBackfill(
  db: SupabaseClient,
  options: RunBackfillOptions,
): Promise<BackfillRunResult> {
  const { dryRun, limit, fetchImpl = fetch } = options;
  const errors: string[] = [];
  const reports: BackfillItemReport[] = [];
  const result: BackfillRunResult = {
    considered: 0,
    rewritten: 0,
    imagesResolved: 0,
    nowPassing: 0,
    stillHeld: 0,
    deferred: 0,
    wroteBack: 0,
    reports,
    errors,
  };

  const candidates = await loadBackfillCandidates(db, limit);
  const usage = await ExtractUsageStore.create(supabaseExtractUsageDb(db));
  const today = new Date().toISOString().slice(0, 10);

  for (const item of candidates) {
    result.considered++;
    try {
      const { report, update } = await backfillOneItem(item, usage, today, fetchImpl);
      reports.push(report);
      if (report.rewroteCopy) result.rewritten++;
      if (report.deferred) result.deferred++;
      if (!report.imageBefore && report.imageAfter) result.imagesResolved++;
      if (report.finalOk) result.nowPassing++;
      else result.stillHeld++;

      if (!dryRun) {
        const { error } = await db.from('current_item').update(update).eq('id', item.id);
        if (error) {
          errors.push(`write-back failed for ${item.id}: ${error.message}`);
        } else {
          result.wroteBack++;
        }
      }
    } catch (err) {
      // Stage-isolation discipline (same as run-extract-stage.ts's
      // per-cluster try/catch): one item's failure logs and continues,
      // never aborts the whole backfill run.
      errors.push(`backfill failed for ${item.id}: ${(err as Error).message}`);
    }
  }

  return result;
}
