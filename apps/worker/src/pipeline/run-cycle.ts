// One full pipeline cycle: ingest -> cluster -> classify -> verify -> store.
// One-shot: run once, exit (proposal §6) — no resident process. Stage
// isolation: a failing source/classify/verify pass logs and skips, never
// aborts the cycle (proposal §3) — every stage below is wrapped so one bad
// feed or one LLM hiccup can't take down the whole run.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  clusterBatch,
  computeVerificationStatus,
  LexicalSimilarityProvider,
  type ClusterableItem,
  type ExistingStory,
} from '@swift2/shared/news';
import { getAdapter } from '../sources/registry';
import { classifyByKeywords, type ClassifyResult } from '../classify/rule-based';
import { classifyWithLLM } from '../classify/openai-client';
import { UsageStore, supabaseUsageDb } from '../classify/usage-store';

const SUBJECT_TERMS = ['taylor swift', 'taylor', 'swift'];
const SIMILARITY_THRESHOLD = 0.5; // Orbit's proven starting point
const CLUSTER_WINDOW_HOURS = 72; // Orbit's rolling window for the lexical pass
const MAX_UNCLUSTERED_PER_CYCLE = 200;
const MAX_UNCLASSIFIED_PER_CYCLE = 50;

export interface CycleResult {
  sourcesPolled: number;
  itemsIngested: number;
  newStories: number;
  storiesClassified: number;
  storiesVerified: number;
  errors: string[];
}

export async function runCycle(db: SupabaseClient): Promise<CycleResult> {
  const errors: string[] = [];
  const result: CycleResult = {
    sourcesPolled: 0,
    itemsIngested: 0,
    newStories: 0,
    storiesClassified: 0,
    storiesVerified: 0,
    errors,
  };

  // ---- 1. INGEST -----------------------------------------------------------
  const { data: sources, error: sourcesError } = await db
    .from('news_source')
    .select('id, name, source_type, config')
    .eq('is_enabled', true);
  if (sourcesError) {
    errors.push(`could not load news_source rows: ${sourcesError.message}`);
    return result; // nothing else can run without sources
  }

  for (const source of sources ?? []) {
    const adapter = getAdapter(source.source_type);
    if (!adapter) {
      errors.push(
        `no adapter registered for source_type "${source.source_type}" (source "${source.name}")`,
      );
      continue;
    }
    try {
      const items = await adapter.fetch({
        id: source.id,
        name: source.name,
        sourceType: source.source_type,
        config: source.config ?? {},
      });
      if (items.length > 0) {
        const rows = items.map((item) => ({
          source_id: source.id,
          external_id: item.externalId,
          url: item.url,
          title: item.title,
          snippet: item.snippet ?? '',
          author: item.author ?? null,
          published_at: item.publishedAt ?? null,
          image_url: item.imageUrl ?? null,
        }));
        const { error: upsertError } = await db
          .from('news_raw_item')
          .upsert(rows, { onConflict: 'source_id,external_id', ignoreDuplicates: true });
        if (upsertError)
          errors.push(`raw_item upsert failed for "${source.name}": ${upsertError.message}`);
        else result.itemsIngested += rows.length;
      }
      result.sourcesPolled++;
      await db
        .from('news_source')
        .update({ last_polled_at: new Date().toISOString() })
        .eq('id', source.id);
    } catch (err) {
      errors.push(`ingest failed for "${source.name}": ${(err as Error).message}`);
    }
  }

  // ---- 2. CLUSTER / DEDUPE --------------------------------------------------
  // Separate query rather than chaining off the upsert above: catches
  // anything left unclustered by a prior cycle that crashed mid-run too, not
  // just this cycle's fresh inserts — the pipeline stays self-healing.
  const { data: unclustered, error: unclusteredError } = await db
    .from('news_raw_item')
    .select('id, title, url, snippet, image_url, published_at')
    .is('story_id', null)
    .limit(MAX_UNCLUSTERED_PER_CYCLE);
  if (unclusteredError) {
    errors.push(`could not load unclustered items: ${unclusteredError.message}`);
  } else if (unclustered && unclustered.length > 0) {
    try {
      const windowStart = new Date(Date.now() - CLUSTER_WINDOW_HOURS * 3_600_000).toISOString();
      const { data: recentLinked, error: recentError } = await db
        .from('news_raw_item')
        .select('story_id, similarity_key')
        .not('story_id', 'is', null)
        .not('similarity_key', 'is', null)
        .gte('created_at', windowStart);
      if (recentError) throw new Error(`recent-stories lookup: ${recentError.message}`);

      const byStory = new Map<string, string[]>();
      for (const row of recentLinked ?? []) {
        const list = byStory.get(row.story_id) ?? [];
        list.push(row.similarity_key);
        byStory.set(row.story_id, list);
      }
      const existingStories: ExistingStory[] = [...byStory.entries()].map(
        ([id, similarityKeys]) => ({ id, similarityKeys }),
      );

      const similarity = new LexicalSimilarityProvider();
      const clusterable: (ClusterableItem & { url: string; snippet: string; imageUrl?: string })[] =
        unclustered.map((r) => ({
          id: r.id,
          title: r.title,
          publishedAt: r.published_at ?? undefined,
          url: r.url,
          snippet: r.snippet ?? '',
          imageUrl: r.image_url ?? undefined,
        }));
      const { assignments, newStoryCount } = clusterBatch(
        clusterable,
        existingStories,
        similarity,
        {
          threshold: SIMILARITY_THRESHOLD,
          subjectTerms: SUBJECT_TERMS,
        },
      );

      // Create the new stories this batch formed, keyed by newStoryIndex.
      const newStoryIdByIndex = new Map<number, string>();
      if (newStoryCount > 0) {
        const representative = new Map<number, (typeof clusterable)[number]>();
        for (const a of assignments) {
          if (a.newStoryIndex !== undefined && !representative.has(a.newStoryIndex))
            representative.set(a.newStoryIndex, a.item);
        }
        // summary is seeded with the representative item's raw snippet — the
        // classify stage's INPUT text — and gets overwritten with the
        // LLM/rule-based OUTPUT summary once classified. Without this seed,
        // a freshly clustered story has nothing but its title to classify from.
        const rows = [...representative.entries()].map(([, item]) => ({
          canonical_title: item.title.slice(0, 500),
          summary: item.snippet.slice(0, 1000),
          top_image_url: item.imageUrl ?? null,
        }));
        const { data: inserted, error: insertError } = await db
          .from('news_story')
          .insert(rows)
          .select('id');
        if (insertError) throw new Error(`new-story insert: ${insertError.message}`);
        if (!inserted || inserted.length !== rows.length) {
          throw new Error(
            `new-story insert: expected ${rows.length} rows back, got ${inserted?.length ?? 0}`,
          );
        }
        // PostgREST preserves insert order in the returned rows, so index i
        // here lines up with rows[i] / the ordered representative keys below.
        [...representative.keys()].forEach((idx, i) => {
          const row = inserted[i];
          if (row) newStoryIdByIndex.set(idx, row.id);
        });
        result.newStories += newStoryCount;
      }

      // Attach every raw item to its resolved story id + persist its similarity key.
      for (const a of assignments) {
        const storyId = a.existingStoryId ?? newStoryIdByIndex.get(a.newStoryIndex!);
        if (!storyId) continue;
        const { error: attachError } = await db
          .from('news_raw_item')
          .update({ story_id: storyId, similarity_key: a.similarityKey })
          .eq('id', a.item.id);
        if (attachError) {
          errors.push(`attach raw_item ${a.item.id} to story: ${attachError.message}`);
          continue;
        }

        await recordStorySource(
          db,
          storyId,
          a.item as unknown as { id: string; url: string; source_id?: string },
          errors,
        );
      }

      if (assignments.length > 0) {
        const touchedStoryIds = [
          ...new Set(
            assignments
              .map((a) => a.existingStoryId ?? newStoryIdByIndex.get(a.newStoryIndex!))
              .filter(Boolean),
          ),
        ] as string[];
        await recomputeVerification(db, touchedStoryIds, errors);
        result.storiesVerified += touchedStoryIds.length;
      }
    } catch (err) {
      errors.push(`cluster stage failed: ${(err as Error).message}`);
    }
  }

  // ---- 3. CLASSIFY / RANK ----------------------------------------------------
  const { data: unclassified, error: unclassifiedError } = await db
    .from('news_story')
    .select('id, canonical_title, summary')
    .is('classified_at', null)
    .limit(MAX_UNCLASSIFIED_PER_CYCLE);
  if (unclassifiedError) {
    errors.push(`could not load unclassified stories: ${unclassifiedError.message}`);
  } else if (unclassified && unclassified.length > 0) {
    const usage = await UsageStore.create(supabaseUsageDb(db));
    for (const story of unclassified) {
      try {
        const input = { title: story.canonical_title, snippet: story.summary ?? '' };
        let classification: ClassifyResult | null = null;
        try {
          classification = await classifyWithLLM(usage, input);
        } catch (llmErr) {
          errors.push(
            `LLM classify failed for story ${story.id}, falling back to rule-based: ${(llmErr as Error).message}`,
          );
        }
        if (!classification) classification = classifyByKeywords(input.title, input.snippet);

        const { error: updateError } = await db
          .from('news_story')
          .update({
            canonical_title: classification.headline || story.canonical_title,
            summary: classification.summary,
            category: classification.category,
            importance: classification.importance,
            classified_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', story.id);
        if (updateError) throw new Error(updateError.message);
        result.storiesClassified++;
      } catch (err) {
        errors.push(`classify failed for story ${story.id}: ${(err as Error).message}`);
      }
    }
  }

  return result;
}

/** Inserts a news_story_source row if this (story, outlet) pair isn't already recorded. */
async function recordStorySource(
  db: SupabaseClient,
  storyId: string,
  rawItem: { id: string; url: string },
  errors: string[],
): Promise<void> {
  try {
    const { data: fullItem, error: itemError } = await db
      .from('news_raw_item')
      .select('source_id, url, news_source(name, tier)')
      .eq('id', rawItem.id)
      .maybeSingle();
    if (itemError || !fullItem) throw new Error(itemError?.message ?? 'raw item not found');

    const sourceMeta = (fullItem as unknown as { news_source: { name: string; tier: string } })
      .news_source;
    const { data: existing } = await db
      .from('news_story_source')
      .select('id')
      .eq('story_id', storyId)
      .eq('outlet_name', sourceMeta.name)
      .maybeSingle();
    if (existing) return; // already recorded for this outlet — corroboration counts distinct outlets, not raw items

    const { error: insertError } = await db.from('news_story_source').insert({
      story_id: storyId,
      raw_item_id: rawItem.id,
      outlet_name: sourceMeta.name,
      url: fullItem.url,
      tier: sourceMeta.tier,
    });
    if (insertError) throw new Error(insertError.message);
    // source_count itself is set by recomputeVerification's full recount
    // from news_story_source, called for every touched story right after
    // this — no separate counter/RPC needed here.
  } catch (err) {
    errors.push(`recordStorySource failed for story ${storyId}: ${(err as Error).message}`);
  }
}

/** Recomputes verification_status for the given stories from their current corroboration breakdown. */
async function recomputeVerification(
  db: SupabaseClient,
  storyIds: string[],
  errors: string[],
): Promise<void> {
  for (const storyId of storyIds) {
    try {
      const { data: sources, error } = await db
        .from('news_story_source')
        .select('tier')
        .eq('story_id', storyId);
      if (error) throw new Error(error.message);
      const status = computeVerificationStatus(
        (sources ?? []).map((s) => ({
          tier: s.tier as 'official' | 'established' | 'fan' | 'unverified',
        })),
      );
      const { error: updateError } = await db
        .from('news_story')
        .update({
          verification_status: status,
          verified_at: new Date().toISOString(),
          source_count: (sources ?? []).length,
        })
        .eq('id', storyId);
      if (updateError) throw new Error(updateError.message);
    } catch (err) {
      errors.push(`verify failed for story ${storyId}: ${(err as Error).message}`);
    }
  }
}
