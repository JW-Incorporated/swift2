import { register } from './instance';
import { LegalAwareFeedback, LegalOverlay } from './legal-overlay';

// WP2.13-D: legal pages (overlay:legal, keyed on the current in-DOM path, with the web SiteFooter) and the
// feedback button (floating, hidden while a legal page is showing). Native LegalPageScreen stays for fallback.
export const LEGAL_SLICE = 'legal';
export const LEGAL_SLOTS = {
  'overlay:legal': LegalOverlay,
  floating: LegalAwareFeedback,
} as const;

register({ slice: LEGAL_SLICE, slots: LEGAL_SLOTS });
