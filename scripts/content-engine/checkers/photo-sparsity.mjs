// Photo-sparsity checker (deterministic, NO NETWORK).
//
// Founder directive 2026-07-17: marquee pages — a photo shoot, a red carpet, a
// milestone — should be *loaded* with photos, not showing one. The data model
// and the inline layout (#761) both support many images per moment; the gap is
// that almost every moment carries a single image. This flags the ones that
// most deserve enrichment so photo-sourcing (#762) becomes a prioritized queue
// instead of a vibe.
//
// Scope is deliberately narrow: only HIGH-visibility moments (the engine's own
// marquee tier) with at most one image. The long tail of obscure single-photo
// catalog trivia is not worth a ticket — this is about the pages a fan actually
// lands on and expects to be rich.
import { makeFinding } from '../lib/finding.mjs';
import { tier } from '../lib/visibility.mjs';

export const id = 'content.photo-sparsity';

export async function check(items) {
  const findings = [];
  for (const it of items) {
    if (it.type !== 'moment') continue;
    if (tier(it) !== 'high') continue; // marquee only — a prioritized queue
    const n = it.images.length;
    if (n > 1) continue; // already has more than the hero
    findings.push(
      makeFinding({
        checker: id,
        severity: 'P2',
        title: `Marquee moment has ${n === 0 ? 'no photos' : 'only one photo'}`,
        itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
        excerpt: it.title,
        evidence: `This is a high-visibility moment (${it.era}) but carries ${n} image(s). Photo-shoot / red-carpet / milestone pages should be loaded with photos, woven through the prose (#761). Source several credited, reputable, ≥400px, unwatermarked photos of this specific moment.`,
        suggestedFix: 'Add 3–8 verified photos to this moment’s `photos` array — see the content epic #762.',
        confidence: 0.6,
      }),
    );
  }
  return findings;
}
