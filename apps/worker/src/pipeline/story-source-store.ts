import type { SupabaseClient } from '@supabase/supabase-js';
import type { SourceTier, VerificationStatus } from '@swift2/shared/news';
import {
  collapseStorySourceRows,
  planStorySources,
  storySourceConflictKey,
  storyVerification,
  type StorySourceCandidate,
  type StorySourceRow,
} from './story-sources';

export interface RawItemRow {
  id: string;
  external_id: string | null;
  url: string;
  title: string;
  snippet: string;
  author: string | null;
  publisher: string | null;
  publisher_url: string | null;
  resolved_tier: SourceTier | null;
  news_source: { name: string; tier: SourceTier; source_type: string };
}

export interface ExistingSourceRow {
  id: string;
  story_id: string;
  raw_item_id: string | null;
  outlet_name: string;
  url: string;
  tier: SourceTier;
}

export interface StorySourceStore {
  loadRawItems(ids: string[]): Promise<RawItemRow[]>;
  loadExisting(storyIds: string[]): Promise<ExistingSourceRow[]>;
  upsertSources(rows: StorySourceRow[]): Promise<void>;
  deleteSources(ids: string[]): Promise<void>;
  updateStory(
    id: string,
    update: { verification_status: VerificationStatus; verified_at: string; source_count: number },
  ): Promise<void>;
}

function supabaseStore(db: SupabaseClient): StorySourceStore {
  return {
    async loadRawItems(ids) {
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from('news_raw_item')
        .select(
          'id, external_id, url, title, snippet, author, publisher, publisher_url, resolved_tier, news_source(name, tier, source_type)',
        )
        .in('id', ids);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as RawItemRow[];
    },
    async loadExisting(storyIds) {
      if (storyIds.length === 0) return [];
      const { data, error } = await db
        .from('news_story_source')
        .select('id, story_id, raw_item_id, outlet_name, url, tier')
        .in('story_id', storyIds);
      if (error) throw new Error(error.message);
      return (data ?? []) as ExistingSourceRow[];
    },
    async upsertSources(rows) {
      const { error } = await db
        .from('news_story_source')
        .upsert(rows, { onConflict: 'story_id,outlet_name' });
      if (error) throw new Error(error.message);
    },
    async deleteSources(ids) {
      const { error } = await db.from('news_story_source').delete().in('id', ids);
      if (error) throw new Error(error.message);
    },
    async updateStory(id, update) {
      const { error } = await db.from('news_story').update(update).eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}

function candidateFromRaw(storyId: string, raw: RawItemRow): StorySourceCandidate {
  return {
    storyId,
    rawItemId: raw.id,
    externalId: raw.external_id,
    title: raw.title,
    snippet: raw.snippet,
    author: raw.author,
    sourceType: raw.news_source.source_type,
    outletName: raw.publisher?.trim() || raw.news_source.name,
    publisherUrl: raw.publisher_url,
    articleUrl: raw.url,
    url: raw.url,
    tier: raw.resolved_tier ?? raw.news_source.tier,
  };
}

function existingCandidate(
  row: ExistingSourceRow,
  rawById: Map<string, RawItemRow>,
): StorySourceCandidate {
  const raw = row.raw_item_id ? rawById.get(row.raw_item_id) : undefined;
  return {
    ...(raw
      ? candidateFromRaw(row.story_id, raw)
      : {
          storyId: row.story_id,
          rawItemId: row.raw_item_id,
          outletName: row.outlet_name,
          articleUrl: row.url,
          url: row.url,
          tier: row.tier,
        }),
    existingId: row.id,
    storedOutletName: row.outlet_name,
    url: row.url,
    tier: row.tier,
  };
}

/** Shared write sequence used by Supabase in production and PGlite in tests. */
export async function recordStorySourcesWithStore(
  store: StorySourceStore,
  attachments: { storyId: string; rawItem: { id: string } }[],
  errors: string[],
): Promise<void> {
  if (attachments.length === 0) return;
  try {
    const storyIds = [...new Set(attachments.map((item) => item.storyId))];
    const existing = await store.loadExisting(storyIds);
    const rawIds = [...new Set([
      ...attachments.map((item) => item.rawItem.id),
      ...existing.flatMap((row) => (row.raw_item_id ? [row.raw_item_id] : [])),
    ])];
    const rawById = new Map((await store.loadRawItems(rawIds)).map((row) => [row.id, row]));
    const candidates = attachments.flatMap(({ storyId, rawItem }) => {
      const raw = rawById.get(rawItem.id);
      if (!raw) {
        errors.push(`recordStorySources: raw item ${rawItem.id} not found`);
        return [];
      }
      return [candidateFromRaw(storyId, raw)];
    });
    candidates.push(...existing.map((row) => existingCandidate(row, rawById)));

    const plan = planStorySources(candidates);
    const rows = collapseStorySourceRows(plan.rows);
    if (rows.length > 0) await store.upsertSources(rows);

    const upsertedKeys = new Set(rows.map(storySourceConflictKey));
    const deleteIds = [...new Set(
      plan.deleteCandidates
        .filter((row) => !upsertedKeys.has(storySourceConflictKey(row)))
        .map((row) => row.id),
    )];
    if (deleteIds.length > 0) await store.deleteSources(deleteIds);
  } catch (error) {
    errors.push(`recordStorySources failed: ${(error as Error).message}`);
  }
}

export async function recordStorySources(
  db: SupabaseClient,
  attachments: { storyId: string; rawItem: { id: string } }[],
  errors: string[],
): Promise<void> {
  await recordStorySourcesWithStore(supabaseStore(db), attachments, errors);
}

/** Keeps the earliest source-published timestamp ever observed for each story. */
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
    const storyIds = [...earliestByStory.keys()];
    const { data: existing, error: selectError } = await db
      .from('story_timeline')
      .select('story_id, first_public_at')
      .in('story_id', storyIds);
    if (selectError) throw new Error(selectError.message);
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
  } catch (error) {
    errors.push(`story_timeline first_public_at failed: ${(error as Error).message}`);
  }
}

export async function recomputeVerificationWithStore(
  store: StorySourceStore,
  storyIds: string[],
  errors: string[],
): Promise<void> {
  if (storyIds.length === 0) return;
  try {
    const existing = await store.loadExisting(storyIds);
    const rawIds = [...new Set(
      existing.flatMap((row) => (row.raw_item_id ? [row.raw_item_id] : [])),
    )];
    const rawById = new Map((await store.loadRawItems(rawIds)).map((row) => [row.id, row]));
    const verifiedAt = new Date().toISOString();
    await Promise.all(
      storyIds.map(async (storyId) => {
        const verification = storyVerification(
          existing
            .filter((row) => row.story_id === storyId)
            .map((row) => existingCandidate(row, rawById)),
        );
        await store.updateStory(storyId, {
          verification_status: verification.status,
          verified_at: verifiedAt,
          source_count: verification.sourceCount,
        });
      }),
    );
  } catch (error) {
    errors.push(
      `batch verify failed for stories [${storyIds.join(', ')}]: ${(error as Error).message}`,
    );
  }
}

export async function recomputeVerification(
  db: SupabaseClient,
  storyIds: string[],
  errors: string[],
): Promise<void> {
  await recomputeVerificationWithStore(supabaseStore(db), storyIds, errors);
}
