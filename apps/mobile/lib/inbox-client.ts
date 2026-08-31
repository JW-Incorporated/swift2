// Notifications Phase 3 (NOTIFICATIONS_SPEC.md §8) — mobile client for the
// global in-app inbox. Same `apiBaseUrl()` fallback pattern prefs-client.ts
// uses.
export interface InboxEvent {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deepLink: string;
  availableAt: string;
}

interface InboxEventApiRow {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deep_link: string;
  available_at: string;
}

function apiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://swift2-web-nine.vercel.app').replace(
    /\/$/,
    '',
  );
}

/** Fetches the global inbox feed — every notification-worthy event
 * regardless of any device's push prefs (spec §8: "Off feels safe — you
 * can always catch up"). */
export async function fetchInbox(): Promise<InboxEvent[]> {
  const res = await fetch(`${apiBaseUrl()}/api/notifications/inbox`);
  if (!res.ok) {
    throw new Error(`GET inbox: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { events: InboxEventApiRow[] };
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
