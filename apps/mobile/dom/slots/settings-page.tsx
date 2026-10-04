import { useEffect, useState } from 'react';
import { NotificationSettingsPage } from '@swift2/ui/reader/settings/NotificationSettingsPage';
import { useHost } from '@swift2/ui';
import { SETTINGS_NATIVE_ROWS } from './settings-native-rows';
import { isSettingsPath, settingsOverlay, useSettingsOpen } from './settings-store';

// vapidPublicKey is null: the app registers a native push token (HostNotifications), never a web-push key.
// Closed = null (D2 mounts every registered overlay unconditionally). Unmounting on close means the OS
// permission is re-read on every open.
export function SettingsPage() {
  const open = useSettingsOpen();
  const { navigate, notifications } = useHost();
  // The native rows are host-gated: they show only once the native bridge answers (a plain browser has none).
  const [native, setNative] = useState(false);

  // A page loaded directly at a settings path (the parity harness, a reload) opens the overlay.
  useEffect(() => {
    if (isSettingsPath(window.location.pathname)) settingsOverlay.open();
  }, []);

  useEffect(() => {
    if (!open || !notifications) return;
    let live = true;
    notifications.status().then(
      () => live && setNative(true),
      () => live && setNative(false),
    );
    return () => {
      live = false;
    };
  }, [open, notifications]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Notification settings" className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <NotificationSettingsPage vapidPublicKey={null} />
      {native && (
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
      )}
    </div>
  );
}
