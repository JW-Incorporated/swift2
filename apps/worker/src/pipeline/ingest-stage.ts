import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdapter } from '../sources/registry';
import { filterRelevantItems } from '../sources/relevance';
import { resolveGoogleNewsItem } from '../sources/resolve-google-news';
import { isBlockedError, isUpstreamError } from '../sources/retry';
import type { SourceAdapter } from '../sources/types';

export interface CycleOptions {
  primary?: boolean;
  adapterFor?: (sourceType: string) => SourceAdapter | undefined;
}

const ESCALATION_THRESHOLD = 3;
const ESCALATION_MIN_MS = 3 * 3_600_000;
const BASE_COLUMNS = 'id, name, source_type, config, last_polled_at';
const TRACKED_COLUMNS = `${BASE_COLUMNS}, consecutive_failures, last_ok_at`;

interface SourceRow {
  id: string;
  name: string;
  source_type: string;
  config: Record<string, unknown> | null;
  last_polled_at: string | null;
  consecutive_failures?: number;
  last_ok_at?: string | null;
}

function isMissingErrorStateColumn(error: { message: string; code?: string }): boolean {
  return (
    /consecutive_failures|last_ok_at/.test(error.message) &&
    (error.code === '42703' || error.code === 'PGRST204' || /does not exist|schema cache/i.test(error.message))
  );
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
  const load = async (columns: string) => {
    const query = db.from('news_source').select(columns);
    const { data, error: loadError } = await (options.primary ? query : query.eq('is_enabled', true));
    return { data: data as unknown as SourceRow[] | null, error: loadError };
  };
  let tracking = true;
  let { data: sources, error } = await load(TRACKED_COLUMNS);
  if (error && isMissingErrorStateColumn(error)) {
    tracking = false;
    result.warnings.push('error-state columns missing (migration pending)');
    ({ data: sources, error } = await load(BASE_COLUMNS));
  }
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
      const upstream = isUpstreamError(fetchError) || isBlockedError(fetchError);
      const newFailures = ((source.consecutive_failures as number | undefined) ?? 0) + 1;
      const okAt = source.last_ok_at ? Date.parse(source.last_ok_at) : NaN;
      const noRecentSuccess = Number.isNaN(okAt) || Date.now() - okAt >= ESCALATION_MIN_MS;
      const repeated = tracking && newFailures >= ESCALATION_THRESHOLD && noRecentSuccess;
      if (!upstream) {
        result.errors.push(message);
      } else if (stale) {
        result.errors.push(`${message} (no success in >48h)`);
      } else if (repeated) {
        result.errors.push(`${message} (${newFailures} consecutive failures)`);
      } else {
        result.warnings.push(message);
      }
      if (tracking) {
        const { error: counterError } = await db
          .from('news_source')
          .update({ consecutive_failures: newFailures })
          .eq('id', source.id);
        if (counterError) {
          console.warn(`news-worker: could not record failure count for "${source.name}": ${counterError.message}`);
        }
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
      const nowIso = new Date().toISOString();
      await db
        .from('news_source')
        .update(
          tracking
            ? { last_polled_at: nowIso, last_ok_at: nowIso, consecutive_failures: 0 }
            : { last_polled_at: nowIso },
        )
        .eq('id', source.id);
    } catch (stageError) {
      result.errors.push(`ingest failed for "${source.name}": ${(stageError as Error).message}`);
    }
  }
  if (selected.length > 0 && failedFetches * 2 > selected.length) {
    if (failedFetches === selected.length) {
      result.errors.push(`all ${selected.length} source(s) failed to fetch this run`);
    } else {
      result.errors.push(`${failedFetches} of ${selected.length} source(s) failed to fetch this run (${Math.round((failedFetches / selected.length) * 100)}%)`);
    }
  }
  return selected.map((source) => source.id);
}
