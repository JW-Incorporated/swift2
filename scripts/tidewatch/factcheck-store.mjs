import { existingCandidate } from '../../apps/worker/src/pipeline/story-source-store.ts';

const RAW_SELECT = 'id, external_id, url, title, snippet, author, publisher, publisher_url, resolved_tier, news_source(name, tier, source_type)';

function assertOk(error, operation) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

export async function loadStoredStory(db, storyId, classification) {
  const storyResult = await db.from('news_story')
    .select('id, canonical_title').eq('id', storyId).single();
  assertOk(storyResult.error, 'load news story');
  const sourceResult = await db.from('news_story_source')
    .select('id, story_id, raw_item_id, outlet_name, url, tier').eq('story_id', storyId);
  assertOk(sourceResult.error, 'load story sources');
  const rows = sourceResult.data ?? [];
  const rawIds = [...new Set(rows.flatMap((row) => row.raw_item_id ? [row.raw_item_id] : []))];
  let rawItems = [];
  if (rawIds.length > 0) {
    const rawResult = await db.from('news_raw_item').select(RAW_SELECT).in('id', rawIds);
    assertOk(rawResult.error, 'load source articles');
    rawItems = rawResult.data ?? [];
  }
  const rawById = new Map(rawItems.map((row) => [row.id, row]));
  return {
    storyId,
    claim: storyResult.data.canonical_title,
    classification,
    sources: rows.map((row) => {
      const source = existingCandidate(row, rawById);
      return { ...source, headline: source.title, dek: source.snippet };
    }),
  };
}

export async function markStoryVerified(db, storyId, verifiedAt) {
  const { error } = await db.from('story_timeline').upsert(
    { story_id: storyId, verified_at: verifiedAt },
    { onConflict: 'story_id' },
  );
  assertOk(error, 'mark story verified');
}
