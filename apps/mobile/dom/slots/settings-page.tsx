import { useEffect, useState, type CSSProperties } from 'react';
import { NotificationSettingsPage } from '@swift2/ui/reader/settings/NotificationSettingsPage';
import { ERA_CSS_VAR_NAMES, ERA_TOKENS } from '@swift2/experience';
import { useHost } from '@swift2/ui';
import { inboxOverlay, useInboxOpen } from './inbox-store';
import { useOnboardingPhase } from './onboarding-store';
import { isSettingsPath, settingsOverlay, useSettingsOpen } from './settings-store';

// The web /settings/notifications page sits outside the era shell, so it shows the default :root palette
// (tokens.generated.css) and no accent foreground. Re-declare exactly that here so the overlay matches the web
// page instead of taking the reader's active era colors.
export const NEUTRAL = {
  background: ERA_TOKENS.bg,
  color: ERA_TOKENS.ink,
  '--era-accent-fg': 'initial',
  ...Object.fromEntries(
    (Object.keys(ERA_CSS_VAR_NAMES) as (keyof typeof ERA_TOKENS)[]).map((k) => [ERA_CSS_VAR_NAMES[k], ERA_TOKENS[k]]),
  ),
} as CSSProperties;

// vapidPublicKey is null: the app registers a native push token (HostNotifications), never a web-push key.
// Closed = null (D2 mounts every registered overlay unconditionally). Unmounting on close means the OS
// permission is re-read on every open.
export function SettingsPage() {
  const open = useSettingsOpen();
  const { notifications } = useHost();
  // The inbox stacks above this dialog; while it is open this one is inert (no focus, taps or AT reach it).
  const inboxOpen = useInboxOpen();
  const behindOffer = useOnboardingPhase() === 'shown';
  // The inbox row is host-gated: they show only once the native bridge answers (a plain browser has none).
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
    <div role="dialog" aria-modal="true" aria-label="Notification settings" inert={inboxOpen || behindOffer} className="fixed inset-0 z-50 overflow-y-auto" style={NEUTRAL}>
      <NotificationSettingsPage vapidPublicKey={null} />
      {native && (
        <nav aria-label="More settings" className="mx-auto flex max-w-xl flex-col gap-2 px-6 pb-16">
          <button
            type="button"
            onClick={inboxOverlay.open}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-ink"
          >
            Notification inbox
          </button>
        </nav>
      )}
    </div>
  );
}
