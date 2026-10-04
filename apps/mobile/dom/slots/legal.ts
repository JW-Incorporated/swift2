import { register } from './instance';
import { LegalOverlay } from './legal-overlay';

// WP2.13-D: legal pages (overlay:legal, keyed on the current in-DOM path, with the web SiteFooter). The floating
// feedback button is D2's slot, not registered here; the overlay covers it. Native LegalPageScreen stays for fallback.
export const LEGAL_SLICE = 'legal';
export const LEGAL_SLOTS = {
  'overlay:legal': LegalOverlay,
} as const;

register({ slice: LEGAL_SLICE, slots: LEGAL_SLOTS });
