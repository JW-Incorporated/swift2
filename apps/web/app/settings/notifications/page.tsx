import type { Metadata } from 'next';
import { NotificationSettingsPage } from '@swift2/ui/reader/settings/NotificationSettingsPage';

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

export default function NotificationSettingsRoute() {
  // VAPID_PUBLIC_KEY is safe to ship to the client — it's the PUBLIC half
  // of the keypair, the same way a TLS certificate's public key is public;
  // only VAPID_PRIVATE_KEY (server-only, never NEXT_PUBLIC_*) can actually
  // sign push messages. See SETUP_NOTIFICATIONS.md for the full posture.
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <main>
      <NotificationSettingsPage vapidPublicKey={vapidPublicKey} />
    </main>
  );
}
