import { NotificationSettingsPage } from '@swift2/ui/reader/settings/NotificationSettingsPage';
import { useHost } from '@swift2/ui';
import { SETTINGS_NATIVE_ROWS } from './settings-native-rows';

// vapidPublicKey is null: the app registers a native push token (HostNotifications), never a web-push key.
export function SettingsPage() {
  const { navigate } = useHost();
  return (
    <div>
      <NotificationSettingsPage vapidPublicKey={null} />
      <nav aria-label="More settings" className="mx-auto flex max-w-xl flex-col gap-2 px-6 pb-16">
        {SETTINGS_NATIVE_ROWS.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => navigate(row.path)}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-ink"
          >
            {row.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
