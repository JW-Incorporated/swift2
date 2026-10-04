import { useEffect, useRef } from 'react';
import { InboxPage } from '@swift2/ui/reader/settings/InboxPage';
import { useFocusTrap } from '@swift2/ui/reader/moment/lib/useFocusTrap';
import { toWebPath, useHost } from '@swift2/ui';
import { canonicalizeLink } from '../../lib/notification-tap-queue';
import { inboxOverlay, useInboxOpen } from './inbox-store';
import { NEUTRAL } from './settings-page';

// The DOM notification inbox (W6-inbox-dom), above the settings overlay (z-60 vs z-50) in the same neutral palette.
// Rendered only while open AND the host has notifications (the app registers a native push token; a plain browser
// has none, so the overlay can never show there). A row's deep link is canonicalized to a site-relative path (the
// producers store absolute https://www.longlivets.com URLs); only a valid same-site link closes the inbox and
// navigates, anything else (other hosts, hostile schemes) is refused and the inbox stays open.
// Modal: focus moves in and is trapped, Escape closes it, and Settings underneath is inert (settings-page.tsx).
export function InboxOverlay() {
  const open = useInboxOpen();
  const { navigate, notifications } = useHost();
  const shown = open && Boolean(notifications);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(shown, ref);
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') inboxOverlay.close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shown]);
  if (!shown) return null;
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Notification inbox" className="fixed inset-0 z-[60] overflow-y-auto" style={NEUTRAL}>
      <InboxPage
        onClose={inboxOverlay.close}
        onOpenItem={(deepLink) => {
          const rel = canonicalizeLink(deepLink);
          const path = rel === null ? null : toWebPath(rel);
          if (!path) return;
          inboxOverlay.close();
          navigate(path);
        }}
      />
    </div>
  );
}
