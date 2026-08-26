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
export const titleSimilarity = (a, b) => jaccard(titleTokens(a), titleTokens(b));
const BODY_STOP = new Set([
  ...STOP,
  'taylor', 'swift', 'song', 'songs', 'album', 'albums', 'track', 'tracks',
  'era', 'eras', 'fan', 'fans', 'music', 'release', 'released',
]);
const bodyTokens = (s) =>
  new Set(
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !BODY_STOP.has(w)),
  );
const containment = (small, large) => {
  if (!small.size) return { score: 0, shared: 0 };
  let shared = 0;
  for (const x of small) if (large.has(x)) shared++;
  return { score: shared / small.size, shared };
};
const dateOf = (raw) =>
  raw?.date ?? (raw?.year ? `${raw.year}-${raw.month ?? 1}-${raw.day ?? 1}` : null);
const preciseDateOf = (raw) =>
  raw?.date ??
  (raw?.year && raw?.month && raw?.day ? `${raw.year}-${raw.month}-${raw.day}` : null);
const daysApart = (a, b) => {
  const x = Date.parse(a), y = Date.parse(b);
  return Number.isNaN(x) || Number.isNaN(y) ? Infinity : Math.abs(x - y) / 86_400_000;
};
const bodyOf = (m) => String(m.texts?.context ?? m.raw?.moment?.context ?? '').trim();

// Tunables. TITLE_NEAR catches "same article, authored twice"; the shoot rule
// catches "same photos, same week, same category" re-cuts. The stub rule
// catches a short, lightly sourced migration beside a much richer retelling;
// body containment keeps unrelated same-day angles out without relying on the
// titles being phrased alike.
const TITLE_NEAR = 0.6;
const SHOOT_TITLE_MIN = 0.2; // a re-cut of one shoot still shares some title words
const STUB_MAX_CHARS = 300;
const STUB_MAX_SOURCES = 1;
const RICH_MIN_RATIO = 3;
const RICH_MIN_SOURCES = 2;
const STUB_DATE_DAYS = 2;
const STUB_BODY_MIN = 0.35;
const STUB_SHARED_MIN = 3;

export async function check(items) {
  const moments = items.filter((i) => i.type === 'moment');
  const tok = moments.map((m) => titleTokens(m.title));
  const body = moments.map((m) => bodyOf(m));
  const bodyTok = body.map((s) => bodyTokens(s));
  const imgs = moments.map((m) => new Set((m.images ?? []).map((im) => im.url)));
  const date = moments.map((m) => dateOf(m.raw));
  const preciseDate = moments.map((m) => preciseDateOf(m.raw));
  const findings = [];

  for (let i = 0; i < moments.length; i++) {
    for (let j = i + 1; j < moments.length; j++) {
      const A = moments[i], B = moments[j];
      const tSim = jaccard(tok[i], tok[j]);
      const sharesImage = [...imgs[i]].some((u) => imgs[j].has(u));
      const sameCat = A.category && A.category === B.category;
      const close = date[i] && date[j] && daysApart(date[i], date[j]) <= 7;
      const [stubIdx, richIdx] = body[i].length <= body[j].length ? [i, j] : [j, i];
      const stub = moments[stubIdx], rich = moments[richIdx];
      const bodyMatch = containment(bodyTok[stubIdx], bodyTok[richIdx]);
      const stubRich =
        stub.era === rich.era &&
        preciseDate[stubIdx] &&
        preciseDate[richIdx] &&
        daysApart(preciseDate[stubIdx], preciseDate[richIdx]) <= STUB_DATE_DAYS &&
        body[stubIdx].length < STUB_MAX_CHARS &&
        (stub.sources?.length ?? 0) <= STUB_MAX_SOURCES &&
        body[richIdx].length >= body[stubIdx].length * RICH_MIN_RATIO &&
        (rich.sources?.length ?? 0) >= RICH_MIN_SOURCES &&
        bodyMatch.score >= STUB_BODY_MIN &&
        bodyMatch.shared >= STUB_SHARED_MIN;

      // Rule 1 — near-identical titles: almost certainly the same article.
      const nearIdentical = tSim >= TITLE_NEAR;
      // Rule 2 — same shoot: shares a photo, same category, within a week, and
      // at least loosely similar titles (so a hero image legitimately reused
      // across two clearly different stories doesn't trip it).
      const sameShoot = sharesImage && sameCat && close && tSim >= SHOOT_TITLE_MIN;
      // Rule 3 - migrated stub: same-era, same/near date, with one short,
      // lightly sourced write-up beside a 3x+ richer, well-sourced retelling.
      // Meaningful body-token containment distinguishes a retelling from a
      // genuinely separate angle on the same day's news.
      if (!nearIdentical && !sameShoot && !stubRich) continue;

      const crossEra = A.era !== B.era; // same article in two eras = a misfile
      const reportA = stubRich ? stub : A;
      const reportB = stubRich ? rich : B;
      const why = stubRich
        ? `likely migrated stub: ${body[stubIdx].length} body characters and ${stub.sources?.length ?? 0} sources vs ${body[richIdx].length} characters and ${rich.sources?.length ?? 0} sources, ${daysApart(preciseDate[stubIdx], preciseDate[richIdx])} days apart (${(bodyMatch.score * 100) | 0}% of the stub's meaningful body tokens recur in the richer retelling)`
        : nearIdentical
          ? `near-identical titles (${(tSim * 100) | 0}% token overlap)`
          : `same photo shoot: shared image + same "${A.category}" category within a week`;
      findings.push(
        makeFinding({
          checker: id,
          severity: crossEra ? 'P2' : 'P3',
          title: `Possible duplicate moments — ${crossEra ? 'across eras (likely a misfile)' : stubRich ? 'likely migrated stub' : 'consider merging'}`,
          itemRef: {
            type: 'moment',
            file: reportA.file,
            era: reportA.era,
            key: reportA.key,
            field: null,
          },
          excerpt: `“${reportA.title}” (${reportA.era}) vs “${reportB.title}” (${reportB.era})`,
          evidence: `These two moments look like duplicates — ${why}. ${
            crossEra
              ? 'They sit in different era files, which usually means one was authored in the wrong era.'
              : stubRich
                ? 'The short item may be a migrated stub beside a fuller version of the same moment.'
                : 'They may be the same event written up twice.'
          } A: ${reportA.file}. B: ${reportB.file}.`,
          suggestedFix:
            'Review the pair. If they are the same article, merge into one richer moment (keep the best home era) and delete the other. If they are deliberately distinct facets of one event, differentiate the titles so neither reads as the other.',
          confidence: stubRich ? 0.7 : nearIdentical ? 0.75 : 0.55,
        }),
      );
    }
  }
  return findings;
}
