import type { Metadata } from 'next';
import { LegalDocument } from '@/components/longlive/LegalDocument';
import { TERMS_OF_USE, legalRobots } from '@/lib/longlive/legal';

// Copy lives in `lib/longlive/legal.ts`. New route for #800 — the LEGAL launch
// gate asked for a privacy policy AND terms; only the privacy route existed.
// The terms also carry the unaffiliated-fan-project position, the third-party
// rights/credit stance, and the takedown contact path.

export const metadata: Metadata = {
  title: `${TERMS_OF_USE.title} — Long Live`,
  description: TERMS_OF_USE.description,
  alternates: { canonical: '/terms' },
  robots: legalRobots(),
};

export default function TermsPage() {
  return <LegalDocument doc={TERMS_OF_USE} />;
}
