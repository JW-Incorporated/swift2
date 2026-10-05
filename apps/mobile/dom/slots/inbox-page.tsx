import { useRef } from 'react';
import { InboxPage } from '@swift2/ui/reader/settings/InboxPage';
import { useFocusTrap } from '@swift2/ui/reader/moment/lib/useFocusTrap';
import { toWebPath, useHost } from '@swift2/ui';
import { canonicalizeLink } from '../../lib/notification-tap-queue';
import { resolveDestination } from '../../lib/destination-resolver';
import { isNativeRoute as isHostRoute } from './routes';
import { isInboxPath, isSettingsPath } from './settings-paths';
import { settingsOverlay } from './settings-store';
import { inboxOverlay, useInboxOpen } from './inbox-store';
import { NEUTRAL } from './settings-page';

// The DOM notification inbox (W6-inbox-dom), above the settings overlay (z-60 vs z-50) in the same neutral palette.
// Rendered only while open AND the host has notifications (the app registers a native push token; a plain browser
// has none, so the overlay can never show there). A row's deep link is canonicalized to a site-relative path (the
// producers store absolute https://www.longlivets.com URLs); only a valid same-site link navigates (the reader's
// deep-link apply closes the inbox once the target resolves); anything else is refused and the inbox stays open.
// Modal: focus moves in and is trapped, Escape closes it, and Settings underneath is inert (settings-page.tsx).
export function InboxOverlay() {
  const open = useInboxOpen();
  const { navigate, notifications, openExternal, embedOrigin } = useHost();
  const shown = open && Boolean(notifications);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(shown, ref);
  if (!shown) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          inboxOverlay.close();
        }
      }}
      role="dialog" aria-modal="true" aria-label="Notification inbox" className="fixed inset-0 z-[60] overflow-y-auto" style={NEUTRAL}>
      <InboxPage
        onClose={inboxOverlay.close}
        onOpenItem={(deepLink) => {
          const rel = canonicalizeLink(deepLink);
          if (rel === null) return;
          // The one resolver: legacy producer forms (?screen=settings, ?current=inbox, ...) become the DOM's own destinations.
          const dest = resolveDestination(rel, { isHostRoute });
          if (dest.kind === 'native') {
            // A registered host route goes over the bridge; anything else the DOM cannot show opens in the browser. The inbox stays open either way.
            if (isHostRoute(dest.path)) {
              const hp = toWebPath(dest.path);
              if (hp) navigate(hp);
            } else openExternal?.(new URL(dest.path, embedOrigin ?? 'https://www.longlivets.com').toString());
            return;
          }
          const dpath = new URL(dest.path, 'http://dom.invalid').pathname;
          if (isInboxPath(dpath)) return;
          if (isSettingsPath(dpath)) {
            inboxOverlay.close();
            settingsOverlay.open();
            return;
          }
          const path = toWebPath(dest.path);
          if (!path) return;
          navigate(path);
        }}
      />
    </div>
  );
}
