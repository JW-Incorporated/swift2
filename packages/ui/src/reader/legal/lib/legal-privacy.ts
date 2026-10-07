import { PRIVACY_SECTIONS_A } from './legal-privacy-a';
import { PRIVACY_SECTIONS_B } from './legal-privacy-b';
import type { LegalDoc } from './legal-types';

// ───────────────────────────────────────────────────────────────────────────
// Privacy policy
// ───────────────────────────────────────────────────────────────────────────

export const PRIVACY_POLICY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  description: 'What Long Live collects, what it does not, and which third parties are involved.',
  summary:
    'Long Live has no accounts, no logins, no passwords, and no payments, and it never asks you for your name or email. Three features do send something: the feedback button sends what you type to our issue tracker, which is public; the mood chat sends what you type to an AI service so it can read the feeling; and Clownbot sends your questions to an AI service to answer them, and — only once an identity system described below is switched on — remembers the conversation in our database for up to 180 days. Everything else on this page is detail.',
  sections: [...PRIVACY_SECTIONS_A, ...PRIVACY_SECTIONS_B],
};
