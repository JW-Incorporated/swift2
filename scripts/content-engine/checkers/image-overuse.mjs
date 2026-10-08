// Image-overuse checker (deterministic, NO NETWORK).
//
// Founder observation 2026-07-17: the Speak Now album cover shows up as the
// photo on many different moments — "2-3 is ok, but that's excessive." It's not
// the era-art fallback; it's the same real URL (usually a Wikipedia album cover)
// explicitly reused as the stand-in photo across unrelated moments, which reads
// as filler and makes a whole era look samey. The sparsity checker
// (content.photo-sparsity) counts photos-per-moment; this counts the opposite —
// one image spread across too many moments — so the two together cover both
// "too few photos here" and "the same photo everywhere."
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.image-overuse';

// 2-3 reuses can be legitimately apt (a single's cover on that song's moments).
// 4+ distinct moments sharing one image is where it reads as a placeholder.
const MAX_OK_REUSE = 3;

export async function check(items) {
  const byUrl = new Map(); // url -> [{key,file,era}]
  for (const it of items) {
    if (it.type !== 'moment') continue;
    const seen = new Set();
    for (const im of it.images) {
      if (!/^https?:\/\//.test(im.url) || seen.has(im.url)) continue;
      seen.add(im.url); // count each moment at most once per url
      if (!byUrl.has(im.url)) byUrl.set(im.url, []);
      byUrl.get(im.url).push({ key: it.key, file: it.file, era: it.era });
    }
  }
  const findings = [];
  for (const [url, uses] of byUrl) {
    if (uses.length <= MAX_OK_REUSE) continue;
    const first = uses[0];
    findings.push(
      makeFinding({
        checker: id,
        severity: 'P2',
        title: `One image reused on ${uses.length} moments (reads as a placeholder)`,
        itemRef: { type: 'image', file: first.file, era: null, key: url, field: null },
        excerpt: url,
        evidence: `This exact image is the photo on ${uses.length} different moments (${uses.slice(0, 6).map((u) => u.key).join('; ')}${uses.length > 6 ? '…' : ''}). That many repeats — usually an album cover standing in for real photos — reads as filler and makes the era look samey. Keep it on at most 2–3 moments where it is genuinely apt; source a distinct, real photo for the rest.`,
        suggestedFix: 'Replace this reused image with a distinct real photo on all but the 2–3 moments where it truly fits.',
        confidence: 0.8,
      }),
    );
  }
  return findings;
}
