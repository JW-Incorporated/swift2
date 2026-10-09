import { AlertTriangle } from 'lucide-react';
import { isSubConfirmed, type Confidence, type SubConfirmed } from '@swift2/experience';

// A moment at/above CONFIRMED_TIER (types.ts) is established fact — no
// qualifier. Below it, the claim gets the UNMISSABLE banner below (not a
// subtle pill — replaced 2026-07-19): a bold label plus the reporting outlet
// and a one-line explainer, so a rumor can never visually pass as fact.
// Keyed by SubConfirmed (derived in types.ts from the same tuple as
// CONFIRMED_TIER), so moving a value across the tier is a compile error
// here, not a runtime undefined.
const CONFIDENCE_BANNER: Record<SubConfirmed, { label: string; blurb: string }> = {
  reputable_reporting: {
    label: 'Reported — not confirmed',
    blurb: 'Press reporting. Not confirmed by Taylor, her team, or an official source.',
  },
  strong_fan_consensus: {
    label: 'Rumor — unconfirmed',
    blurb: 'Widely believed by fans, but never confirmed.',
  },
  plausible: {
    label: 'Rumor — unconfirmed',
    blurb: 'A plausible but unconfirmed claim.',
  },
  clowning: {
    label: 'Rumor — unconfirmed',
    blurb: 'Fans are joking-but-hoping. Nothing here is confirmed.',
  },
  disproven: {
    label: 'Debunked',
    blurb: 'This claim has been disproven.',
  },
  joke_meme: {
    label: 'Joke / meme — not a real claim',
    blurb: 'Circulating as a joke, not as fact.',
  },
};

/**
 * The unmissable sub-confirmed banner: a full-width, bordered strip directly
 * under the title. Deliberately NOT the quiet pill treatment confirmed
 * moments get — a rumored moment must read as rumored at a glance, on the
 * era's own tokens (no hard-coded colors, per docs/longlive-experience.md §6).
 */
export function ConfidenceBanner({
  confidence,
  outlet,
}: {
  confidence: Confidence;
  outlet?: string;
}) {
  if (!isSubConfirmed(confidence)) return null;
  const banner = CONFIDENCE_BANNER[confidence];
  return (
    <div
      role="note"
      aria-label={`${banner.label}${outlet ? `, per ${outlet}` : ''}`}
      className="mt-5 rounded-xl border-2 border-dashed p-4"
      style={{
        borderColor: 'var(--era-accent)',
        backgroundColor: 'color-mix(in srgb, var(--era-accent) 8%, var(--era-surface))',
      }}
    >
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {banner.label}
        {outlet && (
          <span className="normal-case tracking-normal text-[color:var(--era-ink-soft)]">
            · per {outlet}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        {banner.blurb}
      </p>
    </div>
  );
}
