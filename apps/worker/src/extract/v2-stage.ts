// Glue between run-extract-stage.ts and the two-pass news writer
// (docs/decisions.md 2026-11-03). NEWS_WRITER_V2=off restores the legacy
// single-pass path exactly; unset or anything unrecognised means off; shadow runs v2 beside it; only 'on' enables v2.

import type { SupabaseClient } from '@supabase/supabase-js';
import { composePost, type ComposeTrace } from './compose-post';
import { buildContextPack, type ContextPack } from './context-pack';
import { loadEraContext, loadPriorItems } from './context-loader';
import type { ExtractedCurrentItem, ExtractedFact } from './types';
import {
  ExtractUsageStore,
  JUDGE_DAILY_CAP,
  JUDGE_PER_RUN_CAP,
  supabaseJudgeUsageDb,
  supabaseWriterUsageDb,
  WRITER_DAILY_CAP,
  WRITER_PER_RUN_CAP,
} from './usage-store';
import type { ClusterSource, WriterV2Write } from './write-knowledge';
import { worthAPost } from './worth-gate';

export type WriterMode = 'off' | 'shadow' | 'on';

/** off (default) = legacy path only; shadow = legacy writes, v2 runs and reports without touching the DB; on = v2 writes. */
export function writerMode(env: NodeJS.ProcessEnv = process.env): WriterMode {
  const value = (env.NEWS_WRITER_V2 ?? 'off').trim().toLowerCase();
  return value === 'on' || value === 'shadow' ? value : 'off';
}

export const DEFERRED_HOLDS: readonly string[] = ['writer_deferred', 'judge_deferred'];

export type V2Item = ExtractedCurrentItem & { facts: ExtractedFact[] };

export function hasFacts(item: ExtractedCurrentItem | undefined): item is V2Item {
  return !!item && Array.isArray(item.facts) && item.facts.length > 0;
}

export function createWriterStore(db: SupabaseClient): Promise<ExtractUsageStore> {
  return ExtractUsageStore.create(supabaseWriterUsageDb(db), WRITER_PER_RUN_CAP, WRITER_DAILY_CAP);
}

export function createJudgeStore(db: SupabaseClient): Promise<ExtractUsageStore> {
  return ExtractUsageStore.create(supabaseJudgeUsageDb(db), JUDGE_PER_RUN_CAP, JUDGE_DAILY_CAP);
}

/** The deterministic "worth a post" floor; a hold when the item fails it, undefined when it passes. */
export function tierFloorHold(item: V2Item, sources: readonly ClusterSource[]): WriterV2Write | undefined {
  const worth = worthAPost({ sources, category: item.category, statusHint: item.statusHint });
  return worth.ok ? undefined : { facts: item.facts, holdReason: worth.reason };
}

/** Runs pass B + the writing gate + the judge. A hold keeps the pass-A text on the (unservable) row; it is never served. */
export async function composeV2Item(
  db: SupabaseClient,
  stores: { writer: ExtractUsageStore; judge: ExtractUsageStore },
  item: V2Item,
  sources: readonly ClusterSource[],
  eraId: string,
): Promise<{ item: ExtractedCurrentItem; v2: WriterV2Write; trace: ComposeTrace; contextIds: string[]; context: ContextPack }> {
  const era = await loadEraContext(eraId);
  const context = buildContextPack({
    eraName: era.eraName,
    eraSummary: era.eraSummary,
    headline: item.headline,
    entities: item.entities,
    moments: era.moments,
    priorItems: await loadPriorItems(db, eraId, item.entities),
  });
  const composed = await composePost(stores, {
    headline: item.headline,
    statusHint: item.statusHint,
    facts: item.facts,
    context,
    sources,
  });
  const contextIds = context.items.map((i) => i.id);
  if (composed.status === 'hold') {
    return { item, v2: { facts: item.facts, holdReason: composed.reason }, trace: composed.trace, contextIds, context };
  }
  return {
    item: { ...item, summary: composed.lead, detail: composed.body },
    v2: { facts: item.facts, writingScore: composed.writingScore },
    trace: composed.trace,
    contextIds,
    context,
  };
}

/** v2 merge: re-runs the writer once from the merged facts and returns the prose, facts and score for the shared merge write (one atomic update). A deferral is a retry (nothing written); a quality hold returns no rewrite so the original copy stays and only sources/heat are added. */
export async function rewriteMergedOriginal(
  db: SupabaseClient,
  stores: { writer: ExtractUsageStore; judge: ExtractUsageStore },
  item: V2Item,
  sources: readonly ClusterSource[],
  eraId: string,
): Promise<{ deferred?: true; mergedSummary?: string; mergedDetail?: string; mergedFacts?: ExtractedFact[]; writingScore?: number }> {
  const { item: written, v2 } = await composeV2Item(db, stores, item, sources, eraId);
  if (v2.holdReason) return DEFERRED_HOLDS.includes(v2.holdReason) ? { deferred: true } : {};
  return {
    mergedSummary: written.summary,
    mergedDetail: written.detail,
    mergedFacts: v2.facts as ExtractedFact[],
    ...(v2.writingScore !== undefined ? { writingScore: v2.writingScore } : {}),
  };
}
