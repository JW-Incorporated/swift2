import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdapter } from '../sources/registry';
import { filterRelevantItems } from '../sources/relevance';
import { resolveGoogleNewsItem } from '../sources/resolve-google-news';
import { isUpstreamError } from '../sources/retry';
import type { SourceAdapter } from '../sources/types';

export interface CycleOptions {
  primary?: boolean;
  adapterFor?: (sourceType: string) => SourceAdapter | undefined;
}

interface IngestResult {
  sourcesPolled: number;
  itemsIngested: number;
  errors: string[];
  /** Upstream HTTP/network failures of a single source — logged, never exit 1. */
  warnings: string[];
}

// last_polled_at is only written after a successful fetch, so it is the
// per-source last-success timestamp.
const STALE_SOURCE_MS = 48 * 3_600_000;

/** Ingests one cycle and returns selected source ids, or null when source loading fails. */
export async function runIngestStage(
  db: SupabaseClient,
  options: CycleOptions,
  result: IngestResult,
): Promise<string[] | null> {
  let query = db.from('news_source').select('id, name, source_type, config, last_polled_at');
  if (!options.primary) query = query.eq('is_enabled', true);
  const { data: sources, error } = await query;
  if (error) {
    result.errors.push(`could not load news_source rows: ${error.message}`);
    return null;
  }

  const selected = options.primary
    ? (sources ?? []).filter((source) => source.config?.primary === true)
    : (sources ?? []);
  const adapterFor = options.adapterFor ?? getAdapter;
  let failedFetches = 0;
  for (const source of selected) {
    const adapter = adapterFor(source.source_type);
    if (!adapter) {
      result.errors.push(
        `no adapter registered for source_type "${source.source_type}" (source "${source.name}")`,
      );
      continue;
    }
    let fetched: Awaited<ReturnType<SourceAdapter['fetch']>>;
    try {
      fetched = await adapter.fetch({
        id: source.id,
        name: source.name,
        sourceType: source.source_type,
        config: source.config ?? {},
      });
    } catch (fetchError) {
      const message = `ingest failed for "${source.name}": ${(fetchError as Error).message}`;
      const lastOk = source.last_polled_at ? Date.parse(source.last_polled_at) : NaN;
      const stale = !(Date.now() - lastOk < STALE_SOURCE_MS);
      if (!isUpstreamError(fetchError) || stale) {
        result.errors.push(stale && isUpstreamError(fetchError) ? `${message} (no success in >48h)` : message);
      } else {
        result.warnings.push(message);
      }
      failedFetches++;
      continue;
    }
    try {
      const relevant = filterRelevantItems(source.config ?? {}, fetched);
      if (relevant.length > 0) {
        const items = source.source_type === 'google_news' && !options.primary
          ? await Promise.all(relevant.map((item) => resolveGoogleNewsItem(item)))
          : relevant;
        const rows = items.map((item) => ({
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
  if (selected.length > 0 && failedFetches === selected.length) {
    result.errors.push(`all ${selected.length} source(s) failed to fetch this run`);
  }
  return selected.map((source) => source.id);
}
