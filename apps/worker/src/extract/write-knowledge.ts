// Screen, write, project (proposal §4.6, PLAN.md Stage 3). Every stored
// string passes packages/shared/src/redline.ts's screenTopic() (the moved
// location ladder + topic gates) — a hit means redline_ok=false, the row is
// still written for audit, never marked servable (RLS on current_item/
// fan_signal/knowledge_doc already enforces `redline_ok = true` for anon
// reads, supabase/migrations/20260901000000_knowledge_engine.sql).

import type { SupabaseClient } from '@supabase/supabase-js';
import { screenTopic } from '@swift2/shared/redline';
import { SOURCE_TIERS, type SourceTier } from '@swift2/shared/news';
import type { CurrentItemCategory, CurrentItemStatus, TheoryConfidence } from '@swift2/shared';
import { frontDoorLink, theoriesBoardLink, evaluateCurrentItemQuality, type QualityHoldReason } from '@swift2/shared';
import { insertEvent } from '@swift2/core';
import type { ExtractedCurrentItem, ExtractedFanSignal, ExtractedTheory } from './types';
import {
  expiresAt,
  CURRENT_ITEM_EXPIRY_DAYS,
  FAN_SIGNAL_EXPIRY_DAYS,
  LIVE_THEORY_EXPIRY_DAYS,
} from './expiry';
import { findTheoryMatch } from './theory-match';

// Notifications Phase 2 producer seam (NOTIFICATIONS_PLAN.md, this task's
// instruction to "map where each existing pipeline currently emits its
// detections and document the exact seam"). SEAM: the news/extraction
// pipeline (apps/worker, scheduled every 4h by .github/workflows/
// news-worker.yml) is the only existing automated detector for
// song_drop/album_news/tour_news — there is no separate scraper for these;
// `current_item.category` 'release'/'music'/'tour' rows ARE the detection.
// This module's `writeCurrentItem()` is the exact point every such row
// passes through on its way to the DB, so it is the one insertEvent() call
// site for these three categories — no other file in this pipeline calls
// insertEvent() for them (keeps coupling to one helper call per pipeline,
// per this task's instruction).
//
// Phase 5 (NOTIFICATIONS_PLAN.md) extends this SAME seam to
// relationship_news, award_news, and public_appearance: the same
// news/extraction pipeline already classifies `current_item.category` as
// 'relationship' and 'award', and 'sighting'/'statement' cover public
// appearances and interviews per spec §4 ("public_appearance intentionally
// absorbs TV/interview appearances"). No new detector — this is the exact
// "map each to whatever existing detection pipeline is closest" case the
// Phase 5 task describes, not a stub.
//
// Gated on `statusHint === 'confirmed'`: T1 events are the highest-blast,
// highest-harm-from-false-positive category in the whole system (spec §12
// Q2's "false-positive T1 events" risk, this task's own recorded founder
// decision about the 5-min kill window existing precisely for this
// reason). A 'rumor'/'reported' current_item is real content for the site's
// feed, but firing an instant push to every T1-subscribed device on an
// unconfirmed report is a materially different, higher-stakes action than
// writing a row — so only 'confirmed' items produce a notification event.
// Phase 5 keeps this same discipline for the newly-wired T2/T3 categories:
// relationship/appearance/award news is exactly the kind of content where a
// false "confirmed" push would be the most damaging (spec's privacy-redline
// concerns apply hardest to `relationship`), so there's no reason to relax
// the gate just because the tier is lower.
const NOTIFICATION_CATEGORY_BY_CURRENT_ITEM: Partial<
  Record<
    CurrentItemCategory,
    'song_drop' | 'album_news' | 'tour_news' | 'relationship_news' | 'public_appearance' | 'award_news'
  >
> = {
  release: 'album_news',
  music: 'song_drop',
  tour: 'tour_news',
  relationship: 'relationship_news',
  sighting: 'public_appearance',
  statement: 'public_appearance',
  award: 'award_news',
};


async function emitLaunchCategoryEvent(
  db: SupabaseClient,
  currentItemId: string,
  item: ExtractedCurrentItem,
): Promise<void> {
  const category = NOTIFICATION_CATEGORY_BY_CURRENT_ITEM[item.category];
  if (!category || item.statusHint !== 'confirmed') return;
  try {
    await insertEvent(db, {
      category,
      title: item.headline,
      body: item.summary,
      deepLink: frontDoorLink(),
      // Deterministic on the SAME underlying detection so a re-extraction
      // of the same story cluster (news-worker.yml re-running against a
      // still-open story) never double-fires — dedupe_key's whole point
      // (spec §9, §10).
      dedupeKey: `${category}:current_item:${currentItemId}`,
    });
  } catch (err) {
    // A notification-event failure must never fail the knowledge write —
    // same stage-isolation discipline as every other producer in this
    // repo (run-cycle.ts's per-stage try/catch). Logged, not thrown.
    console.error(
      `emitLaunchCategoryEvent failed for current_item ${currentItemId}: ${(err as Error).message}`,
    );
  }
}

/** current_item.status has no confidence score of its own; the model reports
 * status_hint only. This is a deliberate, documented one-way mapping onto
 * the existing TheoryConfidence union (packages/shared/src/vault-types.ts),
 * not a re-derivation of status — `faded` maps to `plausible` rather than
 * `disproven` because "stopped being talked about" is not the same claim as
 * "shown false". */
const CONFIDENCE_BY_STATUS: Record<CurrentItemStatus, TheoryConfidence> = {
  rumor: 'plausible',
  reported: 'reputable_reporting',
  confirmed: 'official',
  debunked: 'disproven',
  faded: 'plausible',
};

export interface ClusterSource {
  outletName: string;
  url: string;
  tier: SourceTier;
}

/** Content fix 7: unions two source lists, deduped by URL — the original's
 * sources win on a collision (kept as-is) with the duplicate's novel sources
 * appended, same "union the sources" instruction the spec gives for both the
 * merge and the discard-only (no new info) paths. */
export function unionSources(
  original: readonly ClusterSource[],
  duplicate: readonly ClusterSource[],
): ClusterSource[] {
  const seen = new Set(original.map((s) => s.url));
  const merged = [...original];
  for (const s of duplicate) {
    if (seen.has(s.url)) continue;
    seen.add(s.url);
    merged.push(s);
  }
  return merged;
}

function bestSourceTier(tiers: readonly SourceTier[]): SourceTier {
  for (const tier of SOURCE_TIERS) if (tiers.includes(tier)) return tier;
  return 'unverified';
}

/** Screens every stored string on a current_item/fan_signal/theory. A single
 * hit anywhere fails the whole row — never partially redact model output. */
function screenAll(strings: readonly string[]): { ok: boolean; categories: string[] } {
  const categories = new Set<string>();
  for (const s of strings) {
    if (!s) continue;
    const hit = screenTopic(s);
    if (hit) categories.add(hit);
  }
  return { ok: categories.size === 0, categories: [...categories] };
}

/** Unlike current_item/fan_signal (written-but-unservable on a failed
 * screen), a live_theory that fails the screen must never be upserted at
 * all — screen BEFORE calling upsertLiveTheory, never after. live_theory
 * does carry redline_ok (20260903000000_live_theory_redline.sql), but it
 * exists as schema-level defense in depth for OTHER future writers; this
 * path's own safety comes from never writing a failing row in the first
 * place, so upsertLiveTheory always sets redline_ok: true. */
export function theoryPassesScreen(theory: ExtractedTheory): boolean {
  return screenAll([theory.name, theory.claim]).ok;
}

export interface WriteCurrentItemResult {
  id: string;
  redlineOk: boolean;
  expiresAt: string;
  /** Content fix 3/6: the publish-gate's held reason, undefined when the
   * row passed and is servable. Distinct from `redlineOk`, which here
   * reflects the COMBINED verdict (topic screen AND the quality gate) —
   * see `evaluateCurrentItemQuality`'s header for why the two are folded
   * into one `redline_ok` column rather than a second gating column. */
  holdReason?: QualityHoldReason;
}

export async function writeCurrentItem(
  db: SupabaseClient,
  storyId: string,
  eraId: string,
  item: ExtractedCurrentItem,
  sources: readonly ClusterSource[],
  countdownTargetAt?: string,
  imageUrl?: string,
): Promise<WriteCurrentItemResult> {
  const screen = screenAll([
    item.headline,
    item.summary,
    item.detail,
    ...item.tags,
    ...item.entities,
  ]);
  // Content fix 3/6 hard publish gate (packages/shared/src/current-item-
  // quality.ts): a row is only ever servable once it clears the SAME shared
  // validator the read-time paths (getCurrentItems/getRecentItems/
  // currentFeedEntries) check — image present + allowlisted, summary/detail
  // length floors, AND the existing redline screen above. The image is the
  // resolved `imageUrl` PARAMETER (Card 1 / #5628 threads it positionally,
  // and it is exactly what lands in the `image_url` column below) — never
  // read off `item`, or every row would be held as `missing_image`.
  const quality = evaluateCurrentItemQuality({
    headline: item.headline,
    summary: item.summary,
    detail: item.detail,
    imageUrl,
    redlineOk: screen.ok,
  });
  const itemExpiresAt = expiresAt(CURRENT_ITEM_EXPIRY_DAYS);
  const row = {
    story_id: storyId,
    observed_on: item.observedOn,
    era_id: eraId,
    category: item.category,
    tags: item.tags,
    headline: item.headline,
    summary: item.summary,
    detail: item.detail,
    status: item.statusHint,
    confidence: CONFIDENCE_BY_STATUS[item.statusHint],
    source_tier: bestSourceTier(sources.map((s) => s.tier)),
    sources: sources.map((s) => ({ name: s.outletName, url: s.url, tier: s.tier })),
    location_level: item.locationLevel ?? null,
    // Content fix 1/6: carries news_story.top_image_url (or the og:image/
    // twitter:image fallback resolved in image-resolve.ts) through to the
    // row the feed actually renders from — this is the exact write that was
    // previously missing, leaving every current_item imageless.
    image_url: imageUrl ?? null,
    symbols: item.symbols,
    entities: item.entities,
    heat: sources.length,
    last_checked_on: item.observedOn,
    expires_at: itemExpiresAt,
    redline_ok: quality.ok,
    quality_hold_reason: quality.ok ? null : quality.reason,
    countdown_target_at: countdownTargetAt ?? null,
  };
  const { data, error } = await db.from('current_item').insert(row).select('id').single();
  if (error) throw new Error(`current_item insert failed: ${error.message}`);
  const id = data.id as string;
  if (quality.ok && row.redline_ok) {
    await emitLaunchCategoryEvent(db, id, item);
  }
  return { id, redlineOk: quality.ok, expiresAt: itemExpiresAt, ...(quality.ok ? {} : { holdReason: quality.reason }) };
}

export interface MergeIntoOriginalInput {
  /** New facts already folded into a rewritten summary/detail by the dedupe
   * gate's merge call, or undefined when there's nothing new to fold in
   * (discard-only path — spec §A "same_event + nothing new"). */
  mergedSummary?: string;
  mergedDetail?: string;
  /** The duplicate news_story's sources, unioned into the original's. */
  duplicateSources: readonly ClusterSource[];
  /** The duplicate's resolved image_url, used to fill the original's image
   * only when the original had none (spec: "fill image_url if the original
   * had none"). */
  duplicateImageUrl?: string | null;
}

/** Content fix 7 (§A): the ORIGINAL current_item absorbs a confirmed
 * same-event duplicate. Rewrites summary/detail when the gate found new
 * facts (still re-screened and re-gated through evaluateCurrentItemQuality
 * exactly like a fresh write — a merge must never let a redline/quality
 * violation slip through a side door), unions sources (deduped by URL),
 * bumps heat by the duplicate's own source count, and refreshes
 * last_checked_on/updatedAt. Never touches `merged_into` on the ORIGINAL —
 * that column exists on the duplicate's row, pointing back at this one (see
 * `markDuplicateMerged` below). Factual enrichment is allowed after a
 * retraction, but visibility fields are guarded so no later merge can
 * re-show the row. */
export async function mergeNewFactsIntoOriginal(
  db: SupabaseClient,
  originalId: string,
  original: { summary: string; detail: string; headline: string; sources: readonly ClusterSource[]; imageUrl?: string | null },
  input: MergeIntoOriginalInput,
): Promise<{ redlineOk: boolean; holdReason?: QualityHoldReason }> {
  const sources = unionSources(original.sources, input.duplicateSources);
  const imageUrl = original.imageUrl ?? (input.duplicateImageUrl || null);

  const hasRewrite = input.mergedSummary !== undefined || input.mergedDetail !== undefined;
  const rewriteSummary = input.mergedSummary ?? original.summary;
  const rewriteDetail = input.mergedDetail ?? original.detail;

  // Content fix 7 must-fix: a merge rewrite goes through the SAME publish
  // gate a fresh write does (evaluateCurrentItemQuality) — never let a
  // rewrite that would have failed writeCurrentItem's own gate slip
  // through this side door. headline/summary/detail here are the rewrite's
  // own text (or, on the discard-only path with no rewrite at all, the
  // original's own text, which this still re-checks because the image may
  // have just changed). imageUrl is whatever this update is about to set
  // on the row — the original's existing image, or the duplicate's when
  // the original had none.
  const rewriteScreen = screenAll([original.headline, rewriteSummary, rewriteDetail]);
  const rewriteQuality = evaluateCurrentItemQuality({
    headline: original.headline,
    summary: rewriteSummary,
    detail: rewriteDetail,
    imageUrl: imageUrl ?? undefined,
    redlineOk: rewriteScreen.ok,
  });

  // A failing rewrite must never overwrite the original's good copy: fall
  // back to the original's own summary/detail, but the sources union and
  // the duplicate's discard (markDuplicateMerged, called by the caller)
  // still happen regardless — only the TEXT is protected.
  const useRewrite = !hasRewrite || rewriteQuality.ok;
  const summary = useRewrite ? rewriteSummary : original.summary;
  const detail = useRewrite ? rewriteDetail : original.detail;

  // When falling back to the original's text, it still needs its own
  // fresh verdict (the image/sources just changed even though the text
  // didn't) rather than reusing the rewrite's failing one.
  const screen = useRewrite ? rewriteScreen : screenAll([original.headline, summary, detail]);
  const quality = useRewrite
    ? rewriteQuality
    : evaluateCurrentItemQuality({
        headline: original.headline,
        summary,
        detail,
        imageUrl: imageUrl ?? undefined,
        redlineOk: screen.ok,
      });

  const facts: Record<string, unknown> = {
    summary,
    detail,
    sources: sources.map((s) => ({ name: s.outletName, url: s.url, tier: s.tier })),
    source_tier: bestSourceTier(sources.map((s) => s.tier)),
    heat: sources.length,
    image_url: imageUrl,
    last_checked_on: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };
  const visibility: Record<string, unknown> = {
    redline_ok: quality.ok,
    quality_hold_reason: quality.ok ? null : quality.reason,
  };
  const { error: factsError } = await db.from('current_item').update(facts)
    .eq('id', originalId);
  if (factsError) throw new Error(`mergeNewFactsIntoOriginal facts update failed: ${factsError.message}`);
  const { error: visibilityError } = await db.from('current_item').update(visibility)
    .eq('id', originalId)
    .is('retracted_at', null);
  if (visibilityError) throw new Error(`mergeNewFactsIntoOriginal visibility update failed: ${visibilityError.message}`);
  return { redlineOk: quality.ok, ...(quality.ok ? {} : { holdReason: quality.reason }) };
}

/** Content fix 7 (§A/§C): hides a duplicate current_item behind the
 * `merged_into` pointer instead of writing it as a new row (or, for the
 * live-cleanup script, instead of ever un-hiding an existing one) — never a
 * hard delete (spec §C: "HIDES the duplicates... never hard-delete"). The
 * read-time collapse (packages/experience/src/current-feed.ts) also filters
 * on this column as a second line of defense. */
export async function markDuplicateMerged(db: SupabaseClient, duplicateId: string, originalId: string): Promise<void> {
  const { error } = await db
    .from('current_item')
    .update({ merged_into: originalId, expires_at: new Date().toISOString() })
    .eq('id', duplicateId);
  if (error) throw new Error(`markDuplicateMerged failed: ${error.message}`);
}

export interface WriteFanSignalResult {
  id: string;
  redlineOk: boolean;
  expiresAt: string;
}

export async function writeFanSignal(
  db: SupabaseClient,
  signal: ExtractedFanSignal,
  theoryIds: readonly string[],
  volume: number,
): Promise<WriteFanSignalResult> {
  const theoryClaims = signal.theories.flatMap((t) => [t.name, t.claim]);
  const screen = screenAll([signal.topic, signal.summary, ...theoryClaims]);
  const now = new Date();
  const signalExpiresAt = expiresAt(FAN_SIGNAL_EXPIRY_DAYS);
  const row = {
    window_start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    window_end: now.toISOString(),
    platform: 'news',
    community: 'news:aggregate',
    topic: signal.topic,
    summary: signal.summary,
    volume,
    heat: volume,
    stance_mix: signal.stanceMix,
    symbols: signal.symbols,
    theory_ids: theoryIds,
    current_item_ids: [],
    sample_urls: [],
    expires_at: signalExpiresAt,
    redline_ok: screen.ok,
  };
  const { data, error } = await db.from('fan_signal').insert(row).select('id').single();
  if (error) throw new Error(`fan_signal insert failed: ${error.message}`);
  return { id: data.id as string, redlineOk: screen.ok, expiresAt: signalExpiresAt };
}

interface ExistingLiveTheory {
  id: string;
  name: string;
  symbols: string[];
  heat: number;
}

export interface UpsertLiveTheoryResult {
  id: string;
  expiresAt: string;
}

/** Upserts one theory: bumps last_seen_on/heat on a matching existing row
 * (name similarity + symbol overlap >= 0.5, theory-match.ts), else inserts.
 * Caller must screen with theoryPassesScreen() first — this function trusts
 * the theory is already safe to store.
 *
 * Phase 5 producer seam for `easter_egg`'s instant tier (spec §4:
 * `easter_egg` supports Instant · Daily · Weekly · Off, not just the
 * Phase 3 Weekly Clown Report digest). SEAM: this is the only existing
 * pipeline that detects a NEW theory (as opposed to a re-observation of one
 * already tracked) — theory-match.ts's findTheoryMatch() is the detector.
 * insertEvent() fires only on the fresh-insert branch below, never on a
 * bump, so a theory that keeps getting re-mentioned notifies once, not on
 * every re-observation (same "insert = detection, not resend" discipline
 * every other producer in this pipeline follows). A notification-event
 * failure never fails the theory write (try/catch, logged not thrown) —
 * same stage-isolation posture as emitLaunchCategoryEvent above. */
export async function upsertLiveTheory(
  db: SupabaseClient,
  theory: ExtractedTheory,
  symbols: readonly string[],
  today: string,
): Promise<UpsertLiveTheoryResult> {
  const { data: existingRows, error: selectError } = await db
    .from('live_theory')
    .select('id, name, symbols, heat')
    .neq('status', 'abandoned');
  if (selectError) throw new Error(`live_theory select failed: ${selectError.message}`);

  const match = findTheoryMatch(
    { name: theory.name, symbols },
    (existingRows ?? []) as ExistingLiveTheory[],
  );
  const theoryExpiresAt = expiresAt(LIVE_THEORY_EXPIRY_DAYS);

  if (match) {
    const { error: updateError } = await db
      .from('live_theory')
      .update({
        last_seen_on: today,
        heat: match.heat + 1,
        expires_at: theoryExpiresAt,
      })
      .eq('id', match.id);
    if (updateError) throw new Error(`live_theory update failed: ${updateError.message}`);
    return { id: match.id, expiresAt: theoryExpiresAt };
  }

  const { data, error } = await db
    .from('live_theory')
    .insert({
      name: theory.name,
      claim: theory.claim,
      first_seen_on: today,
      last_seen_on: today,
      origin: 'fan',
      status: 'rumor',
      outcome: 'pending',
      symbols,
      heat: 1,
      expires_at: theoryExpiresAt,
      redline_ok: true,
    })
    .select('id')
    .single();
  if (error) throw new Error(`live_theory insert failed: ${error.message}`);
  const id = data.id as string;
  await emitEasterEggEvent(db, id, theory);
  return { id, expiresAt: theoryExpiresAt };
}

async function emitEasterEggEvent(
  db: SupabaseClient,
  theoryId: string,
  theory: ExtractedTheory,
): Promise<void> {
  try {
    await insertEvent(db, {
      category: 'easter_egg',
      title: 'New theory in play',
      body: theory.name || theory.claim,
      deepLink: theoriesBoardLink(),
      // One event per theory id — a re-observation of the SAME theory never
      // reaches this function (it takes the update/bump branch above), so
      // this key is only ever inserted once per theory's lifetime.
      dedupeKey: `easter_egg:live_theory:${theoryId}`,
    });
  } catch (err) {
    console.error(
      `emitEasterEggEvent failed for live_theory ${theoryId}: ${(err as Error).message}`,
    );
  }
}

/** Flips any live_theory quiet >=45d to `abandoned` (proposal §4.6) — run
 * once per cycle, no separate cron needed. */
export async function abandonQuietTheories(db: SupabaseClient, today: string): Promise<number> {
  const cutoff = new Date(new Date(`${today}T00:00:00Z`).getTime() - 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const { data, error } = await db
    .from('live_theory')
    .update({ status: 'abandoned' })
    .neq('status', 'abandoned')
    .lt('last_seen_on', cutoff)
    .select('id');
  if (error) throw new Error(`abandon-quiet-theories failed: ${error.message}`);
  return data?.length ?? 0;
}

export async function projectKnowledgeDoc(
  db: SupabaseClient,
  doc: {
    id: string;
    kind: 'current_item' | 'fan_signal' | 'live_theory';
    title: string;
    text: string;
    date?: string;
    recencyDate?: string;
    open: boolean;
    status: string;
    sourceTier: string;
    sources: readonly { name: string; url: string; tier: string }[];
    eraId?: string;
    symbols: readonly string[];
    entities: readonly string[];
    expiresAt?: string;
    redlineOk: boolean;
  },
): Promise<void> {
  const row = {
    id: doc.id,
    kind: doc.kind,
    tier: 'current' as const,
    title: doc.title,
    text: doc.text,
    date: doc.date ?? null,
    recency_date: doc.recencyDate ?? null,
    open: doc.open,
    status: doc.status,
    source_tier: doc.sourceTier,
    sources: doc.sources,
    era_id: doc.eraId ?? null,
    symbols: doc.symbols,
    entities: doc.entities,
    expires_at: doc.expiresAt ?? null,
    redline_ok: doc.redlineOk,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from('knowledge_doc').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`knowledge_doc upsert failed for ${doc.id}: ${error.message}`);
}

export async function refreshSymbolActivity(db: SupabaseClient): Promise<void> {
  const { error } = await db.rpc('refresh_symbol_activity');
  if (error) throw new Error(`refresh_symbol_activity failed: ${error.message}`);
}
