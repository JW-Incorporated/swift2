import { InboxPage } from '@swift2/ui/reader/settings/InboxPage';
import { useHost } from '@swift2/ui';
import { inboxOverlay, useInboxOpen } from './inbox-store';
import { NEUTRAL } from './settings-page';

// The DOM notification inbox (W6-inbox-dom), above the settings overlay (z-60 vs z-50) in the same neutral palette.
// Rendered only while open AND the host has notifications (the app registers a native push token; a plain browser
// has none, so the overlay can never show there). A row closes the inbox, then navigates to the item's deep link.
export function InboxOverlay() {
  const open = useInboxOpen();
  const { navigate, notifications } = useHost();
  if (!open || !notifications) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Notification inbox" className="fixed inset-0 z-[60] overflow-y-auto" style={NEUTRAL}>
      <InboxPage
        onClose={inboxOverlay.close}
        onOpenItem={(deepLink) => {
          inboxOverlay.close();
          navigate(deepLink);
        }}
      />
    </div>
  );
}
