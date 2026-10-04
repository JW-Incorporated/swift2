import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
// feedback button is z-71) and makes the other <body> children inert while open (the reader root, so late-mounted reader
// chrome is covered too). Keyed per page so each legal page opens scrolled to the top.
// Opening a legal page while a reader overlay is open is not supported: its popstate would also dismiss that overlay
// (useBackDismiss); legal pages are reached from the footer / a native tap, never from under an overlay.
export function LegalOverlay() {
  const page = useLegalPage();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const siblings = Array.from(document.body.children).filter((c) => c !== el && !c.hasAttribute('inert'));
    if (!el) return;
    for (const c of siblings) c.setAttribute('inert', '');
    return () => siblings.forEach((c) => c.removeAttribute('inert'));
  }, [page]);
  if (!page) return null;
  const footer = <SiteFooter />;
  return createPortal(
    <div key={page} ref={ref} className="fixed inset-0 z-[80] overflow-y-auto" style={{ scrollbarWidth: 'none' }} data-legal-page={page}>
      {page === 'support' ? (
        <SupportPage footer={footer} />
      ) : (
        <LegalDocument doc={page === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE} footer={footer} />
      )}
    </div>,
    document.body,
  );
}
