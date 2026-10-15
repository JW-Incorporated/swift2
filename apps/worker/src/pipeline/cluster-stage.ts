import type { SupabaseClient } from '@supabase/supabase-js';
import {
  clusterBatch,
  CrossOutletSimilarityProvider,
  type ClusterableItem,
  type ExistingStory,
} from '@swift2/shared/news';
import type { CycleResult } from './downstream-stages';
import type { CycleOptions } from './ingest-stage';
import { recordStorySources, recomputeVerification } from './story-source-store';

const SUBJECT_TERMS = ['taylor swift', 'taylor', 'swift'];
const SIMILARITY_THRESHOLD = 1;
const CLUSTER_WINDOW_HOURS = 72;
const MAX_UNCLUSTERED_PER_CYCLE = 200;

export async function runClusterStage(
  db: SupabaseClient,
  options: CycleOptions,
  selectedSourceIds: string[],
  result: CycleResult,
): Promise<void> {
  let query = db
    .from('news_raw_item')
    .select('id, title, url, snippet, image_url, published_at')
    .is('story_id', null);
  if (options.primary) query = query.in('source_id', selectedSourceIds);
  const { data: unclustered, error } = await query.limit(MAX_UNCLUSTERED_PER_CYCLE);
  if (error) {
    result.errors.push(`could not load unclustered items: ${error.message}`);
    return;
  }
  if (!unclustered || unclustered.length === 0) return;

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
    const clusterable: (ClusterableItem & {
      url: string;
      snippet: string;
      imageUrl?: string;
    })[] = unclustered.map((row) => ({
      id: row.id,
      title: row.title,
      publishedAt: row.published_at ?? undefined,
      url: row.url,
      snippet: row.snippet ?? '',
      imageUrl: row.image_url ?? undefined,
    }));
    const { assignments, newStoryCount } = clusterBatch(
      clusterable,
      existingStories,
      new CrossOutletSimilarityProvider(),
      { threshold: SIMILARITY_THRESHOLD, subjectTerms: SUBJECT_TERMS },
    );

    const newStoryIdByIndex = new Map<number, string>();
    if (newStoryCount > 0) {
      const representative = new Map<number, (typeof clusterable)[number]>();
      for (const assignment of assignments) {
        if (
          assignment.newStoryIndex !== undefined &&
          !representative.has(assignment.newStoryIndex)
        ) {
          representative.set(assignment.newStoryIndex, assignment.item);
        }
      }
      const rows = [...representative.values()].map((item) => ({
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
      [...representative.keys()].forEach((index, position) => {
        const row = inserted[position];
        if (row) newStoryIdByIndex.set(index, row.id);
      });
      result.newStories += newStoryCount;
    }

    const attachments = assignments.flatMap((assignment) => {
      const storyId =
        assignment.existingStoryId ?? newStoryIdByIndex.get(assignment.newStoryIndex!);
      return storyId
        ? [{ storyId, similarityKey: assignment.similarityKey, item: assignment.item }]
        : [];
    });
    const attachResults = await Promise.all(
      attachments.map((attachment) =>
        db
          .from('news_raw_item')
          .update({
            story_id: attachment.storyId,
            similarity_key: attachment.similarityKey,
          })
          .eq('id', attachment.item.id),
      ),
    );
    const attachError = attachResults.find((response) => response.error)?.error;
    if (attachError) {
      result.errors.push(`batch attach raw_item -> story: ${attachError.message}`);
    } else if (attachments.length > 0) {
      await recordStorySources(
        db,
        attachments.map((attachment) => ({
          storyId: attachment.storyId,
          rawItem: { id: attachment.item.id },
        })),
        result.errors,
      );
      if (options.primary) {
        await recordFirstPublicAt(
          db,
          attachments.map((attachment) => ({
            storyId: attachment.storyId,
            publishedAt: attachment.item.publishedAt,
          })),
          result.errors,
        );
      }
    }

    const touchedStoryIds = [...new Set(attachments.map((attachment) => attachment.storyId))];
    await recomputeVerification(db, touchedStoryIds, result.errors);
    result.storiesVerified += touchedStoryIds.length;
  } catch (stageError) {
    result.errors.push(`cluster stage failed: ${(stageError as Error).message}`);
  }
}

/** Keep the earliest source-published timestamp ever observed for each story. */
export async function recordFirstPublicAt(
  db: SupabaseClient,
  items: { storyId: string; publishedAt?: string }[],
  errors: string[],
): Promise<void> {
  const earliestByStory = new Map<string, string>();
  for (const item of items) {
    if (!item.publishedAt || Number.isNaN(Date.parse(item.publishedAt))) continue;
    const previous = earliestByStory.get(item.storyId);
    if (!previous || Date.parse(item.publishedAt) < Date.parse(previous)) {
      earliestByStory.set(item.storyId, new Date(item.publishedAt).toISOString());
    }
  }
  if (earliestByStory.size === 0) return;

  try {
    const { data: existing, error } = await db
      .from('story_timeline')
      .select('story_id, first_public_at')
      .in('story_id', [...earliestByStory.keys()]);
    if (error) throw new Error(error.message);
    for (const row of existing ?? []) {
      if (!row.first_public_at || Number.isNaN(Date.parse(row.first_public_at))) continue;
      const candidate = earliestByStory.get(row.story_id);
      if (candidate && Date.parse(row.first_public_at) < Date.parse(candidate)) {
        earliestByStory.set(row.story_id, row.first_public_at);
      }
    }
    const rows = [...earliestByStory].map(([story_id, first_public_at]) => ({
      story_id,
      first_public_at,
    }));
    const { error: upsertError } = await db
      .from('story_timeline')
      .upsert(rows, { onConflict: 'story_id' });
    if (upsertError) throw new Error(upsertError.message);
  } catch (stageError) {
    resultError(errors, stageError);
  }
}

function resultError(errors: string[], error: unknown): void {
  errors.push(`story_timeline first_public_at failed: ${(error as Error).message}`);
}
