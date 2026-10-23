// Bounded per-cycle pass over recent current_item rows held for
// `missing_image` (#6114, #6211): their stored sources are mostly unresolved
// Google News links, so the original image resolution found no page to fetch.
// Resolve the sources to publisher URLs, retry the image, and re-run the
// publish gate so the backlog clears without a manual backfill. No LLM calls.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateCurrentItemQuality } from '@swift2/shared';
import { screenTopic } from '@swift2/shared/redline';
import type { SourceTier } from '@swift2/shared/news';
import { resolveSourceUrls } from '../sources/resolve-google-news';
import { resolveImageUrl } from './image-resolve';

const HELD_WINDOW_DAYS = 7;
const MAX_HELD_PER_RUN = 15;
const MAX_IMAGE_ATTEMPTS = 5;

interface HeldRow {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  image_url: string | null;
  sources: { name: string; url: string; tier: SourceTier }[] | null;
  image_attempts: number | null;
}

export interface HeldImagePassResult {
  checked: number;
  published: number;
  errors: string[];
}

function clean(strings: readonly string[]): boolean {
  return strings.every((text) => !text || !screenTopic(text));
}

export async function reresolveHeldImages(
  db: SupabaseClient,
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<HeldImagePassResult> {
  const result: HeldImagePassResult = { checked: 0, published: 0, errors: [] };
  const since = new Date(now.getTime() - HELD_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await db
    .from('current_item')
    .select('id,headline,summary,detail,image_url,sources,image_attempts')
    .eq('quality_hold_reason', 'missing_image')
    .is('retracted_at', null)
    .is('promoted_to', null)
    .gt('expires_at', now.toISOString())
    .gte('observed_on', since)
    .lt('image_attempts', MAX_IMAGE_ATTEMPTS)
    .order('last_image_attempt_at', { ascending: true, nullsFirst: true })
    .order('observed_on', { ascending: false })
    .limit(MAX_HELD_PER_RUN);
  if (error) {
    result.errors.push(`held-image load failed: ${error.message}`);
    return result;
  }

  for (const row of (data ?? []) as HeldRow[]) {
    result.checked++;
    try {
      const stored = (row.sources ?? []).map((s) => ({ outletName: s.name, url: s.url, tier: s.tier }));
      const { sources } = await resolveSourceUrls(stored, fetchImpl);
      const image = await resolveImageUrl(row.image_url, sources, fetchImpl);

      const quality = evaluateCurrentItemQuality({
        headline: row.headline,
        summary: row.summary,
        detail: row.detail,
        imageUrl: image,
        redlineOk: clean([row.headline, row.summary, row.detail]),
      });
      const facts = {
        image_attempts: (row.image_attempts ?? 0) + 1,
        last_image_attempt_at: now.toISOString(),
        image_url: image ?? null,
        sources: sources.map((s) => ({ name: s.outletName, url: s.url, tier: s.tier })),
      };
      const { error: factsError } = await db
        .from('current_item')
        .update(facts)
        .eq('id', row.id)
        .is('retracted_at', null);
      if (factsError) {
        result.errors.push(`held-image write failed for ${row.id}: ${factsError.message}`);
        continue;
      }
      const { error: gateError } = await db
        .from('current_item')
        .update({
          redline_ok: quality.ok,
          quality_hold_reason: quality.ok ? null : (quality.reason ?? null),
        })
        .eq('id', row.id)
        .is('retracted_at', null);
      if (gateError) result.errors.push(`held-image gate write failed for ${row.id}: ${gateError.message}`);
      else if (quality.ok) result.published++;
    } catch (err) {
      result.errors.push(`held-image pass failed for ${row.id}: ${(err as Error).message}`);
    }
  }
  return result;
}
