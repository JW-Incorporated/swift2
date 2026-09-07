// Theory Miner — screen, dedupe, and upsert to `fan_theory_candidate`
// (Community Engine plan §3.3, Phase 2 card P2-2). Sibling of
// ./write-knowledge.ts, same screen-before-write discipline as that
// module's `upsertLiveTheory` — a `fan_theory_candidate` row is only ever
// written once it has passed `screenTopic()`; unlike `current_item`/
// `fan_signal` (written-but-unservable on a failed screen, because those
// two are meant to reach the public feed with a `redline_ok` gate) this
// table never reaches the browser at all (service-role only, no anon/
// authenticated RLS policy — see the P0-1 migration's RLS section), and
// the plan's own §1 table is explicit: "The Theory Miner runs screenTopic()
// on every candidate and drops on hit" — a hit means the candidate is never
// stored, not stored-but-flagged.
//
// Dedupe: by `theory_key` (P0-1 migration's index on that column) — the
// same theory re-surfacing in a later post bundle bumps the existing row
// (mention_count, last_seen_on, communities, sample_urls, peak_score)
// rather than creating a duplicate. This mirrors write-knowledge.ts's
// upsertLiveTheory bump-vs-insert shape, but keyed by the model's own slug
// instead of a fuzzy name/symbol match — `theory_key` IS the dedupe key the
// schema/plan specify for this table, so there is no fuzzy-match step here.

import type { SupabaseClient } from '@supabase/supabase-js';
import { screenTopic } from '@swift2/shared/redline';
import type { ExtractedFanTheory } from './theory-types';

const MAX_SAMPLE_URLS = 3;

/** Screens every model-authored string on a theory candidate. A single hit
 * anywhere means the candidate is never stored at all (see module header —
 * unlike current_item/fan_signal, this table has no "written but
 * unservable" state). */
export function theoryCandidatePassesScreen(theory: ExtractedFanTheory): boolean {
  const strings = [theory.name, theory.claim, theory.evidenceSummary].filter((s): s is string =>
    Boolean(s),
  );
  for (const s of strings) {
    if (screenTopic(s)) return false;
  }
  return true;
}

export interface TheoryCandidateContext {
  /** e.g. 'TaylorSwift' (no 'reddit:' prefix — communities[] stores bare sub names, matching the plan's §3.4 "340 mentions · r/TaylorSwift" display). */
  community: string;
  /** Public post permalink — omitted (never invented) for a Facebook-sourced bundle, matching fan_theory_candidate.sample_urls' "empty for Facebook" column note. */
  permalink?: string;
  /** This post's own heat/score signal (e.g. comment count) — rolls into peak_score via max(), never averaged down. */
  score: number;
  /** ISO date (YYYY-MM-DD). */
  today: string;
}

interface ExistingCandidateRow {
  id: string;
  mention_count: number;
  peak_score: number;
  communities: string[];
  sample_urls: unknown;
}

export interface UpsertTheoryCandidateResult {
  id: string;
  created: boolean;
}

/**
 * Screens, then inserts a new `fan_theory_candidate` or bumps the existing
 * row matching `theory.theoryKey`. Returns `null` when the screen fails —
 * caller must never insert a row for a theory this returns null for (mirrors
 * write-knowledge.ts's theoryPassesScreen/upsertLiveTheory two-step: screen
 * BEFORE calling this, but this function re-screens on its own too, so a
 * caller can never accidentally skip the gate by forgetting the first call).
 */
export async function upsertTheoryCandidate(
  db: SupabaseClient,
  theory: ExtractedFanTheory,
  ctx: TheoryCandidateContext,
): Promise<UpsertTheoryCandidateResult | null> {
  if (!theoryCandidatePassesScreen(theory)) return null;

  const { data: existing, error: selectError } = await db
    .from('fan_theory_candidate')
    .select('id, mention_count, peak_score, communities, sample_urls')
    .eq('theory_key', theory.theoryKey)
    .maybeSingle();
  if (selectError) throw new Error(`fan_theory_candidate select failed: ${selectError.message}`);

  const sampleUrl = ctx.permalink;

  if (existing) {
    const row = existing as ExistingCandidateRow;
    const communities = row.communities.includes(ctx.community)
      ? row.communities
      : [...row.communities, ctx.community];
    const existingUrls = Array.isArray(row.sample_urls) ? (row.sample_urls as string[]) : [];
    const sampleUrls =
      sampleUrl && !existingUrls.includes(sampleUrl) && existingUrls.length < MAX_SAMPLE_URLS
        ? [...existingUrls, sampleUrl]
        : existingUrls;

    const { error: updateError } = await db
      .from('fan_theory_candidate')
      .update({
        last_seen_on: ctx.today,
        mention_count: row.mention_count + 1,
        peak_score: Math.max(row.peak_score, ctx.score),
        communities,
        sample_urls: sampleUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (updateError) throw new Error(`fan_theory_candidate update failed: ${updateError.message}`);
    return { id: row.id, created: false };
  }

  const { data, error } = await db
    .from('fan_theory_candidate')
    .insert({
      claim: theory.claim,
      theory_key: theory.theoryKey,
      mechanism: theory.mechanism ?? null,
      symbols: theory.symbols,
      track_slug: theory.trackSlug ?? null,
      predicts: theory.predicts ?? null,
      predicted_date: theory.predictedDate ?? null,
      evidence_summary: theory.evidenceSummary ?? null,
      first_seen_on: ctx.today,
      last_seen_on: ctx.today,
      mention_count: 1,
      peak_score: ctx.score,
      communities: [ctx.community],
      stance: theory.stance,
      status: 'candidate',
      redline_ok: true, // theoryCandidatePassesScreen already gated this call, same posture as upsertLiveTheory's insert branch
      sample_urls: sampleUrl ? [sampleUrl] : [],
    })
    .select('id')
    .single();
  if (error) throw new Error(`fan_theory_candidate insert failed: ${error.message}`);
  return { id: data.id as string, created: true };
}
