import { useSyncExternalStore } from 'react';
import { useHost } from '@swift2/ui';
import { LegalDocument } from '@swift2/ui/reader/legal/LegalDocument';
import { SupportPage } from '@swift2/ui/reader/legal/SupportPage';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@swift2/ui/reader/legal/lib/legal';
import { legalPageForPath } from './legal-route';

function subscribe(cb: () => void): () => void {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
}

// WP2.13-D: /privacy, /terms and /support are standalone pages on the web, not
// reader modes, so the DOM shows them as a full-bleed layer over the reader
// keyed on the host's current URL. The web SiteFooter is shell chrome and is
// not rendered here (G14).
export function LegalOverlay() {
  const { currentUrl } = useHost();
  const page = useSyncExternalStore(
    subscribe,
    () => legalPageForPath(currentUrl?.()),
    () => null,
  );
  if (!page) return null;
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" data-legal-page={page}>
      {page === 'support' ? (
        <SupportPage />
      ) : (
        <LegalDocument doc={page === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE} />
      )}
    </div>
  );
}
