import { LegalDocument } from '@swift2/ui/reader/legal/LegalDocument';
import { SiteFooter } from '@swift2/ui/reader/legal/SiteFooter';
import { SupportPage } from '@swift2/ui/reader/legal/SupportPage';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@swift2/ui/reader/legal/lib/legal';
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
import { useLegalPage } from './use-legal-page';

// WP2.13-D: /privacy, /terms and /support are standalone pages on the web, not
// reader modes, so the DOM shows them as a full-bleed layer over the reader
// keyed on the current in-DOM path (dom-path.ts). Each renders the same SiteFooter as its web route.
export function LegalOverlay() {
  const page = useLegalPage();
  if (!page) return null;
  const footer = <SiteFooter />;
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" data-legal-page={page}>
      {page === 'support' ? (
        <SupportPage footer={footer} />
      ) : (
        <LegalDocument doc={page === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE} footer={footer} />
      )}
    </div>
  );
}

/** The reader's floating feedback button, hidden while a legal page covers the reader (the website's legal routes have none). */
export function LegalAwareFeedback() {
  return useLegalPage() ? null : <FeedbackButton />;
}
