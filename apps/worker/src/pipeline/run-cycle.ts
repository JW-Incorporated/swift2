// One full pipeline cycle: ingest -> cluster -> classify -> verify -> store.
// One-shot: run once, exit (proposal §6) — no resident process. Stage
// isolation: a failing source/classify/verify pass logs and skips, never
// aborts the cycle (proposal §3) — every stage below is wrapped so one bad
// feed or one LLM hiccup can't take down the whole run.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  clusterBatch,
  computeVerificationStatus,
  CrossOutletSimilarityProvider,
  type ClusterableItem,
  type ExistingStory,
} from '@swift2/shared/news';
import { getAdapter } from '../sources/registry';
import { classifyByKeywords, type ClassifyResult } from '../classify/rule-based';
import { classifyWithLLM } from '../classify/openai-client';
import { UsageStore, supabaseUsageDb } from '../classify/usage-store';
import { resolveGoogleNewsItem } from '../sources/resolve-google-news';
import { runExtractStage, type ExtractStageResult } from '../extract/run-extract-stage';

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
}

export async function runCycle(db: SupabaseClient): Promise<CycleResult> {
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
      errors: [],
    },
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
        // Aggregator items carry an opaque redirect URL and no per-item
        // outlet identity — resolve to the real publisher before storing so
        // the item can be attributed/re-tiered instead of staying uncitable
        // forever (proposal §4.1.2). One bad redirect must not drop the
        // item, so resolution failures fall back to the item unresolved
        // (resolveGoogleNewsItem never throws).
        const resolvedItems =
          source.source_type === 'google_news'
            ? await Promise.all(items.map((item) => resolveGoogleNewsItem(item)))
            : items;
        const rows = resolvedItems.map((item) => ({
          source_id: source.id,
          external_id: item.externalId,
          url: item.url,
          title: item.title,
          snippet: item.snippet ?? '',
          author: item.author ?? null,
          published_at: item.publishedAt ?? null,
          image_url: item.imageUrl ?? null,
          publisher: item.publisher ?? null,
          publisher_url: item.publisherUrl ?? null,
          resolved_tier: 'resolvedTier' in item ? item.resolvedTier : null,
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

/**
 * Inserts a news_story_source row for every (story, raw item) pair that isn't
 * already recorded for that outlet, in a single batched
 * `insert ... on conflict (story_id, outlet_name) do nothing` — replaces the
 * old per-row "select existing, then insert" round trip.
 */
async function recordStorySources(
  db: SupabaseClient,
  attachments: { storyId: string; rawItem: { id: string; url: string } }[],
  errors: string[],
): Promise<void> {
  if (attachments.length === 0) return;
  try {
    const rawItemIds = attachments.map((a) => a.rawItem.id);
    const { data: fullItems, error: itemsError } = await db
      .from('news_raw_item')
      .select('id, source_id, url, publisher, resolved_tier, news_source(name, tier)')
      .in('id', rawItemIds);
    if (itemsError) throw new Error(itemsError.message);

    const itemById = new Map(
      (fullItems ?? []).map((item) => [
        (item as unknown as { id: string }).id,
        item as unknown as {
          id: string;
          url: string;
          publisher: string | null;
          resolved_tier: string | null;
          news_source: { name: string; tier: string };
        },
      ]),
    );

    const rows: {
      story_id: string;
      raw_item_id: string;
      outlet_name: string;
      url: string;
      tier: string;
    }[] = [];
    for (const { storyId, rawItem } of attachments) {
      const fullItem = itemById.get(rawItem.id);
      if (!fullItem) {
        errors.push(`recordStorySources: raw item ${rawItem.id} not found`);
        continue;
      }
      // Attribute to the PUBLISHER the feed named, falling back to the feed
      // itself only when it does not say. Aggregator feeds (Google News) carry
      // many outlets, so using the feed name here both misattributed the story
      // and — because the unique index below is keyed on outlet_name — capped
      // every story at a single source row, pinning source_count at 1 and
      // making `corroborated` unreachable across the whole table.
      const outletName = fullItem.publisher?.trim() || fullItem.news_source.name;
      // resolved_tier overrides the source's static tier for items an
      // aggregator feed (Google News) resolved to a real publisher domain
      // (proposal §4.1.2). Unresolved items get resolved_tier='unverified'
      // by resolveGoogleNewsItem, so they stay uncitable-looking rather than
      // inheriting whatever the feed's own tier happens to be.
      const tier = fullItem.resolved_tier ?? fullItem.news_source.tier;
      rows.push({
        story_id: storyId,
        raw_item_id: rawItem.id,
        outlet_name: outletName,
        url: fullItem.url,
        tier,
      });
    }
    if (rows.length === 0) return;

    // Dedupe within this batch too — two raw items in the same cycle can
    // resolve to the same (story, outlet); the DB constraint would reject a
    // duplicate pair within one insert statement even with do-nothing.
    const seen = new Set<string>();
    const dedupedRows = rows.filter((r) => {
      const key = `${r.story_id}::${r.outlet_name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const { error: insertError } = await db
      .from('news_story_source')
      .upsert(dedupedRows, { onConflict: 'story_id,outlet_name', ignoreDuplicates: true });
    if (insertError) throw new Error(insertError.message);
    // source_count itself is set by recomputeVerification's full recount
    // from news_story_source, called for every touched story right after
    // this — no separate counter/RPC needed here.
  } catch (err) {
    errors.push(`recordStorySources failed: ${(err as Error).message}`);
  }
}

/** Recomputes verification_status for the given stories from their current corroboration breakdown. */
async function recomputeVerification(
  db: SupabaseClient,
  storyIds: string[],
  errors: string[],
): Promise<void> {
  if (storyIds.length === 0) return;
  try {
    // Batched select-in for all touched stories' sources, instead of one
    // per-story SELECT — grouped in memory below.
    const { data: allSources, error } = await db
      .from('news_story_source')
      .select('story_id, tier')
      .in('story_id', storyIds);
    if (error) throw new Error(error.message);

    const sourcesByStory = new Map<string, { tier: string }[]>();
    for (const id of storyIds) sourcesByStory.set(id, []);
    for (const row of allSources ?? []) {
      const list = sourcesByStory.get(row.story_id) ?? [];
      list.push({ tier: row.tier });
      sourcesByStory.set(row.story_id, list);
    }

    const now = new Date().toISOString();
    const updateRows = storyIds.map((storyId) => {
      const sources = sourcesByStory.get(storyId) ?? [];
      const status = computeVerificationStatus(
        sources.map((s) => ({
          tier: s.tier as 'official' | 'established' | 'fan' | 'unverified',
        })),
      );
      return {
        id: storyId,
        verification_status: status,
        verified_at: now,
        source_count: sources.length,
      };
    });

    // Per-row UPDATE, not upsert: every id here already exists (touchedStoryIds
    // always comes from stories just attached/created above). A blanket
    // .upsert() issues INSERT ... ON CONFLICT DO UPDATE under the hood, and
    // Postgres validates the INSERT branch's NOT NULL columns (canonical_title,
    // ...) even though the row always resolves to the UPDATE branch — that
    // mismatch is what broke every scheduled run (#3746): "null value in
    // column canonical_title ... violates not-null constraint". An explicit
    // .update() only ever touches the columns named here.
    const updateResults = await Promise.all(
      updateRows.map((row) =>
        db
          .from('news_story')
          .update({
            verification_status: row.verification_status,
            verified_at: row.verified_at,
            source_count: row.source_count,
          })
          .eq('id', row.id),
      ),
    );
    const updateError = updateResults.find((res) => res.error)?.error;
    if (updateError) throw new Error(updateError.message);
  } catch (err) {
    errors.push(
      `batch verify failed for stories [${storyIds.join(', ')}]: ${(err as Error).message}`,
    );
  }
}
