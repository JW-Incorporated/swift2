import type { Metadata } from 'next';
import Link from 'next/link';

// Notifications Phase 1 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §8) —
// `/settings/notifications` on web. Per Phase 1's actual scope ("same API;
// manages web push later, for now shows 'get the app'") and spec §3 ("Web
// push: Phase 6, post-launch"): there is no anonymous device identity on
// web yet (no device_id equivalent, no push token flow), so this page is
// intentionally static — no fetch, no client component, nothing to wire to
// the prefs API until Phase 6 ships Web Push + `platform='web'` device
// registration. The mobile apps are the only place settings are live today.
export const metadata: Metadata = {
  title: 'Notification settings — Long Live',
  description: 'Manage Long Live notifications from the app. Web push is coming in a later update.',
  alternates: { canonical: '/settings/notifications' },
};

export default function NotificationSettingsPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="text-4xl" aria-hidden>
        🔔
      </span>
      <h1 className="font-era text-2xl font-semibold text-ink">Notification settings</h1>
      <p className="leading-relaxed text-ink-soft">
        Notification settings live in the Long Live app — the master switch, quiet hours, daily
        limit, and every category&rsquo;s cadence, all in one place, with changes applying
        instantly.
      </p>
      <p className="leading-relaxed text-ink-soft">
        Web push notifications for longlivets.com are coming in a later update. For now, get the app
        to turn notifications on.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
      >
        Back to Long Live
      </Link>
    </main>
  );
}
