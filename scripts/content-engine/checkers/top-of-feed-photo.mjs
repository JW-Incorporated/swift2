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
// honestly captioned, not necessarily a photo of the exact moment). The ONLY
// standing exemption that survives is a genuine, deliberate PRIVACY decision
// (a residence redline, a private-individual composite redline) — those are
// editorial calls to withhold a photo that exists, not a failure to find one,
// and they stay exempt. See isPrivacyExemption below: a `photosReviewed`
// reason now only suppresses this finding when it reads as a privacy
// decision; anything else (including "no verifiable image", "not sourced",
// "egress-blocked") is treated as NOT reviewed and keeps failing here until a
// real photo is added.
//
// Scope: for each era, the N newest moments by (year, month, day) — N =
// CONFIG.topOfFeed?.count ?? 10 — must carry a real photo OR a genuine
// privacy-exemption `photosReviewed` reason. Anything else is a **P1**
// finding, so it surfaces in the report's "Top findings" section instead of
// being buried in the P2 photo-sparsity rollup.
import { makeFinding } from '../lib/finding.mjs';
import { realPhotos } from '../lib/photo-marker.mjs';
import { CONFIG } from '../config.mjs';

export const id = 'content.top-of-feed-photo';

/**
 * A `photosReviewed` reason only exempts a moment from this checker when it
 * reads as a genuine PRIVACY decision (withholding a photo that exists),
 * never as "couldn't find one" (2026-09-06 policy — see header). Matches the
 * vocabulary already used across the corpus: "privacy redline",
 * "private individual"/"private-individual", and the residence-privacy
 * shorthand "L1"/"L2" used alongside "redline" in existing entries.
 */
export function isPrivacyExemption(reason) {
  if (typeof reason !== 'string' || !reason.trim()) return false;
  return /privacy|private[\s-]?individual/i.test(reason);
}

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
      if (isPrivacyExemption(reason)) return; // genuine privacy decision, on record

      const hadNonPrivacyReason = typeof reason === 'string' && reason.trim() && !isPrivacyExemption(reason);
      findings.push(
        makeFinding({
          checker: id,
          severity: 'P1',
          title: `Newest page in ${era} has no photo (position ${position} of ${newest.length})`,
          itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
          excerpt: it.title,
          evidence: hadNonPrivacyReason
            ? `This is among the ${newest.length} newest moments in ${era} (position ${position}) and carries zero real photos. Its \`photosReviewed\` reason (${JSON.stringify(reason)}) does not describe a privacy decision, so per the 2026-09-06 policy ("there's no such thing as a post without a picture") it no longer exempts this page — "couldn't find one" is not an acceptable outcome.`
            : `This is among the ${newest.length} newest moments in ${era} (position ${position}) and carries zero real photos. The top of the feed is what a visitor sees first — every post requires a real photo (2026-09-06 policy); the only standing exemption is a genuine, recorded privacy decision.`,
          suggestedFix:
            "Source a real, honestly-captioned, credited photo connected to this story (the subject, the venue, the event, the era's official art) — a picture is required, full stop. The only exemption is a genuine PRIVACY decision (e.g. a residence-privacy redline or a private-individual composite redline): record that with `photosReviewed: '<reason>'` naming the privacy concern explicitly.",
          confidence: 0.7,
        }),
      );
    });
  }

  return findings;
}

