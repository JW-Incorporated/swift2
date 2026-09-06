// Top-of-feed photo checker (deterministic, NO NETWORK).
//
// Root-cause report 2026-09-05 (docs/audits/2026-09-05-newest-posts-no-images-
// root-cause.md, RC-3): every one of the 9 newest photo-less Showgirl-era pages
// was flagged daily by photo-sparsity — but only as P2, buried under a single
// rollup issue, and nothing in the engine weighted RECENCY. photo-sparsity
// ranks by visibility score, so a photo-less page published yesterday competes
// on equal terms with a photo-less page from 2008. The newest pages are what a
// visitor actually lands on first; this checker gives recency its own signal.
//
// Scope: for each era, the N newest moments by (year, month, day) — N =
// CONFIG.topOfFeed?.count ?? 10 — must carry a real photo OR an explicit
// `photosReviewed: '<reason>'` seed field recording a deliberate editorial
// decision (privacy redline, no verifiable image, etc.). Anything else is a
// **P1** finding, so it surfaces in the report's "Top findings" section
// instead of being buried in the P2 photo-sparsity rollup.
import { makeFinding } from '../lib/finding.mjs';
import { realPhotos } from '../lib/photo-marker.mjs';
import { CONFIG } from '../config.mjs';

export const id = 'content.top-of-feed-photo';

/** Newest-first date key. Missing day sorts as if it were the 1st. */
function dateKey(it) {
  const y = Number.isInteger(it.raw?.year) ? it.raw.year : 0;
  const m = Number.isInteger(it.raw?.month) ? it.raw.month : 0;
  const d = Number.isInteger(it.raw?.day) ? it.raw.day : 1;
  return y * 10000 + m * 100 + d;
}

export async function check(items) {
  const n = CONFIG.topOfFeed?.count ?? 10;
  const findings = [];

  const byEra = new Map();
  for (const it of items) {
    if (it.type !== 'moment') continue;
    if (!byEra.has(it.era)) byEra.set(it.era, []);
    byEra.get(it.era).push(it);
  }

  for (const [era, moments] of byEra) {
    const newest = [...moments].sort((a, b) => dateKey(b) - dateKey(a)).slice(0, n);
    newest.forEach((it, i) => {
      const position = i + 1;
      if (realPhotos(it).length > 0) return; // has a real (non-synthetic) photo
      const reason = it.raw?.photosReviewed;
      if (typeof reason === 'string' && reason.trim()) return; // deliberate, on record

      findings.push(
        makeFinding({
          checker: id,
          severity: 'P1',
          title: `Newest page in ${era} has no photo (position ${position} of ${newest.length})`,
          itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
          excerpt: it.title,
          evidence: `This is among the ${newest.length} newest moments in ${era} (position ${position}) and carries zero real photos. The top of the feed is what a visitor sees first — a text-only page here should either get a verified photo or a recorded \`photosReviewed\` reason (privacy redline, no verifiable image, etc.), not silently pass as "reviewed" via a P2 rollup nobody reads.`,
          suggestedFix:
            "Source a verified, credited photo for this moment, or if none exists / it is a deliberate editorial no-photo decision (e.g. a residence-privacy redline), add `photosReviewed: '<reason>'` to the seed item so this checker and the loader both recognize it as reviewed.",
          confidence: 0.7,
        }),
      );
    });
  }

  return findings;
}
