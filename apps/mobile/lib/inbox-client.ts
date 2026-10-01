// Notifications Phase 3 (NOTIFICATIONS_SPEC.md §8) — mobile client for the
// global in-app inbox. API host comes from `api-base.ts`.
import type { InboxResponse } from '@swift2/shared';
import { apiBaseUrl } from './api-base';

export interface InboxEvent {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deepLink: string;
  availableAt: string;
}

/** Fetches the global inbox feed — every notification-worthy event
 * regardless of any device's push prefs (spec §8: "Off feels safe — you
 * can always catch up"). */
export async function fetchInbox(): Promise<InboxEvent[]> {
  const res = await fetch(`${apiBaseUrl()}/api/notifications/inbox`);
  if (!res.ok) {
    throw new Error(`GET inbox: HTTP ${res.status}`);
  }
  const json = (await res.json()) as InboxResponse;
  return json.events.map((row) => ({
    id: row.id,
    category: row.category,
    tier: row.tier,
    title: row.title,
    body: row.body,
    deepLink: row.deep_link,
    availableAt: row.available_at,
  }));
}
