// Depth-deficit checker (deterministic, NO NETWORK).
//
// Founder directive 2026-07-18: some of the pages a fan cares most about are
// thin. The engagement-ring page is the canonical example — a `defining`
// event, but light on the goldsmith, the ring's provenance, celebrity-ring
// comparisons, a macro shot, and (labeled) rumor coverage.
//
// Scope is deliberately the crown jewels: `significance: 'defining'` items —
// the ~two-dozen genuinely life-altering moments (weddings, album releases,
// records) a fan would name years later. These are the pages that MUST be
// exhaustive, and the set is small enough to be a real queue. (photo-sparsity
// already covers the broader "high-visibility moment with ≤1 photo" case; this
// checker is not about the long tail — flagging every newest-era moment would
// just be noise.) For each defining item it measures depth across FOUR axes —
// narrative, photos, sources, cross-links — against a floor, and reports
// exactly which axes fall short.
//
// That per-axis gap list is the input to the curiosity → answer pipeline
// (docs/content-ops/curiosity-engine.md): Lex (the Curious pass) turns each gap
// into the specific questions a superfan would ask, and the Answerer researches
// sourced answers + verified photos. So "thin but important" becomes a
// measurable, prioritized queue instead of a vibe.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.depth-deficit';

const wordCount = (s) => (typeof s === 'string' ? s.trim().split(/\s+/).filter(Boolean).length : 0);

// Depth floor for a `defining` moment. Deliberate minimums, not fill quotas:
// an item clears an axis the moment it meets the bar and is never padded past
// it. A defining event earns deep narrative, several credited photos, multiple
// independent sources, and cross-links into the threads/moments it connects to.
const BAR = { words: 260, images: 4, sources: 3, links: 2 };

export async function check(items) {
  const findings = [];
  for (const it of items) {
    if (it.type !== 'moment') continue;
    if (it.raw?.significance !== 'defining') continue; // crown jewels only

    const actual = {
      words: wordCount(it.texts?.context),
      images: it.images.length,
      sources: it.sources.length,
      links: (it.raw?.relatedIds?.length ?? 0) + (it.raw?.threadIds?.length ?? 0),
    };

    const gaps = [];
    if (actual.words < BAR.words) gaps.push(`narrative (${actual.words}/${BAR.words} words)`);
    if (actual.images < BAR.images) gaps.push(`photos (${actual.images}/${BAR.images})`);
    if (actual.sources < BAR.sources) gaps.push(`sources (${actual.sources}/${BAR.sources})`);
    if (actual.links < BAR.links) gaps.push(`cross-links (${actual.links}/${BAR.links})`);
    if (gaps.length === 0) continue;

    findings.push(
      makeFinding({
        checker: id,
        severity: 'P2',
        title: `Defining moment is under-depth (${gaps.length}/4 axes thin)`,
        itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
        excerpt: it.title,
        evidence: `A \`defining\` moment (${it.era}) falls short on: ${gaps.join('; ')}. The handful of pages fans land on for the biggest events should be deep across all four axes — narrative, photos, sources, and cross-links — not merely present.`,
        suggestedFix:
          'Route to the curiosity → answer pipeline (docs/content-ops/curiosity-engine.md): Lex generates the specific questions this page leaves unanswered, the Answerer researches sourced answers + verified photos, and they get woven in.',
        confidence: 0.7,
      }),
    );
  }
  return findings;
}
