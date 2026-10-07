// Awareness lane — adopts recent Facebook export leads. The weekly export
// ingest (fb-export-ingest.mjs, owner-run) lands screened `hot_thread` leads
// with platform='facebook'; this turns the ones whose excerpt fits a picture
// into awareness rows without touching the exporter. Image support in a
// Facebook group is never knowable from here, so it is always 'unknown'.
import { isSchemaPending } from '../lib/cli.mjs';
import { AWARENESS_KIND, evaluateThread } from './awareness-filters.mjs';
import { pickImageRef } from './awareness-image.mjs';

export const FB_ADOPT_CAP = 4;
const FB_LOOKBACK_HOURS = 72;

export async function adoptFacebookLeads(
  supabase,
  { catalog, now = new Date(), cap = FB_ADOPT_CAP } = {},
) {
  const since = new Date(now.getTime() - FB_LOOKBACK_HOURS * 3_600_000).toISOString();
  const [leads, existing] = await Promise.all([
    supabase
      .from('engagement_lead')
      .select('community, locator, title')
      .eq('platform', 'facebook')
      .eq('kind', 'hot_thread')
      .eq('redline_ok', true)
      .gte('created_at', since),
    supabase
      .from('engagement_lead')
      .select('locator')
      .eq('platform', 'facebook')
      .eq('kind', AWARENESS_KIND)
      .gte('created_at', since),
  ]);
  for (const result of [leads, existing])
    if (result.error && !isSchemaPending(result.error)) throw result.error;
  const seen = new Set((existing.data ?? []).map((row) => row.locator));
  const rows = [];
  for (const lead of leads.data ?? []) {
    if (!lead.locator || seen.has(lead.locator) || rows.length >= cap) continue;
    const text = lead.title || lead.locator;
    const verdict = evaluateThread(
      { id: lead.locator, permalink: 'facebook', title: text, createdAt: now.toISOString() },
      null,
      { now },
    );
    if (!verdict.ok) continue;
    rows.push({
      platform: 'facebook',
      community: lead.community,
      kind: AWARENESS_KIND,
      locator: lead.locator,
      title: lead.title ?? null,
      context:
        'Awareness candidate adopted from the Facebook export lead (our-words excerpt only).',
      matched_doc_ids: [],
      status: 'new',
      redline_ok: true,
      image_ref: pickImageRef(text, catalog).ref,
      image_comments: 'unknown',
      thread_type: verdict.types[0],
    });
  }
  return rows;
}
