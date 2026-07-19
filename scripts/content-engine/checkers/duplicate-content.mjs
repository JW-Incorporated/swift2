// Near-duplicate checker (deterministic, NO NETWORK).
//
// Two kinds of duplication hurt the vault:
//   1. The SAME moment authored twice — usually because it was filed in the
//      wrong era. The engagement announcement lived in BOTH showgirl.mjs and
//      tortured-poets.mjs; a fan saw two identical articles.
//   2. Near-duplicates — different write-ups of the same event or the same
//      photo shoot that a reader would expect to be one richer page.
//
// Exact-key collisions are already a build error; this catches the SEMANTIC
// ones the build can't see, and files a "consider merging" ticket for a human
// to judge. It never auto-merges — two write-ups of one event are sometimes
// deliberately distinct facets (the engagement's news vs its ring vs its
// outfit), and only a person should collapse them.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.duplicate-content';

// Title comparison ignores connective words so "…gym teacher are getting
// married" still matches "…gym teacher getting married". Kept deliberately
// small — real subject words (names, places, events) must carry the match.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with',
  'her', 'his', 'their', 'its', 'it', 'is', 'was', 'that', 'this', 'as', 'by',
  'from', 'are', 'your', 'my', 'you', 'she', 'he', 's',
]);
const titleTokens = (s) =>
  new Set(
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !STOP.has(w)),
  );
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};
const dateOf = (raw) =>
  raw?.date ?? (raw?.year ? `${raw.year}-${raw.month ?? 1}-${raw.day ?? 1}` : null);
const daysApart = (a, b) => {
  const x = Date.parse(a), y = Date.parse(b);
  return Number.isNaN(x) || Number.isNaN(y) ? Infinity : Math.abs(x - y) / 86_400_000;
};

// Tunables. TITLE_NEAR catches "same article, authored twice"; the shoot rule
// catches "same photos, same week, same category" re-cuts.
const TITLE_NEAR = 0.6;
const SHOOT_TITLE_MIN = 0.2; // a re-cut of one shoot still shares some title words

export async function check(items) {
  const moments = items.filter((i) => i.type === 'moment');
  const tok = moments.map((m) => titleTokens(m.title));
  const imgs = moments.map((m) => new Set((m.images ?? []).map((im) => im.url)));
  const date = moments.map((m) => dateOf(m.raw));
  const findings = [];

  for (let i = 0; i < moments.length; i++) {
    for (let j = i + 1; j < moments.length; j++) {
      const A = moments[i], B = moments[j];
      const tSim = jaccard(tok[i], tok[j]);
      const sharesImage = [...imgs[i]].some((u) => imgs[j].has(u));
      const sameCat = A.category && A.category === B.category;
      const close = date[i] && date[j] && daysApart(date[i], date[j]) <= 7;

      // Rule 1 — near-identical titles: almost certainly the same article.
      const nearIdentical = tSim >= TITLE_NEAR;
      // Rule 2 — same shoot: shares a photo, same category, within a week, and
      // at least loosely similar titles (so a hero image legitimately reused
      // across two clearly different stories doesn't trip it).
      const sameShoot = sharesImage && sameCat && close && tSim >= SHOOT_TITLE_MIN;
      if (!nearIdentical && !sameShoot) continue;

      const crossEra = A.era !== B.era; // same article in two eras = a misfile
      const why = nearIdentical
        ? `near-identical titles (${(tSim * 100) | 0}% token overlap)`
        : `same photo shoot: shared image + same "${A.category}" category within a week`;
      findings.push(
        makeFinding({
          checker: id,
          severity: crossEra ? 'P2' : 'P3',
          title: `Possible duplicate moments — ${crossEra ? 'across eras (likely a misfile)' : 'consider merging'}`,
          itemRef: { type: 'moment', file: A.file, era: A.era, key: A.key, field: null },
          excerpt: `“${A.title}” (${A.era}) vs “${B.title}” (${B.era})`,
          evidence: `These two moments look like duplicates — ${why}. ${
            crossEra
              ? 'They sit in different era files, which usually means one was authored in the wrong era.'
              : 'They may be the same event written up twice.'
          } A: ${A.file}. B: ${B.file}.`,
          suggestedFix:
            'Review the pair. If they are the same article, merge into one richer moment (keep the best home era) and delete the other. If they are deliberately distinct facets of one event, differentiate the titles so neither reads as the other.',
          confidence: nearIdentical ? 0.75 : 0.55,
        }),
      );
    }
  }
  return findings;
}
