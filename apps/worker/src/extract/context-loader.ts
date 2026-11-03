// Loads the inputs context-pack.ts needs for pass B. The news-worker job
// checks out the repo, so the era's Vault moments are read straight from the
// same seed files the site is built from (supabase/seed/content/<slug>.mjs,
// supabase/seed/eras-data.mjs); prior related current items come from the DB.
// Every loader is best-effort: missing context only means a thinner pack.

import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_PRIOR_ITEMS, type ContextMoment, type PriorItemContext } from './context-pack';

const SEED_DIR = new URL('../../../../supabase/seed/', import.meta.url);
const PRIOR_WINDOW_DAYS = 30;

/** News-pipeline era id -> Vault era slug (the pipeline's `tloas` is the seed's showgirl era). */
const ERA_SLUG_BY_ID: Record<string, string> = { tloas: 'the-life-of-a-showgirl' };

export interface EraContext {
  eraName: string;
  eraSummary: string;
  moments: ContextMoment[];
}

const cache = new Map<string, Promise<EraContext>>();

async function importSeed(relative: string): Promise<Record<string, unknown>> {
  return (await import(new URL(relative, SEED_DIR).href)) as Record<string, unknown>;
}

async function readEraContext(eraId: string): Promise<EraContext> {
  const slug = ERA_SLUG_BY_ID[eraId];
  if (!slug) return { eraName: '', eraSummary: '', moments: [] };
  let eraName = '';
  let eraSummary = '';
  try {
    const { eras } = (await importSeed('eras-data.mjs')) as {
      eras: { slug: string; title: string; album?: string; start_date?: string }[];
    };
    const era = eras.find((e) => e.slug === slug);
    if (era) {
      eraName = era.title;
      eraSummary = era.album && era.start_date
        ? `Her current era, built around the album ${era.album}, running since ${era.start_date}.`
        : '';
    }
  } catch {
    // thinner pack
  }
  const moments: ContextMoment[] = [];
  try {
    const seed = (await importSeed(`content/${slug}.mjs`)) as {
      default: { items: { title?: string; snippet?: string; category?: string }[] };
    };
    for (const item of seed.default.items ?? []) {
      if (!item.title || !item.snippet) continue;
      moments.push({ title: item.title, summary: item.snippet, ...(item.category ? { tags: [item.category] } : {}) });
    }
  } catch {
    // thinner pack
  }
  return { eraName, eraSummary, moments };
}

/** Era name/summary plus every seed moment of the era; cached per process. */
export function loadEraContext(eraId: string): Promise<EraContext> {
  let pending = cache.get(eraId);
  if (!pending) {
    pending = readEraContext(eraId);
    cache.set(eraId, pending);
  }
  return pending;
}

/** Last 30 days of servable same-era items sharing at least one entity, newest first, at most 3. */
export async function loadPriorItems(
  db: SupabaseClient,
  eraId: string,
  entities: readonly string[],
): Promise<PriorItemContext[]> {
  if (entities.length === 0) return [];
  const since = new Date(Date.now() - PRIOR_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  try {
    const { data, error } = await db
      .from('current_item')
      .select('headline, summary')
      .eq('era_id', eraId)
      .eq('redline_ok', true)
      .is('merged_into', null)
      .gte('observed_on', since)
      .overlaps('entities', [...entities])
      .order('observed_on', { ascending: false })
      .limit(MAX_PRIOR_ITEMS);
    if (error) return [];
    return (data ?? []).map((row) => ({ headline: row.headline as string, lead: row.summary as string }));
  } catch {
    return [];
  }
}
