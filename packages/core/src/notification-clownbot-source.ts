// Notifications Phase 3 (NOTIFICATIONS_PLAN.md: "The Weekly Clown Report",
// curation via a Clownbot top-theories query if that pipeline exists in
// this repo).
//
// A dedicated "Clownbot top-theories ranking" PIPELINE (a scheduled job
// that scores/curates theories specifically for notification copy) does
// NOT exist anywhere in this repo today — grep for `clown` and `theor`
// across the tree turns up the chat/retrieval surface (apps/web/lib/
// longlive/clown-*.ts) and the Current-tier `live_theory` table
// (supabase/migrations/20260901000000_knowledge_engine.sql), but nothing
// that ranks/selects theories for a push notification. Per this task's
// explicit instruction ("if that pipeline doesn't exist yet, stub the
// query interface clearly and flag it, don't invent fake curation data"),
// this module is exactly that stub.
//
// It is NOT a no-op fabricating placeholder text, though: `live_theory`
// (heat-ordered, `status`/`outcome` columns) is real, already-screened
// production data — the same table the Current-tier read layer
// (packages/core/src/knowledge) already serves reads from. Using it here
// (ORDER BY heat, unresolved theories only) is a reasonable interim
// curation rule, NOT invented content — every theory surfaced is a real
// row a human/bot already wrote. What's missing is Clownbot-specific
// scoring (recency-weighted engagement, cross-referencing fan_signal
// chatter, etc.) — that's the actual "top-theories query" the plan
// describes and doesn't exist yet. FOUNDER FLAG: replace `getTopTheories`'s
// body with a real Clownbot-curated ranking once that pipeline is built;
// until then this is a clearly-labeled placeholder ranking, not the
// production curation experience.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClownTheory } from '@swift2/shared';

const DEFAULT_LIMIT = 3;

interface LiveTheoryRow {
  claim: string;
  name: string;
  heat: number;
}

/**
 * STUBBED CURATION: returns the highest-`heat`, still-`pending`-outcome
 * `live_theory` rows. This is a placeholder ranking rule, not a real
 * Clownbot curation pipeline (see module header) — flagged here and in
 * SETUP_NOTIFICATIONS.md so it isn't mistaken for the finished feature.
 * Falls back to an empty array (never throws, never fabricates a theory)
 * on any query error — a broken curation source must degrade the digest to
 * "no fresh theories" rather than block the whole weekly send.
 */
export async function getTopTheories(
  db: SupabaseClient,
  limit: number = DEFAULT_LIMIT,
): Promise<ClownTheory[]> {
  try {
    const { data, error } = await db
      .from('live_theory')
      .select('claim,name,heat')
      .eq('outcome', 'pending')
      .order('heat', { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data ?? []) as LiveTheoryRow[]).map((row) => ({
      summary: row.claim || row.name,
    }));
  } catch {
    return [];
  }
}
