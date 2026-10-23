// One full pipeline cycle: ingest -> cluster -> classify -> verify -> store.
// One-shot: run once, exit (proposal §6) — no resident process. Stage
// isolation: a failing source/classify/verify pass logs and skips, never
// aborts the cycle (proposal §3) — every stage below is wrapped so one bad
// feed or one LLM hiccup can't take down the whole run.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  clusterBatch,
  CrossOutletSimilarityProvider,
  type ClusterableItem,
  type ExistingStory,
} from '@swift2/shared/news';
import { classifyByKeywords, type ClassifyResult } from '../classify/rule-based';
import { classifyWithLLM } from '../classify/openai-client';
import { UsageStore, supabaseUsageDb } from '../classify/usage-store';
import { runExtractStage, type ExtractStageResult } from '../extract/run-extract-stage';
import { runIngestStage, type CycleOptions } from './ingest-stage';
import {
  recomputeVerification,
  recordFirstPublicAt,
  recordStorySources,
} from './story-source-store';

export { recordFirstPublicAt } from './story-source-store';

const SUBJECT_TERMS = ['taylor swift', 'taylor', 'swift'];
// CrossOutletSimilarityProvider.similarity() is binary (1/0, see its module
// doc) — replaces the old lexical-shingle threshold of 0.5, which only
// caught near-identical titles and missed the same event covered by
// different outlets in different words (proposal §4.1.1).
const SIMILARITY_THRESHOLD = 1;
const CLUSTER_WINDOW_HOURS = 72; // Orbit's rolling window for the lexical pass
const MAX_UNCLUSTERED_PER_CYCLE = 200;
const MAX_UNCLASSIFIED_PER_CYCLE = 50;

export interface CycleResult {
  sourcesPolled: number;
  itemsIngested: number;
  newStories: number;
  storiesClassified: number;
  storiesVerified: number;
  extract: ExtractStageResult;
  errors: string[];
  warnings: string[];
}

export type { CycleOptions } from './ingest-stage';

export async function runCycle(
  db: SupabaseClient,
  options: CycleOptions = {},
): Promise<CycleResult> {
  const errors: string[] = [];
  const result: CycleResult = {
    sourcesPolled: 0,
    itemsIngested: 0,
    newStories: 0,
    storiesClassified: 0,
    storiesVerified: 0,
    extract: {
      clustersConsidered: 0,
      extracted: 0,
      screenedOut: 0,
      skipped: 0,
      deferred: 0,
      theoriesUpserted: 0,
      abandonedTheories: 0,
      countdownsResolved: 0,
      dedupeMerged: 0,
      dedupeDiscarded: 0,
      dedupeHeld: 0,
      heldImagesChecked: 0,
      heldImagesPublished: 0,
      errors: [],
    },
    errors,
    warnings: [],
  };

  // ---- 1. INGEST -----------------------------------------------------------
  const primarySourceIds = await runIngestStage(db, options, result);
  if (!primarySourceIds) return result;

  // ---- 2. CLUSTER / DEDUPE --------------------------------------------------
  // Separate query rather than chaining off the upsert above: catches
  // anything left unclustered by a prior cycle that crashed mid-run too, not
  // just this cycle's fresh inserts — the pipeline stays self-healing.
  let unclusteredQuery = db
    .from('news_raw_item')
    .select('id, title, url, snippet, image_url, published_at')
    .is('story_id', null);
  if (options.primary) unclusteredQuery = unclusteredQuery.in('source_id', primarySourceIds);
  const { data: unclustered, error: unclusteredError } = await unclusteredQuery.limit(
    MAX_UNCLUSTERED_PER_CYCLE,
  );
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

      const similarity = new CrossOutletSimilarityProvider();
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

      // Attach every raw item to its resolved story id + persist its similarity
      // key in a single batched upsert (was one UPDATE per raw item).
      const attachRows = assignments
        .map((a) => {
          const storyId = a.existingStoryId ?? newStoryIdByIndex.get(a.newStoryIndex!);
          return storyId ? { storyId, similarityKey: a.similarityKey, item: a.item } : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (attachRows.length > 0) {
        // Per-row UPDATE, not upsert: every id here already exists (it came
        // from the `unclustered` select above). A blanket .upsert() issues
        // INSERT ... ON CONFLICT DO UPDATE under the hood, and Postgres
        // validates the INSERT branch's NOT NULL columns (source_id,
        // external_id, url, ...) even though the row always resolves to the
        // UPDATE branch — that mismatch is what broke every scheduled run
        // (#3746): "null value in column source_id ... violates not-null
        // constraint". An explicit .update() only ever touches the columns
        // named here and never constructs a candidate INSERT row.
        const attachResults = await Promise.all(
          attachRows.map((r) =>
            db
              .from('news_raw_item')
              .update({ story_id: r.storyId, similarity_key: r.similarityKey })
              .eq('id', r.item.id),
          ),
        );
        const attachError = attachResults.find((res) => res.error)?.error;
        if (attachError) {
          errors.push(`batch attach raw_item -> story: ${attachError.message}`);
        } else {
          await recordStorySources(
            db,
            attachRows.map((r) => ({
              storyId: r.storyId,
              rawItem: r.item as unknown as { id: string; url: string },
            })),
            errors,
          );
          if (options.primary) {
            await recordFirstPublicAt(
              db,
              attachRows.map((r) => ({
                storyId: r.storyId,
                publishedAt: r.item.publishedAt,
              })),
              errors,
            );
          }
        }
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

  // Fast mode only detects primary-source stories. Classification and
  // extraction stay on the normal cycle so this path makes no LLM calls.
  if (options.primary) return result;

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

  // ---- 4. EXTRACT / SCREEN / WRITE ------------------------------------------
  try {
    result.extract = await runExtractStage(db);
    errors.push(...result.extract.errors);
  } catch (err) {
    errors.push(`extract stage failed: ${(err as Error).message}`);
  }

  return result;
}
