import { AlertTriangle } from 'lucide-react';
import { isSubConfirmed, type Confidence, type SubConfirmed } from '@swift2/experience';
import { outletLabel } from '@swift2/shared';

/** Vault sources often carry the article's headline as `name`; a chip wants
 * the outlet ("TMZ"), so a long name yields to the host-derived label. */
export function chipOutlet(source?: { name?: string; url: string }): string | undefined {
  if (!source) return undefined;
  const name = source.name?.trim();
  if (name && name.length <= 24) return name;
  return outletLabel({ url: source.url });
}

// A moment at/above CONFIRMED_TIER (types.ts) is established fact — no
// qualifier. Below it, the claim is stamped twice: a compact chip under the
// title (`ConfidenceBanner`) and a one-line explainer in the footer
// (`ConfidenceNote`), so a rumor never visually passes as fact but the stamp
// no longer pushes the story below the fold (owner 2026-11-09: "I want them
// both to look the same" — the same chip + footer treatment the live news
// detail uses, `era/CurrentItemDetail.tsx`). This replaced the 2026-07-19
// full-width dashed box. Keyed by SubConfirmed (derived in types.ts from the
// same tuple as CONFIRMED_TIER), so moving a value across the tier is a
// compile error here, not a runtime undefined.
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
 * The sub-confirmed chip: a small dashed pill directly under the title, on
 * the era's own tokens (no hard-coded colors, per docs/longlive-experience.md
 * §6). Still `role="note"` with the label as its accessible name — the parity
 * harness and screen readers find it the same way they found the old box.
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
    <div className="mt-3">
      <span
        role="note"
        aria-label={`${banner.label}${outlet ? `, per ${outlet}` : ''}`}
        title={banner.blurb}
        className="inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border border-dashed px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-accent)]"
        style={{
          borderColor: 'var(--era-accent)',
          backgroundColor: 'color-mix(in srgb, var(--era-accent) 10%, transparent)',
        }}
      >
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
        {banner.label}
        {outlet && (
          <span className="truncate normal-case tracking-normal text-[color:var(--era-ink-soft)]">
            · per {outlet}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * The footer explainer for the same sub-confirmed moment, rendered above the
 * sources so the reader gets the "why" after the story rather than before it.
 */
export function ConfidenceNote({ confidence }: { confidence: Confidence }) {
  if (!isSubConfirmed(confidence)) return null;
  const banner = CONFIDENCE_BANNER[confidence];
  return (
    <p className="mt-8 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
      <span className="font-semibold text-[color:var(--era-accent)]">{banner.label}.</span>{' '}
      {banner.blurb}
    </p>
  );
}
