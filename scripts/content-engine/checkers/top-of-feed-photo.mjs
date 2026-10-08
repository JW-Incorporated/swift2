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
// POLICY CHANGE (2026-09-06, Joey, kanban t_40f29d07): "There's no such thing
// as a post without a picture." A `photosReviewed` reason used to suppress
// this finding for ANY stated reason, including "no reusable/verifiable photo
// exists" — which is exactly the excuse that shipped a real post
// (the-life-of-a-showgirl.mjs's `i-knew-it-i-knew-you-country-radio-double-
// meanings` moment, reviewed under t_187359e9) with zero images. Joey's
// ruling: "no photo found" is never an acceptable outcome — be smarter and
// pull a legitimately-connected real photo instead (the venue, the radio
// station, the subject's own official art for the same story — anything
// honestly captioned, not necessarily a photo of the exact moment). A safe
// connected visual is still required when privacy rules out the obvious one.
//
// Scope: for each era, the N newest moments by (year, month, day) — N =
// CONFIG.topOfFeed?.count ?? 10 — must carry authored photo, video, or social
// embed media. Anything else is a **P1**
// finding, so it surfaces in the report's "Top findings" section instead of
// being buried in the P2 photo-sparsity rollup.
import { makeFinding } from '../lib/finding.mjs';
import { CONFIG } from '../config.mjs';
import { momentMediaErrors } from '../../lib/moment-media-gate.mjs';

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
      if (momentMediaErrors(it.raw).length === 0) return;
      findings.push(
        makeFinding({
          checker: id,
          severity: 'P1',
          title: `Newest page in ${era} has no authored media (position ${position} of ${newest.length})`,
          itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
          excerpt: it.title,
          evidence: `This is among the ${newest.length} newest moments in ${era} (position ${position}) and has no renderable authored photo, video, or social embed. Empty photo objects, era fallback art, source links, and \`photosReviewed\` notes do not satisfy the publication rule.`,
          suggestedFix:
            'Add a relevant, verified photo, official YouTube video, or Instagram embed. If the obvious image creates a privacy problem, choose a safe connected public visual.',
          confidence: 0.7,
        }),
      );
    });
  }

  return findings;
}
