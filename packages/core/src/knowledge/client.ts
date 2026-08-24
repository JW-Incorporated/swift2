// Current-tier reads (proposal §6/§7, PLAN.md Stage 5/9) — read-only queries
// over the Current tier (`current_item`, `fan_signal`, `egg_ledger`,
// `symbol_activity`) and the shared retrieval index (`knowledge_doc`).
// Mirrors `../vault.ts`'s client pattern exactly (anon key, RLS-public reads,
// no session machinery) so web and the future Expo app share it the same
// way. The individual `search`/`precedents`/etc. functions below take a
// `SupabaseClient` directly (same convention as `apps/worker/src/extract/
// write-knowledge.ts`) so each is unit-testable against a fake client
// without going through `createKnowledgeClient`'s own `createClient` call.
//
// No embedding vendor is chosen yet (`HUMAN-ACTIONS.md` #12 item 2,
// docs/decisions.md 2026-08-23) and `knowledge_doc` shipped without an
// `embedding` column (`HUMAN-ACTIONS.md` #14) — `search` is FTS-only via the
// table's generated `tsv` column, not the hybrid cosine+FTS the proposal
// describes as the eventual shape.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CurrentItem, EggLedgerEntry, FanSignal, KnowledgeDoc, KnowledgeDocTier, SymbolActivity } from '@swift2/shared';
import {
  mapCurrentItem,
  mapEggLedgerEntry,
  mapFanSignal,
  mapKnowledgeDoc,
  mapSymbolActivity,
  type CurrentItemRow,
  type EggLedgerRow,
  type FanSignalRow,
  type KnowledgeDocRow,
  type SymbolActivityRow,
} from '../current-map';
import { dateMath } from './date-math';

export interface KnowledgeClientConfig {
  supabaseUrl: string;
  /** The public (anon / publishable) key — Current-tier reads are RLS
   * public, scoped to `redline_ok = true and not expired` at the policy
   * level (supabase/migrations/20260901000000_knowledge_engine.sql). */
  supabaseKey: string;
}

/** Filters accepted by `search()` — at minimum tier/era/symbol overlap per PLAN.md Stage 9. */
export interface KnowledgeSearchFilters {
  tier?: KnowledgeDocTier;
  eraId?: string;
  symbols?: string[];
}

/** `precedents()`'s grouping — by `mechanism`, not `technique` (empty table
 * tonight, docs/decisions.md 2026-08-23; see `getPrecedents` below). */
export interface PrecedentGroup {
  mechanism: string;
  entries: EggLedgerEntry[];
}

export interface KnowledgeDataSource {
  /**
   * Current-era `current_item` rows, newest-observed first. Rows already
   * promoted to a Vault moment (`promoted_to` set) are excluded here, not
   * left to the caller — once promoted, the Vault card is the one story
   * for that event, so a promoted row must never double up in the feed.
   */
  getCurrentItems(eraId: string): Promise<CurrentItem[]>;
  /** FTS-only hybrid search over `knowledge_doc` (proposal §7). `signal`
   * (Codex review BLOCKER 2, Clownbot agent loop) aborts the underlying
   * PostgREST fetch when the caller's wall-clock budget runs out — never
   * left to keep running server-side once abandoned. */
  search(query: string, filters?: KnowledgeSearchFilters, signal?: AbortSignal): Promise<KnowledgeDoc[]>;
  /** Confirmed egg/theory precedents touching `symbol`, grouped by `mechanism`. */
  precedents(symbol: string, signal?: AbortSignal): Promise<PrecedentGroup[]>;
  /** `current_item` rows observed in the last `days` days, newest first. */
  recent(days: number, signal?: AbortSignal): Promise<CurrentItem[]>;
  /** `fan_signal` rows matching `topic` (topic text or symbol overlap), heat-ordered. */
  chatter(topic: string, signal?: AbortSignal): Promise<FanSignal[]>;
  /** Weekly activity counts for `symbol` from the `symbol_activity` materialized view. */
  symbolActivity(symbol: string, signal?: AbortSignal): Promise<SymbolActivity[]>;
  /** A Vault track's `knowledge_doc` row by title (case-insensitive), or null if none. */
  track(title: string, signal?: AbortSignal): Promise<KnowledgeDoc | null>;
}

const CURRENT_ITEM_COLS =
  'id,story_id,observed_on,era_id,category,tags,headline,summary,detail,status,confidence,source_tier,sources,location_level,image_url,social_post,symbols,entities,heat,promoted_to,last_checked_on,expires_at,redline_ok,updated_at';

// Defensive ceiling, same intent as vault.ts's TIER0_MAX_ROWS: makes the
// payload boundary loud rather than an implicit PostgREST truncation. A
// single era's live slice should never approach this in practice.
const CURRENT_ITEM_MAX_ROWS = 500;

export async function getCurrentItems(db: SupabaseClient, eraId: string): Promise<CurrentItem[]> {
  const { data, error } = await db
    .from('current_item')
    .select(CURRENT_ITEM_COLS)
    .eq('era_id', eraId)
    .is('promoted_to', null)
    .order('observed_on', { ascending: false })
    .limit(CURRENT_ITEM_MAX_ROWS);

  if (error) throw new Error(`getCurrentItems: ${error.message}`);
  return ((data ?? []) as CurrentItemRow[]).map(mapCurrentItem);
}

/** `recent(days)` — same `promoted_to` exclusion as `getCurrentItems`, plus an
 * explicit `redline_ok = true` (RLS already scopes anon reads this way, same
 * as `getCurrentItems` relies on implicitly, but PLAN.md Stage 9 calls this
 * filter out explicitly, so it's stated here rather than only left to policy). */
export async function getRecentItems(db: SupabaseClient, days: number, signal?: AbortSignal): Promise<CurrentItem[]> {
  const cutoff = dateMath().daysAgo(days);
  let query_ = db
    .from('current_item')
    .select(CURRENT_ITEM_COLS)
    .gte('observed_on', cutoff)
    .eq('redline_ok', true)
    .is('promoted_to', null)
    .order('observed_on', { ascending: false })
    .limit(CURRENT_ITEM_MAX_ROWS);
  if (signal) query_ = query_.abortSignal(signal);
  const { data, error } = await query_;

  if (error) throw new Error(`recent: ${error.message}`);
  return ((data ?? []) as CurrentItemRow[]).map(mapCurrentItem);
}

const KNOWLEDGE_DOC_COLS =
  'id,kind,tier,title,text,date,recency_date,open,status,source_tier,sources,era_id,symbols,entities,expires_at,redline_ok';
const KNOWLEDGE_DOC_MAX_ROWS = 50;

/** FTS-only over `knowledge_doc.tsv` (Postgres `plainto_tsquery`/`@@` via
 * Supabase's `.textSearch()`) — hybrid cosine+FTS per the proposal once an
 * embedding vendor is chosen (`HUMAN-ACTIONS.md` #12 item 2); until then, a
 * blank `query` degrades to filters-only (no `.textSearch()` call at all —
 * `plainto_tsquery('')` matches nothing, which would silently empty every
 * filters-only lookup otherwise). */
export async function searchKnowledgeDocs(
  db: SupabaseClient,
  query: string,
  filters: KnowledgeSearchFilters = {},
  signal?: AbortSignal,
): Promise<KnowledgeDoc[]> {
  let builder = db.from('knowledge_doc').select(KNOWLEDGE_DOC_COLS);
  const trimmed = query.trim();
  if (trimmed) builder = builder.textSearch('tsv', trimmed, { type: 'plain', config: 'english' });
  if (filters.tier) builder = builder.eq('tier', filters.tier);
  if (filters.eraId) builder = builder.eq('era_id', filters.eraId);
  if (filters.symbols && filters.symbols.length > 0) builder = builder.overlaps('symbols', filters.symbols);

  let query_ = builder.order('updated_at', { ascending: false }).limit(KNOWLEDGE_DOC_MAX_ROWS);
  if (signal) query_ = query_.abortSignal(signal);
  const { data, error } = await query_;
  if (error) throw new Error(`search: ${error.message}`);
  return ((data ?? []) as KnowledgeDocRow[]).map(mapKnowledgeDoc);
}

const EGG_LEDGER_COLS =
  'id,hint_doc_id,reveal_doc_id,hint_date,reveal_date,lag_days,mechanism,symbols,era_id,confirmed,outcome,summary,sources';
const EGG_LEDGER_MAX_ROWS = 200;

/** `egg_ledger` rows whose `symbols` array contains `symbol`, grouped by
 * `mechanism`. Grouped by mechanism rather than joined against `technique`
 * on purpose — `technique` has zero rows tonight (PLAN.md Stage 4 note,
 * docs/decisions.md 2026-08-23), so this degrades to one ungrouped bucket
 * per mechanism actually seen; it never crashes or fabricates a join. */
export async function getPrecedents(db: SupabaseClient, symbol: string, signal?: AbortSignal): Promise<PrecedentGroup[]> {
  let query_ = db
    .from('egg_ledger')
    .select(EGG_LEDGER_COLS)
    .contains('symbols', [symbol])
    .order('hint_date', { ascending: false })
    .limit(EGG_LEDGER_MAX_ROWS);
  if (signal) query_ = query_.abortSignal(signal);
  const { data, error } = await query_;
  if (error) throw new Error(`precedents: ${error.message}`);

  const entries = ((data ?? []) as EggLedgerRow[]).map(mapEggLedgerEntry);
  const byMechanism = new Map<string, EggLedgerEntry[]>();
  for (const entry of entries) {
    const bucket = byMechanism.get(entry.mechanism);
    if (bucket) bucket.push(entry);
    else byMechanism.set(entry.mechanism, [entry]);
  }
  return [...byMechanism.entries()].map(([mechanism, group]) => ({ mechanism, entries: group }));
}

const FAN_SIGNAL_COLS =
  'id,window_start,window_end,platform,community,topic,summary,volume,heat,stance_mix,symbols,theory_ids,current_item_ids,sample_urls,expires_at,redline_ok';
const FAN_SIGNAL_MAX_ROWS = 200;

/** `fan_signal` rows matching `topic` — either a text match on `topic` or a
 * symbol-overlap match (chatter tagged with `topic` as a symbol key), merged
 * and deduped by id, heat-ordered. */
export async function getChatter(db: SupabaseClient, topic: string, signal?: AbortSignal): Promise<FanSignal[]> {
  let byTopicQuery = db
    .from('fan_signal')
    .select(FAN_SIGNAL_COLS)
    .ilike('topic', `%${topic}%`)
    .order('heat', { ascending: false })
    .limit(FAN_SIGNAL_MAX_ROWS);
  let bySymbolQuery = db
    .from('fan_signal')
    .select(FAN_SIGNAL_COLS)
    .contains('symbols', [topic])
    .order('heat', { ascending: false })
    .limit(FAN_SIGNAL_MAX_ROWS);
  if (signal) {
    byTopicQuery = byTopicQuery.abortSignal(signal);
    bySymbolQuery = bySymbolQuery.abortSignal(signal);
  }
  const [byTopic, bySymbol] = await Promise.all([byTopicQuery, bySymbolQuery]);
  if (byTopic.error) throw new Error(`chatter (topic): ${byTopic.error.message}`);
  if (bySymbol.error) throw new Error(`chatter (symbols): ${bySymbol.error.message}`);

  const merged = new Map<string, FanSignalRow>();
  for (const row of [...((byTopic.data ?? []) as FanSignalRow[]), ...((bySymbol.data ?? []) as FanSignalRow[])]) {
    merged.set(row.id, row);
  }
  return [...merged.values()].map(mapFanSignal).sort((a, b) => b.heat - a.heat);
}

const SYMBOL_ACTIVITY_COLS = 'symbol,week,n';
const SYMBOL_ACTIVITY_MAX_ROWS = 200;

export async function getSymbolActivity(db: SupabaseClient, symbol: string, signal?: AbortSignal): Promise<SymbolActivity[]> {
  let query_ = db
    .from('symbol_activity')
    .select(SYMBOL_ACTIVITY_COLS)
    .eq('symbol', symbol)
    .order('week', { ascending: false })
    .limit(SYMBOL_ACTIVITY_MAX_ROWS);
  if (signal) query_ = query_.abortSignal(signal);
  const { data, error } = await query_;
  if (error) throw new Error(`symbolActivity: ${error.message}`);
  return ((data ?? []) as SymbolActivityRow[]).map(mapSymbolActivity);
}

/** A Vault track's `knowledge_doc` row (`kind='track', tier='vault'` — the
 * `id: track:<eraId>:<slug>` shape Stage 4's canonical sync writes,
 * `scripts/lib/knowledge-rows.mjs`'s `buildTrackDoc`) by title, case-
 * insensitive. Title alone isn't guaranteed unique across eras, so this
 * takes the first match rather than erroring on more than one row. */
export async function getTrack(db: SupabaseClient, title: string, signal?: AbortSignal): Promise<KnowledgeDoc | null> {
  let query_ = db
    .from('knowledge_doc')
    .select(KNOWLEDGE_DOC_COLS)
    .eq('kind', 'track')
    .eq('tier', 'vault')
    .ilike('title', title)
    .limit(1);
  if (signal) query_ = query_.abortSignal(signal);
  const { data, error } = await query_;
  if (error) throw new Error(`track: ${error.message}`);
  const row = ((data ?? []) as KnowledgeDocRow[])[0];
  return row ? mapKnowledgeDoc(row) : null;
}

export function createKnowledgeClient(config: KnowledgeClientConfig): KnowledgeDataSource {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    getCurrentItems: (eraId: string) => getCurrentItems(supabase, eraId),
    search: (query: string, filters?: KnowledgeSearchFilters, signal?: AbortSignal) =>
      searchKnowledgeDocs(supabase, query, filters, signal),
    precedents: (symbol: string, signal?: AbortSignal) => getPrecedents(supabase, symbol, signal),
    recent: (days: number, signal?: AbortSignal) => getRecentItems(supabase, days, signal),
    chatter: (topic: string, signal?: AbortSignal) => getChatter(supabase, topic, signal),
    symbolActivity: (symbol: string, signal?: AbortSignal) => getSymbolActivity(supabase, symbol, signal),
    track: (title: string, signal?: AbortSignal) => getTrack(supabase, title, signal),
  };
}
