const CURRENT_ERA_ID = 'tloas';
const CATEGORIES = new Set([
  'release', 'music', 'fashion', 'tour', 'relationship', 'business',
  'award', 'sighting', 'statement', 'website', 'merch', 'lore',
]);

async function workerWriteCurrentItem(...args) {
  const { tsImport } = await import('tsx/esm/api');
  const worker = await tsImport('../../../apps/worker/src/extract/write-knowledge.ts', import.meta.url);
  return worker.writeCurrentItem(...args);
}

async function loadSiteStory(db, storyId) {
  const existingResult = await db.from('current_item')
    .select('id,era_id,status,redline_ok,quality_hold_reason')
    .eq('story_id', storyId).is('merged_into', null).limit(1);
  if (existingResult.error) throw new Error(`load current_item: ${existingResult.error.message}`);
  const existing = existingResult.data?.[0];
  if (existing) return { existing };

  const storyResult = await db.from('news_story')
    .select('canonical_title,summary,category,top_image_url,first_seen_at')
    .eq('id', storyId).single();
  if (storyResult.error) throw new Error(`load news_story: ${storyResult.error.message}`);
  const story = storyResult.data;
  if (!story || !CATEGORIES.has(story.category)) throw new Error('site story is incomplete');

  const sourceResult = await db.from('news_story_source')
    .select('outlet_name,url,tier').eq('story_id', storyId);
  if (sourceResult.error) throw new Error(`load news_story_source: ${sourceResult.error.message}`);
  const sources = (sourceResult.data ?? []).map((source) => ({
    outletName: source.outlet_name,
    url: source.url,
    tier: source.tier,
  }));
  if (sources.length === 0) throw new Error('site story has no fact-check sources');

  return {
    eraId: CURRENT_ERA_ID,
    imageUrl: story.top_image_url ?? undefined,
    sources,
    item: {
      observedOn: story.first_seen_at.slice(0, 10),
      category: story.category,
      tags: [],
      headline: story.canonical_title,
      summary: story.summary,
      detail: story.summary,
      symbols: [],
      entities: [],
      statusHint: 'confirmed',
    },
  };
}

export async function requestLiveRevalidation({ origin, secret, eraId, fetchImpl = fetch }) {
  if (!origin || !secret) return { revalidated: false, reason: 'not_configured' };
  const endpoint = new URL('/api/revalidate-live', origin);
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ eraId }),
  });
  if (!response.ok) throw new Error(`live revalidation failed with status ${response.status}`);
  return { revalidated: true };
}

export function createSiteAction(deps = {}) {
  const load = deps.loadSiteStory ?? loadSiteStory;
  const write = deps.writeCurrentItem ?? workerWriteCurrentItem;
  const revalidate = deps.requestRevalidation ?? requestLiveRevalidation;
  return async function siteAction({ decision, timeline, db, env = process.env, fetchImpl }) {
    if (decision.class !== 'critical_breaking' || !timeline?.verified_at) {
      return { published: false, reason: 'not_confirmed' };
    }
    const origin = env.REVALIDATE_ORIGIN;
    const secret = env.REVALIDATE_SECRET;
    if (!origin || !secret) return { published: false, reason: 'not_configured' };
    if (!db) throw new Error('site action requires a database client');

    const storyId = decision.watch_item?.story_id;
    if (!storyId) return { published: false, reason: 'missing_story' };
    const story = await load(db, storyId);
    const eraId = story.existing?.era_id ?? story.eraId;
    if (story.existing) {
      if (story.existing.status !== 'confirmed' || story.existing.redline_ok !== true
        || story.existing.quality_hold_reason) {
        return { published: false, reason: 'existing_item_held' };
      }
      await revalidate({ origin, secret, eraId, fetchImpl });
      return { published: true, currentItemId: story.existing.id };
    }

    const written = await write(db, storyId, eraId, story.item, story.sources,
      undefined, story.imageUrl);
    if (!written.redlineOk || written.holdReason) {
      return { published: false, reason: written.holdReason ?? 'redline_failed' };
    }
    await revalidate({ origin, secret, eraId, fetchImpl });
    return { published: true, currentItemId: written.id };
  };
}

export const publishCriticalSite = createSiteAction();
