// Screen, write, project (proposal §4.6, PLAN.md Stage 3). Every stored
// string passes packages/shared/src/redline.ts's screenTopic() (the moved
// location ladder + topic gates) — a hit means redline_ok=false, the row is
// still written for audit, never marked servable (RLS on current_item/
// fan_signal/knowledge_doc already enforces `redline_ok = true` for anon
// reads, supabase/migrations/20260901000000_knowledge_engine.sql).

import type { SupabaseClient } from '@supabase/supabase-js';
import { screenTopic } from '@swift2/shared/redline';
import { SOURCE_TIERS, type SourceTier } from '@swift2/shared/news';
import type { CurrentItemStatus, TheoryConfidence } from '@swift2/shared';
import type { ExtractedCurrentItem, ExtractedFanSignal, ExtractedTheory } from './types';
import { expiresAt, CURRENT_ITEM_EXPIRY_DAYS, FAN_SIGNAL_EXPIRY_DAYS, LIVE_THEORY_EXPIRY_DAYS } from './expiry';
import { findTheoryMatch } from './theory-match';

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

/** live_theory carries no redline_ok column (migration's own RLS comment:
 * "theories only ever derive from already-screened content") — so unlike
 * current_item/fan_signal, a theory that fails the screen must never be
 * upserted at all, not written-but-unservable. Screen BEFORE calling
 * upsertLiveTheory, never after. */
export function theoryPassesScreen(theory: ExtractedTheory): boolean {
  return screenAll([theory.name, theory.claim]).ok;
}

export interface WriteCurrentItemResult {
  id: string;
  redlineOk: boolean;
  expiresAt: string;
}

export async function writeCurrentItem(
  db: SupabaseClient,
  storyId: string,
  eraId: string,
  item: ExtractedCurrentItem,
  sources: readonly ClusterSource[],
): Promise<WriteCurrentItemResult> {
  const screen = screenAll([item.headline, item.summary, item.detail, ...item.tags, ...item.entities]);
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
    symbols: item.symbols,
    entities: item.entities,
    heat: sources.length,
    last_checked_on: item.observedOn,
    expires_at: itemExpiresAt,
    redline_ok: screen.ok,
  };
  const { data, error } = await db.from('current_item').insert(row).select('id').single();
  if (error) throw new Error(`current_item insert failed: ${error.message}`);
  return { id: data.id as string, redlineOk: screen.ok, expiresAt: itemExpiresAt };
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
 * the theory is already safe to store. */
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
    })
    .select('id')
    .single();
  if (error) throw new Error(`live_theory insert failed: ${error.message}`);
  return { id: data.id as string, expiresAt: theoryExpiresAt };
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
