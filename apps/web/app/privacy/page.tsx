import type { Metadata } from 'next';
import { LegalDocument } from '@/components/longlive/LegalDocument';
import { PRIVACY_POLICY, legalRobots } from '@/lib/longlive/legal';

// The copy lives in `lib/longlive/legal.ts` — including the standing rule that
// any change to what the site collects must update it in the SAME change. This
// page is only the route.
//
// This replaces the July 2026 policy, which described a read-only app with no
// analytics and no forms. Three things shipped after it and none of them
// updated it: the feedback button (#427), the mood chat, and Vercel Web
// Analytics (#799). See #800.

export const metadata: Metadata = {
  title: `${PRIVACY_POLICY.title} — Long Live`,
  description: PRIVACY_POLICY.description,
  alternates: { canonical: '/privacy' },
  robots: legalRobots(),
};

export default function PrivacyPage() {
  return <LegalDocument doc={PRIVACY_POLICY} />;
}
