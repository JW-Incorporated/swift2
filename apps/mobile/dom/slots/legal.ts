import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
import { register } from './instance';
import { LegalOverlay } from './legal-overlay';

// WP2.13-D: legal pages (overlay:legal, keyed on the current URL) and the
// feedback button (floating). SiteFooter is shell chrome (G14), not registered here.
// Native LegalPageScreen stays for fallback; App.tsx routing is a PR-body item.
export const LEGAL_SLICE = 'legal';
export const LEGAL_SLOTS = {
  'overlay:legal': LegalOverlay,
  floating: FeedbackButton,
} as const;

register({ slice: LEGAL_SLICE, slots: LEGAL_SLOTS });
