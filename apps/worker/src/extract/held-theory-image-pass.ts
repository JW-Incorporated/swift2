// Companion to held-image-pass.ts (#6225) for `live_theory`: a bounded
// per-cycle pass over live theories that have no image (legacy rows from before
// the media gate, and rows written held). If a theory cites a servable
// current_item (`evidence_ids` = `current:<id>`) whose image passes the shared
// image gate, adopt that image so the theory publishes; otherwise it stays
// hidden (the anon RLS policy and read filters refuse imageless theories).
// DB reads/writes only: no fetches, no LLM calls.

import type { SupabaseClient } from '@supabase/supabase-js';
import { theoryImageFields } from './live-theory-image';

const MAX_HELD_THEORIES_PER_RUN = 25;
const CURRENT_DOC_PREFIX = 'current:';

interface HeldTheoryRow {
  id: string;
  evidence_ids: unknown;
}

export interface HeldTheoryImagePassResult {
  checked: number;
  published: number;
  errors: string[];
}

export async function reresolveHeldTheoryImages(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<HeldTheoryImagePassResult> {
  const result: HeldTheoryImagePassResult = { checked: 0, published: 0, errors: [] };
  const { data, error } = await db
    .from('live_theory')
    .select('id,evidence_ids')
    .is('image_url', null)
    .eq('redline_ok', true)
    .neq('status', 'abandoned')
    .gt('expires_at', now.toISOString())
    .limit(MAX_HELD_THEORIES_PER_RUN);
  if (error) {
    result.errors.push(`held-theory load failed: ${error.message}`);
    return result;
  }

  for (const row of (data ?? []) as HeldTheoryRow[]) {
    result.checked++;
    try {
      const itemIds = (Array.isArray(row.evidence_ids) ? row.evidence_ids : [])
        .filter((v): v is string => typeof v === 'string' && v.startsWith(CURRENT_DOC_PREFIX))
        .map((v) => v.slice(CURRENT_DOC_PREFIX.length));
      if (itemIds.length === 0) continue;

      const { data: items, error: itemError } = await db
        .from('current_item')
        .select('id,image_url')
        .in('id', itemIds)
        .eq('redline_ok', true)
        .is('retracted_at', null);
      if (itemError) throw new Error(itemError.message);
      const byId = new Map(((items ?? []) as { id: string; image_url: string | null }[]).map((i) => [i.id, i.image_url]));
      let adopted: ReturnType<typeof theoryImageFields> | undefined;
      for (const id of itemIds) {
        const candidate = theoryImageFields(byId.get(id));
        if (candidate.published) {
          adopted = candidate;
          break;
        }
      }
      if (!adopted) continue;

      const { error: writeError } = await db
        .from('live_theory')
        .update(adopted.fields)
        .eq('id', row.id)
        .is('image_url', null);
      if (writeError) throw new Error(writeError.message);
      const { error: docError } = await db
        .from('knowledge_doc')
        .update({ redline_ok: true })
        .eq('id', `ltheory:${row.id}`);
      if (docError) result.errors.push(`held-theory doc update failed for ${row.id}: ${docError.message}`);
      result.published++;
    } catch (err) {
      result.errors.push(`held-theory pass failed for ${row.id}: ${(err as Error).message}`);
    }
  }
  return result;
}
