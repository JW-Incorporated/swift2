import { useEffect, useRef } from 'react';
import { LegalDocument } from '@swift2/ui/reader/legal/LegalDocument';
import { SiteFooter } from '@swift2/ui/reader/legal/SiteFooter';
import { SupportPage } from '@swift2/ui/reader/legal/SupportPage';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@swift2/ui/reader/legal/lib/legal';
import { useLegalPage } from './use-legal-page';

// WP2.13-D: /privacy, /terms and /support are standalone pages on the web, not
// reader modes, so the DOM shows them as a full-bleed layer over the reader
// keyed on the current in-DOM path (dom-path.ts). Each renders the same SiteFooter as its web route. The layer sits
// above every floating reader control (the feedback button is z-71, registered by D2) and makes its siblings inert
// while open, so reader chrome is neither visible nor focusable over a legal page, whatever else registers a floating slot.
export function LegalOverlay() {
  const page = useLegalPage();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const siblings = Array.from(el?.parentElement?.children ?? []).filter((c) => c !== el && !c.hasAttribute('inert'));
    for (const c of siblings) c.setAttribute('inert', '');
    return () => siblings.forEach((c) => c.removeAttribute('inert'));
  }, [page]);
  if (!page) return null;
  const footer = <SiteFooter />;
  return (
    <div ref={ref} className="fixed inset-0 z-[80] overflow-y-auto" data-legal-page={page}>
      {page === 'support' ? (
        <SupportPage footer={footer} />
      ) : (
        <LegalDocument doc={page === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE} footer={footer} />
      )}
    </div>
  );
}

