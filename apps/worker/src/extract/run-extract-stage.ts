// Orchestrates the extract stage (proposal §4.5/§4.6, PLAN.md Stage 3):
// pulls new clusters -> one Haiku call each -> screen/write/project -> abandon
// sweep -> refresh symbol_activity. Wired into pipeline/run-cycle.ts after
// classify, same stage-isolation discipline as the rest of run-cycle.ts — a
// single cluster's failure logs and continues, never aborts the whole stage.

import type { SupabaseClient } from '@supabase/supabase-js';
import { extractWithLLM } from './haiku-client';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import {
  writeCurrentItem,
  writeFanSignal,
  upsertLiveTheory,
  theoryPassesScreen,
  projectKnowledgeDoc,
  refreshSymbolActivity,
  abandonQuietTheories,
  type ClusterSource,
} from './write-knowledge';

// Same era-id convention as apps/web/lib/longlive/eras.ts's CURRENT_ERA_ID
// ('tloas'). MIRROR, NOT IMPORT (redline.ts's precedent, see its header):
// apps/worker cannot import from apps/web, and this value changes only when
// a new era begins — update both by hand together.
const CURRENT_ERA_ID = 'tloas';

const MAX_CLUSTERS_PER_CYCLE = 50;

export interface ExtractStageResult {
  clustersConsidered: number;
  extracted: number;
  screenedOut: number;
  skipped: number;
  deferred: number;
  theoriesUpserted: number;
  abandonedTheories: number;
  errors: string[];
}

interface PendingStory {
  id: string;
  canonical_title: string;
  summary: string | null;
}

async function loadRawItems(
  db: SupabaseClient,
  storyId: string,
): Promise<{ title: string; snippet: string }[]> {
  const { data, error } = await db
    .from('news_raw_item')
    .select('title, snippet')
    .eq('story_id', storyId)
    .limit(20);
  if (error) throw new Error(`raw item load failed for story ${storyId}: ${error.message}`);
  return (data ?? []).map((r) => ({ title: r.title as string, snippet: (r.snippet as string) ?? '' }));
}

async function loadClusterSources(db: SupabaseClient, storyId: string): Promise<ClusterSource[]> {
  const { data, error } = await db
    .from('news_story_source')
    .select('outlet_name, url, tier')
    .eq('story_id', storyId);
  if (error) throw new Error(`story source load failed for story ${storyId}: ${error.message}`);
  return (data ?? []).map((r) => ({
    outletName: r.outlet_name as string,
    url: r.url as string,
    tier: r.tier as ClusterSource['tier'],
  }));
}

export async function runExtractStage(db: SupabaseClient): Promise<ExtractStageResult> {
  const errors: string[] = [];
  const result: ExtractStageResult = {
    clustersConsidered: 0,
    extracted: 0,
    screenedOut: 0,
    skipped: 0,
    deferred: 0,
    theoriesUpserted: 0,
    abandonedTheories: 0,
    errors,
  };

  const { data: symbolRows, error: symbolError } = await db.from('symbol_lexicon').select('key');
  if (symbolError) errors.push(`symbol_lexicon load failed: ${symbolError.message}`);
  const symbolLexiconKeys = (symbolRows ?? []).map((r) => r.key as string);

  const { data: pending, error: pendingError } = await db
    .from('news_story')
    .select('id, canonical_title, summary')
    .not('classified_at', 'is', null)
    .is('extracted_at', null)
    .limit(MAX_CLUSTERS_PER_CYCLE);
  if (pendingError) {
    errors.push(`could not load pending clusters: ${pendingError.message}`);
    return result;
  }

  const today = new Date().toISOString().slice(0, 10);
  const usage = await ExtractUsageStore.create(supabaseExtractUsageDb(db));

  for (const story of (pending ?? []) as PendingStory[]) {
    result.clustersConsidered++;
    try {
      const [items, sources] = await Promise.all([
        loadRawItems(db, story.id),
        loadClusterSources(db, story.id),
      ]);
      const clusterItems = items.length > 0 ? items : [{ title: story.canonical_title, snippet: story.summary ?? '' }];

      const extracted = await extractWithLLM(usage, {
        items: clusterItems,
        symbolLexiconKeys,
        eraId: CURRENT_ERA_ID,
        today,
      });

      if (extracted === null) {
        // No key, or the per-run/daily cap is reserved out — leave
        // extracted_at unset so this cluster is retried next cycle
        // (proposal §4.5: deferred, not dropped).
        result.deferred++;
        continue;
      }

      if (extracted.kind === 'skip') {
        result.skipped++;
      } else {
        if (extracted.currentItem) {
          const written = await writeCurrentItem(db, story.id, CURRENT_ERA_ID, extracted.currentItem, sources);
          if (!written.redlineOk) result.screenedOut++;
          else {
            result.extracted++;
            await projectKnowledgeDoc(db, {
              id: `current:${written.id}`,
              kind: 'current_item',
              title: extracted.currentItem.headline,
              text: `${extracted.currentItem.summary} ${extracted.currentItem.detail}`.trim(),
              date: extracted.currentItem.observedOn,
              recencyDate: extracted.currentItem.observedOn,
              open: extracted.currentItem.statusHint === 'rumor' || extracted.currentItem.statusHint === 'reported',
              status: extracted.currentItem.statusHint,
              sourceTier: sources[0]?.tier ?? 'unverified',
              sources: sources.map((s) => ({ name: s.outletName, url: s.url, tier: s.tier })),
              eraId: CURRENT_ERA_ID,
              symbols: extracted.currentItem.symbols,
              entities: extracted.currentItem.entities,
              expiresAt: written.expiresAt,
              redlineOk: written.redlineOk,
            });
          }
        }
        if (extracted.fanSignal) {
          const theoryIds: string[] = [];
          for (const theory of extracted.fanSignal.theories) {
            // live_theory has no redline_ok column (write-knowledge.ts's
            // theoryPassesScreen doc comment) — screen BEFORE upserting,
            // never after; a failing theory is simply never stored.
            if (!theoryPassesScreen(theory)) {
              result.screenedOut++;
              continue;
            }
            const upserted = await upsertLiveTheory(db, theory, extracted.fanSignal.symbols, today);
            theoryIds.push(upserted.id);
            result.theoriesUpserted++;
            await projectKnowledgeDoc(db, {
              id: `ltheory:${upserted.id}`,
              kind: 'live_theory',
              title: theory.name,
              text: theory.claim,
              open: true,
              status: 'rumor',
              sourceTier: 'fan',
              sources: [],
              eraId: CURRENT_ERA_ID,
              symbols: extracted.fanSignal.symbols,
              entities: [],
              expiresAt: upserted.expiresAt,
              redlineOk: true,
            });
          }
          const written = await writeFanSignal(db, extracted.fanSignal, theoryIds, clusterItems.length);
          if (!written.redlineOk) result.screenedOut++;
          else {
            result.extracted++;
            await projectKnowledgeDoc(db, {
              id: `signal:${written.id}`,
              kind: 'fan_signal',
              title: extracted.fanSignal.topic,
              text: extracted.fanSignal.summary,
              open: true,
              status: 'reported',
              sourceTier: 'fan',
              sources: [],
              eraId: CURRENT_ERA_ID,
              symbols: extracted.fanSignal.symbols,
              entities: [],
              expiresAt: written.expiresAt,
              redlineOk: written.redlineOk,
            });
          }
        }
      }

      const { error: markError } = await db
        .from('news_story')
        .update({ extracted_at: new Date().toISOString() })
        .eq('id', story.id);
      if (markError) errors.push(`could not mark story ${story.id} extracted: ${markError.message}`);
    } catch (err) {
      errors.push(`extract failed for story ${story.id}: ${(err as Error).message}`);
    }
  }

  try {
    result.abandonedTheories = await abandonQuietTheories(db, today);
  } catch (err) {
    errors.push((err as Error).message);
  }

  try {
    await refreshSymbolActivity(db);
  } catch (err) {
    errors.push((err as Error).message);
  }

  return result;
}
