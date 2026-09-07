// Answerer desk — relevance scorer + draft-selection caps (Phase 1 card P1-4,
// docs/proposals/2026-09-06-community-engine-plan.md §2.5). Pure, zero-I/O
// logic only: the caller (the Community Answerer runner) does the actual
// `knowledge_doc` search (`@swift2/shared`'s `searchKnowledgeDocs`, FTS-only
// via `tsv`) and the `screenTopic()` redline check, then feeds the results
// here to turn "candidate docs" into a 0-1 relevance score, a link/no-link/
// contribution-only tier, and a bounded, priority-ordered daily draft batch.
//
// Design note: `knowledge_doc.search()` (packages/core/src/knowledge/client.ts)
// already does the FTS *rank* ordering server-side (`plainto_tsquery` +
// `.order('updated_at', ...)` — Postgres's own `tsv @@ query` match, not a
// second full-text engine reimplemented here). This module does NOT
// reimplement text search; `rankedDocs` below is that ordering, taken as
// ground truth. What this module adds is the plan's own formula — "best-
// matching doc's rank × specificity" (§2.5 step 3) — where *specificity* is
// how much of the doc's real vocabulary (title/text/symbols) the lead's own
// text actually mentions, not just whether Postgres matched a stray token.
// A doc a lead barely brushes against (rank 1, but only one common stopword-
// adjacent word) must not score as confidently as one it clearly overlaps.

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'have',
  'has',
  'was',
  'were',
  'are',
  'you',
  'your',
  'she',
  'her',
  'his',
  'him',
  'they',
  'them',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'how',
  'about',
  'into',
  'just',
  'like',
  'been',
  'being',
  'will',
  'would',
  'could',
  'should',
  'there',
  'their',
  'than',
  'then',
  'also',
  'some',
  'more',
  'most',
  'over',
  'does',
  'did',
  'not',
  'but',
  'can',
  'all',
  'any',
  'out',
  'get',
  'got',
  'one',
  'two',
  'now',
  'reddit',
  'post',
  'thread',
  'comment',
  'comments',
]);

/** Lowercases, strips punctuation, drops stopwords + short tokens, dedupes. */
function tokenize(text) {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Rank weight by candidate position (0 = the DB's best match). Decays in
 * fixed steps rather than 1/(1+i) so the top few candidates — the ones a
 * real FTS rank actually distinguishes with confidence — stay close
 * together, while anything past the 5th candidate is treated as a weak
 * grasp-at-straws match regardless of specificity (floor 0.1, never 0 so a
 * genuinely perfect specificity match at a low rank can still clear the
 * 0.45 contribution-only floor rather than being hard-zeroed).
 */
export function rankWeight(position) {
  const weights = [1, 0.85, 0.7, 0.55, 0.4, 0.25];
  return weights[position] ?? 0.1;
}

/**
 * 0-1: how much of the LEAD's own vocabulary the doc's title+text actually
 * covers (word-overlap over the lead's token set, not the doc's — a long
 * doc that happens to contain a few of the lead's words should not
 * out-score a short doc that IS what the lead is about). A `symbols`
 * overlap (structured, higher-confidence than raw text) adds a bounded
 * bonus on top, capped at 1.
 */
export function specificity(lead, doc) {
  const leadTokens = tokenize(`${lead.title ?? ''} ${lead.context ?? ''}`);
  if (leadTokens.size === 0) return 0;
  const docTokens = tokenize(`${doc.title ?? ''} ${doc.text ?? ''}`);
  let overlap = 0;
  for (const t of leadTokens) if (docTokens.has(t)) overlap += 1;
  const textScore = overlap / leadTokens.size;

  const leadSymbols = new Set((lead.symbols ?? []).map((s) => s.toLowerCase()));
  const docSymbols = new Set((doc.symbols ?? []).map((s) => s.toLowerCase()));
  let symbolBonus = 0;
  if (leadSymbols.size > 0 && docSymbols.size > 0) {
    let symbolOverlap = 0;
    for (const s of leadSymbols) if (docSymbols.has(s)) symbolOverlap += 1;
    if (symbolOverlap > 0) symbolBonus = 0.2 * Math.min(1, symbolOverlap / leadSymbols.size);
  }
  return Math.min(1, textScore + symbolBonus);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * The plan's §2.5 step 3 formula: "Score 0-1 = best-matching doc's rank ×
 * specificity." `rankedDocs` must already be in the caller's FTS rank order
 * (best match first) — this never re-sorts them.
 *
 * Returns `{ score, matchedDocIds, bestDocId }`. `matchedDocIds` is every
 * candidate with non-zero specificity (for `engagement_lead.matched_doc_ids`
 * — the audit trail of what was considered, not just the winner).
 */
export function scoreLead(lead, rankedDocs) {
  if (!rankedDocs || rankedDocs.length === 0) {
    return { score: 0, matchedDocIds: [], bestDocId: null };
  }
  let best = { score: 0, docId: null };
  const matchedDocIds = [];
  rankedDocs.forEach((doc, position) => {
    const spec = specificity(lead, doc);
    if (spec > 0) matchedDocIds.push(doc.id);
    const combined = round2(rankWeight(position) * spec);
    if (combined > best.score) best = { score: combined, docId: doc.id };
  });
  return { score: best.score, matchedDocIds, bestDocId: best.docId };
}

/** The plan's §2.5 step 3 thresholds, as named tiers. */
export const RELEVANCE_TIERS = {
  WITH_LINK: 'with_link',
  WITHOUT_LINK: 'without_link',
  LOW_RELEVANCE: 'low_relevance',
};

export function classifyRelevance(score) {
  if (score >= 0.75) return RELEVANCE_TIERS.WITH_LINK;
  if (score >= 0.45) return RELEVANCE_TIERS.WITHOUT_LINK;
  return RELEVANCE_TIERS.LOW_RELEVANCE;
}

/**
 * §6.5 etiquette gate: `link_included` can only be true when the classifier
 * says `with_link` AND `redditNonPromo >= 20` AND the watchlist row says
 * `allowsLinks === true` for that community. Any missing/false input fails
 * closed (Facebook always fails this — `allowsLinks` is `false` for every
 * seeded FB group per docs/community/watchlist.md, matching the plan's own
 * "never a shop/site link into a Facebook reply" posture, and a `null`
 * `allowsLinks` — meaning P0-2 verification never ran for that community —
 * must fail closed the same way, not default to permissive).
 */
export function linkAllowed({ tier, redditNonPromo, allowsLinks }) {
  return tier === RELEVANCE_TIERS.WITH_LINK && (redditNonPromo ?? 0) >= 20 && allowsLinks === true;
}

// ---------------------------------------------------------------------------
// Draft-batch selection — plan §2.5 step 7's caps.

export const DAILY_DRAFT_CAP = 12;
export const PER_COMMUNITY_DRAFT_CAP = 3;

/**
 * Selects which leads get a draft this run, respecting:
 *   - `dailyCap` leads total (default 12)
 *   - `perCommunityCap` leads per community (default 3)
 *   - `kind: 'reply_to_us'` leads are ALWAYS included and never count against
 *     `perCommunityCap` (plan: "replies-to-us always included") — they still
 *     count against `dailyCap`, since that cap is a hard "~15 minutes of
 *     pasting" ceiling on Joey's actual workload, not a per-kind budget.
 *   - Every other lead is ranked by `relevance` (desc) before the per-
 *     community cap is applied, so the best-scored leads in an over-quota
 *     community win the 3 slots, not just whichever came first in the input
 *     order.
 *   - Leads with `status !== 'new'` (already drafted/skipped/etc.) are never
 *     selected — this function only decides what's NEW to this run.
 *
 * Pure and order-stable: does not mutate `leads`, returns a fresh array.
 */
export function selectDraftBatch(
  leads,
  { dailyCap = DAILY_DRAFT_CAP, perCommunityCap = PER_COMMUNITY_DRAFT_CAP } = {},
) {
  const eligible = (leads ?? []).filter((l) => l.status === 'new');
  const replies = eligible.filter((l) => l.kind === 'reply_to_us');
  const rest = eligible
    .filter((l) => l.kind !== 'reply_to_us')
    .slice()
    .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

  const selected = [];
  // Per-community counter tracks only non-reply leads: reply_to_us is
  // "exempt from the per-community cap" (charter/docstring) and must not
  // consume the 3-slot quota that hot_thread/digest/alert leads in the same
  // community are budgeted against. Counting replies here previously let a
  // community's real 3-slot allowance silently shrink to 2 whenever a
  // reply_to_us lead also came from that community.
  const perCommunityCount = new Map();

  for (const lead of replies) {
    if (selected.length >= dailyCap) break;
    selected.push(lead);
  }

  for (const lead of rest) {
    if (selected.length >= dailyCap) break;
    const used = perCommunityCount.get(lead.community) ?? 0;
    if (used >= perCommunityCap) continue;
    selected.push(lead);
    perCommunityCount.set(lead.community, used + 1);
  }

  return selected;
}

// ---------------------------------------------------------------------------
// Home-relay budget — plan §6.4: "bounded per run (Answerer <=5 ... threads),
// probe-before-use, never retried in-run on 403/429, logged in run summary."
// A tiny counter, not a fetcher — the runner calls `tryUse()` before each
// relay call it's considering and only proceeds on `true`.

export const HOME_RELAY_ANSWERER_CAP = 5;

export function createRelayBudget(cap = HOME_RELAY_ANSWERER_CAP) {
  let used = 0;
  return {
    tryUse() {
      if (used >= cap) return false;
      used += 1;
      return true;
    },
    get used() {
      return used;
    },
    get remaining() {
      return Math.max(0, cap - used);
    },
  };
}
