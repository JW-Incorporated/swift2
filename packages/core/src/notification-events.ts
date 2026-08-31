// Notifications Phase 2 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §9/§10)
// — the single producer seam. Every scraper/automation pipeline that wants
// to notify users calls THIS function and nothing else; it is the only
// thing that writes to `events`. Keeps coupling to one helper call per
// pipeline (this task's explicit instruction: "keep coupling to one helper
// call, do not scatter insertEvent() calls").
//
// Server-only: callers run with the Supabase SERVICE ROLE key (same
// posture as devices.ts/notification-prefs.ts — `events` ships RLS enabled
// with no anon/authenticated policies).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationCategory } from '@swift2/shared';

/** T1 categories get a 5-minute send delay + kill hook (spec §12 Q2,
 * founder decision recorded on the Phase 2 kanban card): "T1 events send
 * fully automated with a 5-minute send delay + an alert/kill hook — NOT a
 * human-confirm gate." A false positive can be withdrawn via
 * scripts/notifications-kill-t1.mjs before `available_at` arrives. */
export const T1_CATEGORIES: readonly NotificationCategory[] = [
  'song_drop',
  'album_news',
  'tour_news',
];
export const T1_SEND_DELAY_MS = 5 * 60 * 1000;

const TIER_BY_CATEGORY: Record<NotificationCategory, number> = {
  song_drop: 1,
  album_news: 1,
  tour_news: 1,
  official_youtube: 2,
  official_merch: 2,
  relationship_news: 2,
  public_appearance: 2,
  award_news: 3,
  fan_merch: 3,
  easter_egg: 3,
};

export interface InsertEventInput {
  category: NotificationCategory;
  title: string;
  body: string;
  deepLink: string;
  /** Stable, deterministic dedupe key for this exact detection — same
   * pipeline calling with the same key twice is a no-op (the unique
   * constraint on `events.dedupe_key`), which is the mechanism this task's
   * acceptance criteria calls "dedupe verified by inserting the same event
   * twice". Callers should derive this from the underlying content id
   * (e.g. `song_drop:<catalog-sourceId>`, `official_youtube:<video-id>`),
   * never from wall-clock time. */
  dedupeKey: string;
  /** ISO 8601. Defaults to 30 days out — matches events.expires_at's
   * "stale events never send" intent without forcing every producer to
   * compute one. */
  expiresAt?: string;
  now?: Date;
}

export interface InsertEventResult {
  /** null when this was a duplicate detection (dedupe_key already existed)
   * — not an error, the expected steady-state outcome for a re-run
   * scraper cycle re-observing the same content. */
  id: string | null;
  deduped: boolean;
  tier: number;
  availableAt: string;
}

const DEFAULT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The one producer seam. Inserts a row into `events`, applying the T1
 * 5-minute delay automatically based on category (spec §12 Q2 / this
 * task's recorded founder decision) — callers never compute the delay
 * themselves, so the safety behavior can't be forgotten or reimplemented
 * per-pipeline.
 *
 * Idempotent on `dedupeKey`: a duplicate detection (same key) is a
 * successful no-op (`deduped: true`, `id: null`), not a thrown error — a
 * scraper that runs every few hours WILL re-observe the same content, and
 * that must never surface as a pipeline failure.
 */
export async function insertEvent(
  db: SupabaseClient,
  input: InsertEventInput,
): Promise<InsertEventResult> {
  const now = input.now ?? new Date();
  const tier = TIER_BY_CATEGORY[input.category];
  const isT1 = T1_CATEGORIES.includes(input.category);
  const availableAt = isT1
    ? new Date(now.getTime() + T1_SEND_DELAY_MS).toISOString()
    : now.toISOString();
  const expiresAt = input.expiresAt ?? new Date(now.getTime() + DEFAULT_EXPIRY_MS).toISOString();

  const { data, error } = await db
    .from('events')
    .insert({
      category: input.category,
      tier,
      title: input.title,
      body: input.body,
      deep_link: input.deepLink,
      dedupe_key: input.dedupeKey,
      available_at: availableAt,
      expires_at: expiresAt,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    // Postgres unique_violation on dedupe_key — this is the expected
    // duplicate-detection path, not a failure. Every other error rethrows.
    if (error.code === '23505') {
      return { id: null, deduped: true, tier, availableAt };
    }
    throw new Error(`insertEvent: ${error.message}`);
  }

  return { id: (data?.id as string) ?? null, deduped: false, tier, availableAt };
}
