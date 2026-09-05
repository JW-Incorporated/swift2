import type { Metadata } from 'next';
import Link from 'next/link';
import { WebNotificationSettings } from '@/components/longlive/WebNotificationSettings';

// Notifications Phase 1 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §8) —
// `/settings/notifications` on web. Phase 1 shipped this as a static "get
// the app" page (no anonymous device identity existed on web yet). Phase 6
// (NOTIFICATIONS_PLAN.md: "Web Push with VAPID keys... registering
// platform='web' devices through the existing pipeline unchanged") gives
// web that identity, so this page now renders the real settings UI —
// `WebNotificationSettings` handles the subscribe flow and, once
// subscribed, the exact same prefs API the mobile apps already use.
export const metadata: Metadata = {
  title: 'Notification settings — Long Live',
  description: 'Manage Long Live notifications, including web push for longlivets.com.',
  alternates: { canonical: '/settings/notifications' },
};

export default function NotificationSettingsPage() {
  // VAPID_PUBLIC_KEY is safe to ship to the client — it's the PUBLIC half
  // of the keypair, the same way a TLS certificate's public key is public;
  // only VAPID_PRIVATE_KEY (server-only, never NEXT_PUBLIC_*) can actually
  // sign push messages. See SETUP_NOTIFICATIONS.md for the full posture.
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        🔔
      </span>
      <h1 className="font-era text-2xl font-semibold text-ink">Notification settings</h1>
      <p className="max-w-md leading-relaxed text-ink-soft">
        Get Long Live notifications right here in your browser, or in the app — the master switch,
        quiet hours, daily limit, and every category&rsquo;s cadence, all in one place, with changes
        applying instantly.
      </p>

      <WebNotificationSettings vapidPublicKey={vapidPublicKey} />

      <Link
        href="/"
        className="mt-2 inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-white/40"
      >
        Back to Long Live
      </Link>
    </main>
  );
}
