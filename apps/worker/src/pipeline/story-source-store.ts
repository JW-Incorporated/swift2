import type { SupabaseClient } from '@supabase/supabase-js';
import type { SourceTier } from '@swift2/shared/news';
import {
  planStorySources,
  storyVerification,
  type StorySourceCandidate,
} from './story-sources';

interface RawItemRow {
  id: string;
  external_id: string | null;
  url: string;
  title: string;
  snippet: string;
  author: string | null;
  publisher: string | null;
  publisher_url: string | null;
  resolved_tier: SourceTier | null;
  news_source: { name: string; tier: SourceTier };
}

interface ExistingSourceRow {
  id: string;
  story_id: string;
  raw_item_id: string | null;
  outlet_name: string;
  url: string;
  tier: SourceTier;
}

type StorySourceRow = ReturnType<typeof planStorySources>['rows'][number];

const TIER_RANK: Record<SourceTier, number> = {
  unverified: 0,
  fan: 1,
  established: 2,
  official: 3,
};

function collapseConflictRows(rows: StorySourceRow[]): StorySourceRow[] {
  const winners = new Map<string, StorySourceRow>();
  for (const row of rows) {
    const key = `${row.story_id}\u0000${row.outlet_name}`;
    const current = winners.get(key);
    const preferred = !current ||
      TIER_RANK[row.tier] > TIER_RANK[current.tier] ||
      (row.tier === current.tier && (
        row.url.localeCompare(current.url) < 0 ||
        (row.url === current.url && (row.raw_item_id ?? '').localeCompare(current.raw_item_id ?? '') < 0)
      ));
    if (preferred) winners.set(key, row);
  }
  return [...winners.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}

function candidateFromRaw(storyId: string, raw: RawItemRow): StorySourceCandidate {
  return {
    storyId,
    rawItemId: raw.id,
    externalId: raw.external_id,
    title: raw.title,
    snippet: raw.snippet,
    author: raw.author,
    outletName: raw.publisher?.trim() || raw.news_source.name,
    publisherUrl: raw.publisher_url,
    articleUrl: raw.url,
    url: raw.url,
    tier: raw.resolved_tier ?? raw.news_source.tier,
  };
}

async function loadRawItems(db: SupabaseClient, ids: string[]): Promise<Map<string, RawItemRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db
    .from('news_raw_item')
    .select(
      'id, external_id, url, title, snippet, author, publisher, publisher_url, resolved_tier, news_source(name, tier)',
    )
    .in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.id, row as unknown as RawItemRow]));
}

async function loadExisting(db: SupabaseClient, storyIds: string[]): Promise<ExistingSourceRow[]> {
  const { data, error } = await db
    .from('news_story_source')
    .select('id, story_id, raw_item_id, outlet_name, url, tier')
    .in('story_id', storyIds);
  if (error) throw new Error(error.message);
  return (data ?? []) as ExistingSourceRow[];
}

function existingCandidate(
  row: ExistingSourceRow,
  rawById: Map<string, RawItemRow>,
): StorySourceCandidate {
  const raw = row.raw_item_id ? rawById.get(row.raw_item_id) : undefined;
  return {
    ...(raw ? candidateFromRaw(row.story_id, raw) : {
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

export async function recordStorySources(
  db: SupabaseClient,
  attachments: { storyId: string; rawItem: { id: string } }[],
  errors: string[],
): Promise<void> {
  if (attachments.length === 0) return;
  try {
    const storyIds = [...new Set(attachments.map((item) => item.storyId))];
    const existing = await loadExisting(db, storyIds);
    const rawIds = [...new Set([
      ...attachments.map((item) => item.rawItem.id),
      ...existing.flatMap((row) => (row.raw_item_id ? [row.raw_item_id] : [])),
    ])];
    const rawById = await loadRawItems(db, rawIds);
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
    const rows = collapseConflictRows(plan.rows);
    if (rows.length > 0) {
      const { error } = await db
        .from('news_story_source')
        .upsert(rows, { onConflict: 'story_id,outlet_name' });
      if (error) throw new Error(error.message);
    }
    if (plan.deleteIds.length > 0) {
      const { error } = await db.from('news_story_source').delete().in('id', plan.deleteIds);
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    errors.push(`recordStorySources failed: ${(err as Error).message}`);
  }
}

export async function recomputeVerification(
  db: SupabaseClient,
  storyIds: string[],
  errors: string[],
): Promise<void> {
  if (storyIds.length === 0) return;
  try {
    const existing = await loadExisting(db, storyIds);
    const rawIds = existing.flatMap((row) => (row.raw_item_id ? [row.raw_item_id] : []));
    const rawById = await loadRawItems(db, [...new Set(rawIds)]);
    const now = new Date().toISOString();
    const updates = storyIds.map((storyId) => ({
      storyId,
      ...storyVerification(
        existing
          .filter((row) => row.story_id === storyId)
          .map((row) => existingCandidate(row, rawById)),
      ),
    }));
    const results = await Promise.all(
      updates.map((row) =>
        db
          .from('news_story')
          .update({
            verification_status: row.status,
            verified_at: now,
            source_count: row.sourceCount,
          })
          .eq('id', row.storyId),
      ),
    );
    const error = results.find((result) => result.error)?.error;
    if (error) throw new Error(error.message);
  } catch (err) {
    errors.push(`batch verify failed for stories [${storyIds.join(', ')}]: ${(err as Error).message}`);
  }
}
