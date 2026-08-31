// Notifications Phase 3 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §8) —
// the in-app inbox data layer. spec §8: "In-app inbox: a chronological feed
// of everything notification-worthy regardless of push settings. Makes
// 'Off' feel safe — you can always catch up." This is deliberately a GLOBAL
// feed (every category's events, not filtered by any one device's prefs) —
// the whole point is that muting/turning a category off never loses
// content, it just stops the push. Server-only (reads `events`, which
// ships RLS-locked to service_role only, same posture as every other
// notifications table).
import type { SupabaseClient } from '@supabase/supabase-js';

export interface InboxEventRow {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deep_link: string;
  available_at: string;
}

const INBOX_MAX_ROWS = 200;

/**
 * Every non-killed, non-expired, already-available event, newest first.
 * "Already available" (`available_at <= now`) matters for T1 events during
 * their 5-minute kill window — a killed/pending event must never leak into
 * the inbox before the router itself would ever consider sending it, or
 * the kill switch's founder-safety guarantee (SETUP_NOTIFICATIONS.md §9)
 * would be defeated by a user just reading the inbox during that window.
 */
export async function getInboxEvents(
  db: SupabaseClient,
  now: Date = new Date(),
): Promise<InboxEventRow[]> {
  const { data, error } = await db
    .from('events')
    .select('id,category,tier,title,body,deep_link,available_at,expires_at,killed_at')
    .lte('available_at', now.toISOString())
    .is('killed_at', null)
    .order('available_at', { ascending: false })
    .limit(INBOX_MAX_ROWS);

  if (error) throw new Error(`getInboxEvents: ${error.message}`);

  return ((data ?? []) as (InboxEventRow & { expires_at: string | null })[])
    .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now.getTime())
    .map(({ id, category, tier, title, body, deep_link, available_at }) => ({
      id,
      category,
      tier,
      title,
      body,
      deep_link,
      available_at,
    }));
}
