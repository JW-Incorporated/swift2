import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@swift2/ui/reader/moment/lib/useFocusTrap';
import { LegalDocument } from '@swift2/ui/reader/legal/LegalDocument';
import { SiteFooter } from '@swift2/ui/reader/legal/SiteFooter';
import { SupportPage } from '@swift2/ui/reader/legal/SupportPage';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@swift2/ui/reader/legal/lib/legal';
import { useLegalPage } from './use-legal-page';

// WP2.13-D: /privacy, /terms and /support are standalone pages on the web, not reader modes, so the DOM shows them as
// a full-bleed layer keyed on the current in-DOM path (dom-path.ts), each with the same SiteFooter as its web route.
// The layer is PORTALED to <body>, outside the reader's themed .era-shell, so it renders with the root palette like the
// website (inside the shell it would inherit the active era's variables); its scrollbar is hidden so it does not take
// layout width from the content (web pages scroll the document). It sits above every floating reader control (the
// feedback button is z-71) and, via useFocusTrap, is a labelled modal dialog: the other <body> children go inert while open,
// focus moves in and returns to the opener on close. Keyed per page so each legal page opens scrolled to the top.
// Opening a legal page over an open overlay (e.g. the Feedback dialog, which keeps only its own toggle live) is supported: each legal page is one entry
// on useBackDismiss's ordered back stack (setDomPath -> pushBackEntry), so Back closes the legal page and the overlay
// beneath stays open until the next Back (legal-over-feedback.test.ts).
const PAGE_LABEL = { privacy: 'Privacy Policy', terms: 'Terms of Use', support: 'Support' } as const;

export function LegalOverlay() {
  const page = useLegalPage();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(!!page, ref, page);
  if (!page) return null;
  const footer = <SiteFooter />;
  return createPortal(
    <div
      key={page}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={PAGE_LABEL[page]}
      tabIndex={-1}
      className="fixed inset-0 z-[80] overflow-y-auto outline-none"
      style={{ scrollbarWidth: 'none' }}
      data-legal-page={page}
    >
      {page === 'support' ? (
        <SupportPage footer={footer} />
      ) : (
        <LegalDocument doc={page === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE} footer={footer} />
      )}
    </div>,
    document.body,
  );
}
