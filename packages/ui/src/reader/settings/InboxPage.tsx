'use client';

// The notification inbox (NOTIFICATIONS_SPEC.md §8): a chronological feed of everything notification-worthy,
// regardless of push settings, so "Off" feels safe. The website has no inbox surface; the app mounts this behind
// `host.notifications` (apps/mobile/dom/slots/inbox-page.tsx). Read-only; a row hands its deep link to `onOpenItem`.
import { useCallback, useEffect, useState } from 'react';
import { SETTINGS_CATEGORY_DEFS, isInboxResponse, type AnyNotificationCategory, type InboxEventRow } from '@swift2/shared';
import { useHost } from '../../host/context';

const CATEGORY_NAME: Partial<Record<AnyNotificationCategory, string>> = Object.fromEntries(
  SETTINGS_CATEGORY_DEFS.map((def) => [def.id, def.name]),
);

const categoryLabel = (category: string): string =>
  CATEGORY_NAME[category as AnyNotificationCategory] ?? category.replace(/_/g, ' ');

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function InboxPage({ onClose, onOpenItem }: { onClose: () => void; onOpenItem: (deepLink: string) => void }) {
  const { apiFetch } = useHost();
  const [events, setEvents] = useState<InboxEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await apiFetch({ method: 'GET', path: '/api/notifications/inbox' }, signal ? { signal } : undefined);
        if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`);
        const json: unknown = JSON.parse(res.body);
        if (!isInboxResponse(json)) throw new Error('unexpected response');
        setEvents(json.events);
        setError(null);
      } catch (e) {
        if (signal?.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [apiFetch],
  );

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-era text-2xl font-semibold text-ink">Inbox</h1>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-white/40"
        >
          Back
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-white/20 px-4 py-3 text-sm text-ink-soft">
          <span>Couldn&rsquo;t load the inbox ({error}).</span>
          <button type="button" onClick={() => void load()} className="font-medium text-ink underline">
            Retry
          </button>
        </div>
      )}

      {events === null && !error && <p className="text-ink-soft">Loading&hellip;</p>}
      {events?.length === 0 && <p className="text-ink-soft">Nothing here yet &mdash; check back soon.</p>}

      {events && events.length > 0 && (
        <ul className="flex flex-col gap-2">
          {events.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onOpenItem(ev.deep_link)}
                className="flex w-full flex-col gap-1 rounded-2xl border border-white/20 px-4 py-3 text-left transition-colors hover:border-white/40"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft">{categoryLabel(ev.category)}</span>
                <span className="font-semibold text-ink">{ev.title}</span>
                <span className="text-sm text-ink-soft">{ev.body}</span>
                <span className="text-xs text-ink-soft">{formatTimestamp(ev.available_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
