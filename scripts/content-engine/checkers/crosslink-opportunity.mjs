// Cross-link opportunity checker (deterministic, NO NETWORK).
//
// Founder directive (Wyatt, 2026-07-19): "the cross linking between articles is
// currently very weak. Where it makes sense, the content should fluidly link
// together from branching off points and related topics."
//
// Stage 1 (PR #912) made authored `moment:` cross-links actually render — the
// "Keep reading" rail in MomentDetail.tsx. But the rail can only surface links
// a writer already authored, and only ~8% of the vault has any: 82 links across
// ~697 moments. The other ~92% is the gap. This checker finds it.
//
// It finds moments that plausibly SHOULD link and don't. Flagging is
// deliberately conservative — a queue of hundreds of noisy pairs is worse than
// no checker, because nobody works it. The signals it combines:
//
//   - a shared DISTINCTIVE named entity (a person, place, org, song, or costume
//     that appears in only a handful of moments — "Scooter Braun", "Big Machine",
//     "Aaron Dessner" — NOT vault-wide terms like "Eras Tour", and NOT recurring
//     award shows / venues / outlets, which are context, not a shared subject)
//   - a shared narrative THREAD (threadIds — explicit story-arc membership)
//   - a BODY cross-reference: one moment's prose names the other's subject
//   - corroborating metadata: shared tag, same era + category, close dates
//
// Two precise paths reach a finding, and the OUTPUT is organized so the queue
// stays workable rather than combinatorial:
//
//   A. SUBJECT CLUSTERS — a distinctive subject named in ≥2 moment TITLES is the
//      strongest, most specific signal in the vault. Three moments about "Our
//      Song" are ONE editorial job, so they collapse into ONE cluster finding
//      listing every member — not three near-identical pair tickets.
//   B. DEEP PAIRS — connections with no shared title subject that still clear a
//      ≥2-independent-signal bar (a subject shared in the prose, a thread, a body
//      cross-reference), reported one per pair. The rarer "deep cut" links.
//
// Rare signals are weighted heavily and common ones lightly (a subject in 3
// moments is a strong link; one in 27 is nearly a stopword). Pairs that are
// near-duplicate titles (duplicate-content's job) or that ALREADY link either
// direction are skipped.
//
// It never authors `relatedIds`. Per the content-ops pipeline, surfacing the
// opportunity is Lex's job and authoring the link is the Answerer's; this
// checker is only the detector that feeds them.
import { makeFinding } from '../lib/finding.mjs';
// slugify + SLUG_TO_ERA_ID come from the dependency-free shared module (NOT the
// sync script, which pulls @supabase/supabase-js) so the content engine keeps
// running with zero install — same id derivation the front-end resolves against.
import { slugify, SLUG_TO_ERA_ID } from '../../lib/longlive-sync-shared.mjs';

export const id = 'content.crosslink-opportunity';

// ── entity extraction ──────────────────────────────────────────────────────
// A named entity is a run of Capitalized words (person/place/org/work titles),
// allowing lowercase connectives inside the run ("Album of the Year", "Big
// Machine"). Single capitalized words are too noisy to trust, so a run must
// carry at least two significant (non-connective) words. DROP removes the
// vault-ubiquitous name — "Taylor Swift" is in nearly every moment, so it
// carries zero linking signal.
const JOIN = new Set(['of', 'the', 'and', 'for', 'a', 'to']);
const DROP = new Set(['taylor', 'swift', 'taylor swift', 'the', 'her', 'his', 'she', 'no']);

// CONTEXT entities, not SUBJECT entities. An award show, an accolade name, a
// venue, or a TV/press outlet recurs across the catalog because events keep
// happening AT it — two different-year gowns at "the Billboard Music Awards"
// share a red carpet, not a subject. Left as strong signals they flooded the
// queue with weak cross-era fashion/award pairs. So they never count as a
// distinctive link on their own; at most they corroborate a real subject match.
// (Recurring PEOPLE — Joe Alwyn, William Bowery — are NOT here: a person who
// appears across eras is still a genuine shared subject, so an era-spread rule
// would wrongly demote them. This stays a small, curated, stable list instead.)
const CONTEXT_ENTITY = new Set([
  // award shows
  'acm awards', 'academy of country music awards', 'cma awards', 'cma award',
  'cmt music awards', 'cmt awards', 'american music awards', 'billboard music awards',
  'mtv video music awards', 'video music awards', 'iheartradio music awards',
  'peoples choice awards', 'people s choice awards', 'golden globes', 'golden globe awards',
  'academy awards', 'brit awards', 'grammy awards', 'the grammys',
  // accolade names (recurring categories, not a shared subject)
  'album of the year', 'artist of the year', 'entertainer of the year',
  'song of the year', 'record of the year', 'video of the year',
  'songwriter of the year', 'woman of the decade', 'artist of the decade',
  // TV / press outlets
  'good morning america', 'saturday night live', 'rolling stone', 'the tonight show',
  'entertainment weekly', 'time magazine', 'the new york times', 'apple music',
  // recurring venues
  'madison square garden', 'staples center', 'tokyo dome', 'met gala',
  'grand ole opry', 'grand ole opry house',
  // generic tour/geography phrases
  'world tour', 'stadium tour', 'north american', 'new york', 'new york city',
  'los angeles',
]);

export function entitiesOf(text) {
  const out = new Set();
  let run = [];
  const flush = () => {
    while (run.length && JOIN.has(run[run.length - 1].toLowerCase())) run.pop();
    while (run.length && JOIN.has(run[0].toLowerCase())) run.shift();
    const significant = run.filter((w) => !JOIN.has(w.toLowerCase()));
    if (significant.length >= 2) {
      const key = run.join(' ').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (key && !DROP.has(key)) out.add(key);
    }
    run = [];
  };
  for (const raw of String(text || '').split(/\s+/)) {
    const w = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
    if (!w) { flush(); continue; }
    if (/^[A-Z]/.test(w) || (JOIN.has(w.toLowerCase()) && run.length)) run.push(w);
    else flush();
  }
  flush();
  return out;
}

// ── title-similarity guard (borrowed shape from duplicate-content) ──────────
// A pair whose titles are near-identical is a DUPLICATE, not a cross-link
// opportunity — that pair belongs to duplicate-content, so we skip it here.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with',
  'her', 'his', 'their', 'its', 'it', 'is', 'was', 'that', 'this', 'as', 'by',
  'from', 'are', 'your', 'my', 'you', 'she', 'he', 's',
]);
const titleTokens = (s) =>
  new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)));
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

const dateOf = (raw) => raw?.date ?? (raw?.year ? `${raw.year}-${raw.month ?? 1}-${raw.day ?? 1}` : null);
const daysApart = (a, b) => {
  const x = Date.parse(a), y = Date.parse(b);
  return Number.isNaN(x) || Number.isNaN(y) ? Infinity : Math.abs(x - y) / 86_400_000;
};

// The content-item id the front-end resolves `moment:` links against — the same
// derivation the sync script and validate-content use (title → slugify, eraSlug
// → eraId). Lets us tell an ALREADY-linked pair (in either direction) apart from
// a real opportunity, so the checker never re-flags an existing cross-link.
const momentId = (m) => `vault-${SLUG_TO_ERA_ID[m.era] ?? m.era}-${slugify(m.title ?? '')}`;

// ── tunables ────────────────────────────────────────────────────────────────
const DISTINCTIVE_DF = 5;   // entity in ≤5 moments = a strong, specific link signal
const BROAD_DF = 12;        // 6..12 = weak corroboration; >12 (e.g. "eras tour") = ignored
const PROX_DAYS = 45;       // "close in time" for a same-era pair
const DUP_TITLE = 0.5;      // ≥ this title overlap → a duplicate, not a cross-link
const SCORE_MIN = 4;        // evidence bar to flag
const SIGNAL_CATS_MIN = 2;  // must draw on ≥2 independent signal categories

const distinctiveOf = (df, e) => (df.get(e) ?? 0) <= DISTINCTIVE_DF && !CONTEXT_ENTITY.has(e);

/**
 * Score a candidate pair. Pure and exported for tests. `df` maps an entity key
 * to how many moments across the corpus mention it (its document frequency).
 *
 * Returns { flag, confidence, cats, reasons, titleSubject }. `flag` is the
 * MULTI-SIGNAL (deep-pair) verdict: score bar cleared with ≥2 independent
 * categories. `titleSubject` (the distinctive subjects named in BOTH titles) is
 * the stronger signal — check() consumes it to CLUSTER same-subject moments into
 * one finding, rather than flagging each such pair here. So the two paths are:
 *
 *   A. TITLE-SUBJECT (clustered in check via `titleSubject`) — a rare subject in
 *      both titles ("Our Song") is the strongest, most specific link signal.
 *   B. MULTI-SIGNAL (`flag`) — no shared title subject, but a subject shared via
 *      snippet, a body cross-reference, or a thread, plus metadata, clears the bar.
 */
export function scorePair(A, B, ctx) {
  const { df, entA, entB, ctxA, ctxB } = ctx;
  const cats = new Set();
  const reasons = [];
  let score = 0;

  // Distinctive subjects the two share, split by WHERE they appear. A subject in
  // both TITLES is an unambiguous "these two pages are about the same thing";
  // one shared only via snippet/context is weaker (could be incidental mention).
  const titleEntsA = entitiesOf(A.title);
  const titleEntsB = entitiesOf(B.title);
  const sharedDistinct = [...entA].filter((e) => entB.has(e) && distinctiveOf(df, e));
  const titleSubject = sharedDistinct.filter((e) => titleEntsA.has(e) && titleEntsB.has(e));
  const snippetSubject = sharedDistinct.filter((e) => !titleSubject.includes(e));

  if (titleSubject.length) {
    score += 3;
    cats.add('title-subject');
    reasons.push(`both titles name “${titleSubject.slice(0, 3).join('”, “')}”`);
  }
  if (snippetSubject.length) {
    score += 2;
    cats.add('subject');
    reasons.push(`share ${snippetSubject.length === 1 ? 'subject' : 'subjects'} “${snippetSubject.slice(0, 3).join('”, “')}”`);
  }

  // Broad / context entities in common — corroboration only, never a lone flag.
  const broad = [...entA].filter((e) => {
    if (entB.has(e) && !distinctiveOf(df, e)) {
      const n = df.get(e) ?? 0;
      return CONTEXT_ENTITY.has(e) || (n > DISTINCTIVE_DF && n <= BROAD_DF);
    }
    return false;
  });
  if (broad.length) { score += 1; cats.add('broad-entity'); reasons.push(`also share “${broad.slice(0, 2).join('”, “')}”`); }

  // Shared narrative thread — explicit story-arc membership (strong).
  const threadsA = new Set(A.raw?.threadIds ?? []);
  const sharedThreads = (B.raw?.threadIds ?? []).filter((t) => threadsA.has(t));
  if (sharedThreads.length) { score += 2; cats.add('thread'); reasons.push(`same narrative thread “${sharedThreads[0]}”`); }

  // Body cross-reference: one moment's prose names the OTHER title's distinctive
  // subject — but only counts when it is NOT the subject already shared above,
  // so a same-subject pair can't double-count one connection as two signals.
  const refable = (e) => distinctiveOf(df, e) && !titleSubject.includes(e) && !snippetSubject.includes(e);
  const refBinA = [...titleEntsB].some((e) => refable(e) && ctxA.includes(e));
  const refAinB = [...titleEntsA].some((e) => refable(e) && ctxB.includes(e));
  if (refBinA || refAinB) { score += 2; cats.add('body-ref'); reasons.push("one moment's text discusses the other's subject"); }

  // Corroborating metadata.
  const tagsA = new Set(A.raw?.tags ?? []);
  const sharedTags = (B.raw?.tags ?? []).filter((t) => tagsA.has(t));
  if (sharedTags.length) { score += 1; cats.add('tag'); reasons.push(`shared tag “${sharedTags[0]}”`); }
  if (A.era === B.era && A.category && A.category === B.category) {
    score += 1; cats.add('era-category'); reasons.push(`same era + “${A.category}” category`);
  }
  const da = daysApart(dateOf(A.raw), dateOf(B.raw));
  if (A.era === B.era && da <= PROX_DAYS) { score += 1; cats.add('proximity'); reasons.push(`dates within ${Math.round(da)} days`); }

  // Verdict for the MULTI-SIGNAL (deep-pair) path: reach the score bar AND draw
  // on ≥2 independent signal categories, so nothing flags on a single weak
  // signal. Title-subject pairs are handled separately by clustering in check()
  // (which reads `titleSubject` below), so their strength isn't re-litigated here.
  const flag = score >= SCORE_MIN && cats.size >= SIGNAL_CATS_MIN;
  // Confidence tracks the evidence: a bare title-subject pair sits at 0.65, each
  // extra corroboration nudges it up toward a richly-linked 0.85.
  const confidence = Math.min(0.85, 0.5 + 0.05 * score);
  return { flag, confidence, cats, reasons, titleSubject };
}

export async function check(items) {
  const moments = items.filter((i) => i.type === 'moment');

  // Precompute per-moment entity sets, lowercased context, title tokens, ids,
  // and corpus-wide entity document frequency (for the rarity weighting).
  const entTS = moments.map((m) => entitiesOf(`${m.title}. ${m.raw?.snippet ?? ''}`));
  const titleEnt = moments.map((m) => entitiesOf(m.title));
  const ctxLower = moments.map((m) => String(m.texts?.context ?? '').toLowerCase());
  const tokTitle = moments.map((m) => titleTokens(m.title));
  const ids = moments.map(momentId);
  const df = new Map();
  for (const set of entTS) for (const e of set) df.set(e, (df.get(e) ?? 0) + 1);

  // Existing directed links (either direction counts as "already linked").
  const linked = new Set();
  moments.forEach((m, i) => {
    for (const rid of m.raw?.relatedIds ?? []) {
      if (typeof rid === 'string' && rid.startsWith('moment:')) linked.add(`${ids[i]}->${rid.slice('moment:'.length)}`);
    }
  });
  const alreadyLinked = (i, j) => linked.has(`${ids[i]}->${ids[j]}`) || linked.has(`${ids[j]}->${ids[i]}`);
  const eligible = (i, j) =>
    ids[i] !== ids[j] &&                                   // not the same underlying moment (dup title)
    !alreadyLinked(i, j) &&                                // link doesn't already exist
    jaccard(tokTitle[i], tokTitle[j]) < DUP_TITLE;         // not a near-duplicate (that's duplicate-content)

  const findings = [];

  // ── Path A: SUBJECT CLUSTERS ────────────────────────────────────────────
  // A distinctive subject named in ≥2 moment TITLES is the strongest cross-link
  // signal in the vault ("these pages are literally about the same thing"). But
  // three moments about "Our Song" are ONE editorial job, not three tickets —
  // so we cluster by subject and file one finding per cluster that still has an
  // un-authored link, listing every member. This is what keeps the queue a few
  // dozen actionable items instead of a combinatorial pair dump.
  const clusters = new Map(); // subject → member indices
  moments.forEach((m, i) => {
    for (const e of titleEnt[i]) {
      if (distinctiveOf(df, e)) (clusters.get(e) ?? clusters.set(e, []).get(e)).push(i);
    }
  });
  const inCluster = new Set(); // "i|j" pairs a cluster already covers
  for (const [subject, members] of clusters) {
    if (members.length < 2) continue;
    // Which within-cluster links are still missing? (some members may already link.)
    const missing = [];
    for (let a = 0; a < members.length; a++)
      for (let b = a + 1; b < members.length; b++) {
        const i = members[a], j = members[b];
        inCluster.add(`${i}|${j}`);
        if (eligible(i, j)) missing.push([i, j]);
      }
    if (!missing.length) continue; // fully cross-linked already — nothing to do

    // Members that participate in at least one missing link (the ones to weave).
    const involved = [...new Set(missing.flat())].sort((x, y) => (dateOf(moments[x].raw) ?? '').localeCompare(dateOf(moments[y].raw) ?? ''));
    const anchor = involved[0];
    const list = involved.map((i) => `“${moments[i].title}” (${moments[i].era}) [moment:${ids[i]}]`);
    const eras = new Set(involved.map((i) => moments[i].era));
    const confidence = Math.min(0.85, 0.6 + 0.05 * involved.length + (eras.size === 1 ? 0.05 : 0));
    findings.push(
      makeFinding({
        checker: id,
        severity: 'P3',
        title: `${involved.length} moments about “${subject}” don't cross-link`,
        itemRef: { type: 'moment', file: moments[anchor].file, era: moments[anchor].era, key: moments[anchor].key, field: 'relatedIds' },
        excerpt: list.slice(0, 6).join('  ⇄  '),
        evidence:
          `These ${involved.length} moments all center on “${subject}” (named in each title) but ${missing.length === 1 ? 'the pair does' : 'their pages do'} not cross-link. ` +
          `A reader on any one of them would likely want the others${eras.size === 1 ? ` — all in the ${[...eras][0]} era` : ` — they span the ${[...eras].join(', ')} eras, so the links thread the story across the vault`}. ` +
          `Moments: ${list.join('; ')}.`,
        suggestedFix:
          `If the connection helps the reader, interlink them: add the sibling ids to each moment's \`relatedIds\` ` +
          `(e.g. \`relatedIds: ['moment:${ids[involved[1]]}']\` on the first), then re-run \`npm run sync:content\`. ` +
          `Route through the content-ops pipeline (Lex confirms, the Answerer authors) — this checker only surfaces the candidate cluster, it never links automatically.`,
        confidence,
      }),
    );
  }

  // ── Path B: MULTI-SIGNAL PAIRS ──────────────────────────────────────────
  // Connections with NO shared title subject — a subject shared only in the body
  // prose, a shared narrative thread, one page discussing the other's subject —
  // that still clear the ≥2-independent-signals bar. These don't cluster, so
  // each is one pair finding. The rarer, "deep cut" discoveries.
  for (let i = 0; i < moments.length; i++) {
    for (let j = i + 1; j < moments.length; j++) {
      if (inCluster.has(`${i}|${j}`) || !eligible(i, j)) continue;
      const r = scorePair(moments[i], moments[j], { df, entA: entTS[i], entB: entTS[j], ctxA: ctxLower[i], ctxB: ctxLower[j] });
      if (!r.flag || r.titleSubject.length) continue; // title-subject pairs belong to a cluster
      // Anchor requirement: a deep pair must share a CONCRETE subject (a rare
      // named entity in the prose) or a narrative thread — not merely body-echo
      // plus same-era metadata, which is too speculative to hand a writer.
      if (!r.cats.has('subject') && !r.cats.has('thread')) continue;
      const A = moments[i], B = moments[j];
      findings.push(
        makeFinding({
          checker: id,
          severity: 'P3',
          title: 'Two moments plausibly should cross-link',
          itemRef: { type: 'moment', file: A.file, era: A.era, key: A.key, field: 'relatedIds' },
          excerpt: `“${A.title}” (${A.era}) ⇄ “${B.title}” (${B.era})`,
          evidence:
            `These two moments share several independent linking signals but neither's \`relatedIds\` points at the other: ` +
            `${r.reasons.join('; ')}. A reader on one page would likely want the other. A: ${A.file}. B: ${B.file}.`,
          suggestedFix:
            `If a link genuinely helps the reader, author it: add \`relatedIds: ['moment:${ids[j]}']\` to “${A.title}” ` +
            `and/or \`relatedIds: ['moment:${ids[i]}']\` to “${B.title}”, then re-run \`npm run sync:content\`. ` +
            `Route through the content-ops pipeline (Lex confirms the connection, the Answerer authors it) — this checker only surfaces the candidate, it never links automatically.`,
          confidence: r.confidence,
        }),
      );
    }
  }

  return findings;
}
