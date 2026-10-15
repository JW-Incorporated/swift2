import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdapter } from '../sources/registry';
import { resolveGoogleNewsItem } from '../sources/resolve-google-news';
import type { SourceAdapter } from '../sources/types';
import { filterRelevantItems } from '../sources/relevance';
import type { CycleResult } from './downstream-stages';

export interface CycleOptions {
  primary?: boolean;
  adapterFor?: (sourceType: string) => SourceAdapter | undefined;
}

/** Ingests one cycle and returns the selected source ids, or null when source loading failed. */
export async function runIngestStage(
  db: SupabaseClient,
  options: CycleOptions,
  result: CycleResult,
): Promise<string[] | null> {
  let sourcesQuery = db.from('news_source').select('id, name, source_type, config');
  if (!options.primary) sourcesQuery = sourcesQuery.eq('is_enabled', true);
  const { data: sources, error } = await sourcesQuery;
  if (error) {
    result.errors.push(`could not load news_source rows: ${error.message}`);
    return null;
  }

  const selected = options.primary
    ? (sources ?? []).filter((source) => source.config?.primary === true)
    : (sources ?? []).filter((source) => source.config?.primaryOnly !== true);
  const adapterFor = options.adapterFor ?? getAdapter;
  for (const source of selected) {
    const adapter = adapterFor(source.source_type);
    if (!adapter) {
      result.errors.push(
        `no adapter registered for source_type "${source.source_type}" (source "${source.name}")`,
      );
      continue;
    }
    try {
      const fetched = await adapter.fetch({
        id: source.id,
        name: source.name,
        sourceType: source.source_type,
        config: source.config ?? {},
      });
      const items = filterRelevantItems(source.config ?? {}, fetched);
      if (items.length > 0) {
        const resolved =
          source.source_type === 'google_news' && !options.primary
            ? await Promise.all(items.map((item) => resolveGoogleNewsItem(item)))
            : items;
        const rows = resolved.map((item) => ({
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
        if (upsertError) {
          result.errors.push(`raw_item upsert failed for "${source.name}": ${upsertError.message}`);
        } else {
          result.itemsIngested += rows.length;
        }
      }
      result.sourcesPolled++;
      await db
        .from('news_source')
        .update({ last_polled_at: new Date().toISOString() })
        .eq('id', source.id);
    } catch (stageError) {
      result.errors.push(`ingest failed for "${source.name}": ${(stageError as Error).message}`);
    }
  }
  return selected.map((source) => source.id);
}
