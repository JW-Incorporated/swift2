// Awareness image-reply lane numbers for the weekly growth collector
// (docs/strategy/growth-strategy.md bet 2). Cohort-based: every awareness
// lead whose Discord message went out inside the window, grouped by what the
// owner did with it afterwards (Posted ack, Skip ack, or nothing yet). The
// "what is that?!" replies are counted by the owner by hand — nothing can
// read them automatically — so they are not in this object.
import { isSchemaPending } from '../../lib/cli.mjs';

const NOTE =
  'Cohort: leads delivered to Discord this window, by their status now. "what is that?!" replies are owner-reported, not collected.';

/** Pure: counts a list of `{ status }` rows. */
export function summarizeAwareness(rows) {
  const delivered = rows.length;
  const posted = rows.filter((r) => r.status === 'posted').length;
  const skipped = rows.filter((r) => r.status === 'skipped_by_founder').length;
  return { delivered, posted, skipped, open: delivered - posted - skipped, note: NOTE };
}

/** Reads the window's delivered awareness leads; a not-yet-migrated schema reads as zeros. */
export async function fetchAwarenessCounts(supabase, win) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('status')
    .eq('kind', 'awareness_reply')
    .gte('discord_delivered_at', win.start)
    .lte('discord_delivered_at', win.end);
  if (error) {
    if (isSchemaPending(error)) return summarizeAwareness([]);
    throw error;
  }
  return summarizeAwareness(data ?? []);
}
