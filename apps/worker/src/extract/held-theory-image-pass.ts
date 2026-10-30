// Companion to held-image-pass.ts (#6225) for `live_theory`: a bounded
// per-cycle pass over live theories that have no image (legacy rows from before
// the media gate, and rows written held). If a theory cites a servable
// current_item (`evidence_ids` = `current:<id>`) whose image passes the shared
// image gate, adopt that image so the theory publishes; otherwise it stays
// hidden (the anon RLS policy and read filters refuse imageless theories).
// Rows are read newest-first (last_seen_on desc) with empty evidence_ids
// excluded at the DB level, and scanned in pages up to a hard cap, so rows
// that can never adopt (evidence image fails the gate) cannot starve an
// adoptable row behind them. PostgREST cannot prefix-match inside a text[]
// column, so the `current:` check stays in code; beyond MAX_SCANNED_ROWS newer
// unadoptable rows an older adoptable one waits for those rows to expire.
// DB reads/writes only: no fetches, no LLM calls.

import type { SupabaseClient } from '@supabase/supabase-js';
import { theoryImageFields } from './live-theory-image';
import { emitEasterEggEvent } from './write-knowledge';

const PAGE_SIZE = 25;
const MAX_SCANNED_ROWS = 200;
const CURRENT_DOC_PREFIX = 'current:';

interface HeldTheoryRow {
  id: string;
  name: string;
  claim: string;
  evidence_ids: unknown;
}

export interface HeldTheoryImagePassResult {
  checked: number;
  published: number;
  errors: string[];
}

function currentItemIds(evidenceIds: unknown): string[] {
  return (Array.isArray(evidenceIds) ? evidenceIds : [])
    .filter((v): v is string => typeof v === 'string' && v.startsWith(CURRENT_DOC_PREFIX))
    .map((v) => v.slice(CURRENT_DOC_PREFIX.length));
}

export async function reresolveHeldTheoryImages(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<HeldTheoryImagePassResult> {
  const result: HeldTheoryImagePassResult = { checked: 0, published: 0, errors: [] };
  let from = 0;
  let scanned = 0;
  while (scanned < MAX_SCANNED_ROWS) {
    const { data, error } = await db
      .from('live_theory')
      .select('id,name,claim,evidence_ids')
      .is('image_url', null)
      .eq('redline_ok', true)
      .neq('status', 'abandoned')
      .gt('expires_at', now.toISOString())
      .not('evidence_ids', 'eq', '{}')
      .order('last_seen_on', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      result.errors.push(`held-theory load failed: ${error.message}`);
      return result;
    }
    const rows = (data ?? []) as HeldTheoryRow[];
    scanned += rows.length;
    const adoptedHere = await adoptPage(db, rows, result);
    if (rows.length < PAGE_SIZE) break;
    // Adopted rows leave the image_url IS NULL set, so every remaining row
    // shifts up by exactly adoptedHere. Advancing by the difference keeps the
    // cursor on the true next unadopted row without rescanning or skipping.
    from += PAGE_SIZE - adoptedHere;
  }
  return result;
}

async function adoptPage(
  db: SupabaseClient,
  rows: HeldTheoryRow[],
  result: HeldTheoryImagePassResult,
): Promise<number> {
  let adoptedHere = 0;
  const candidates = rows
    .map((row) => ({ row, itemIds: currentItemIds(row.evidence_ids) }))
    .filter((c) => c.itemIds.length > 0);
  if (candidates.length === 0) return 0;
  const allIds = [...new Set(candidates.flatMap((c) => c.itemIds))];
  const { data: items, error: itemError } = await db
    .from('current_item')
    .select('id,image_url')
    .in('id', allIds)
    .eq('redline_ok', true)
    .is('retracted_at', null);
  if (itemError) {
    result.errors.push(`held-theory item load failed: ${itemError.message}`);
    return 0;
  }
  const byId = new Map(((items ?? []) as { id: string; image_url: string | null }[]).map((i) => [i.id, i.image_url]));

  for (const { row, itemIds } of candidates) {
    result.checked++;
    try {
      let adopted: ReturnType<typeof theoryImageFields> | undefined;
      for (const id of itemIds) {
        const candidate = theoryImageFields(byId.get(id));
        if (candidate.published) {
          adopted = candidate;
          break;
        }
      }
      if (!adopted) continue;

      // .select('id') is required: supabase-js v2 returns data: null from an
      // update unless a select is chained, so without it the adopted-only guard
      // below would never see the changed rows and no adoption would count.
      const { data: updated, error: writeError } = await db
        .from('live_theory')
        .update(adopted.fields)
        .eq('id', row.id)
        .is('image_url', null)
        .select('id');
      if (writeError) throw new Error(writeError.message);
      // Count adopted only when the update actually changed a row: the is(image_url, null)
      // guard can no-op when a concurrent pass beat us, and a lost race must not count.
      const updatedRows: unknown[] = updated ?? [];
      if (updatedRows.length > 0) {
        const { error: docError } = await db
          .from('knowledge_doc')
          .update({ redline_ok: true })
          .eq('id', `ltheory:${row.id}`);
        if (docError) result.errors.push(`held-theory doc update failed for ${row.id}: ${docError.message}`);
        // Same one-per-theory easter_egg event the re-observation path emits on
        // first publication (upsertLiveTheory); dedupe_key keeps it once per id.
        await emitEasterEggEvent(db, row.id, row);
        result.published++;
        adoptedHere++;
      }
    } catch (err) {
      result.errors.push(`held-theory pass failed for ${row.id}: ${(err as Error).message}`);
    }
  }
  return adoptedHere;
}
