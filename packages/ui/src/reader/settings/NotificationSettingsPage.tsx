'use client';

import { useHost } from '../../host/context';
import { WebNotificationSettings } from './WebNotificationSettings';

export function NotificationSettingsPage({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const { Link } = useHost();
  return (
    <section
      aria-labelledby="ll-notification-settings-heading"
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center gap-6 px-6 py-16 text-center"
    >
      <span className="text-4xl" aria-hidden>
        🔔
      </span>
      <h1 id="ll-notification-settings-heading" className="font-era text-2xl font-semibold text-ink">Notification settings</h1>
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
    </section>
  );
}
