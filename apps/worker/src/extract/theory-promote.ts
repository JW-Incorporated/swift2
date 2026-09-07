// Merge + promote pass (Community Engine plan §3.3, Phase 2 card P2-3).
// Sibling of ./theory-match.ts / ./write-theory-candidate.ts. Runs weekly
// (scripts/community/theory-promote.mjs), reads `fan_theory_candidate`
// rows still in `status='candidate'`, merges near-duplicates using the
// SAME deterministic "name similarity + symbol overlap >= 0.5" rule
// already established by theory-match.ts for the live-news extract
// pipeline (isTheoryMatch/findTheoryMatch) — not a new LLM merge call.
//
// SCOPE DECISION (documented, not silent): the plan's §4 workflow table
// describes this as a "weekly Opus merge pass". This repo has zero
// existing precedent for a second LLM in the merge/promote path — every
// other deterministic-vs-LLM boundary here puts the LLM only at
// extraction (Haiku) and keeps every dedupe/merge/promote decision
// deterministic (theory-match.ts, upsertLiveTheory in write-knowledge.ts,
// upsertTheoryCandidate in write-theory-candidate.ts). Reusing that same
// deterministic rule keeps the merge step auditable, unit-testable
// without network/API-key dependence, and free — consistent with the
// plan's own §4 cost table ("Miner ≈ 40 Haiku calls/day + 1 Opus
// merge/week... No new paid service. Nothing crosses the $100 line" is
// satisfied more conservatively this way). If a founder/Fable review
// wants a genuine LLM judgment pass added on top of this deterministic
// merge, that is a follow-up card, not a change to this file's contract.
//
// Promotion bar (this card's own call, no existing precedent to mirror):
// a merged cluster promotes to `live_theory` once its combined
// `mention_count >= PROMOTION_MENTION_THRESHOLD` AND its stance is not
// `debunked_by_fans` — a theory the fandom itself has already debunked
// is deliberately never promoted into the site's live theory board,
// however many times it was mentioned before being debunked. A
// debunked cluster that clears the mention threshold is marked
// `rejected` (terminal) rather than left `candidate` forever, since a
// future re-mention would only be re-litigating an already-decided
// question.

import type { FanTheoryStance } from '@swift2/shared/community';
import { findTheoryMatch, isTheoryMatch } from './theory-match';

export const PROMOTION_MENTION_THRESHOLD = 3;
const MAX_SAMPLE_URLS = 3;

export interface FanTheoryCandidateRow {
  id: string;
  claim: string;
  theoryKey: string;
  name: string;
  mechanism: string | null;
  symbols: string[];
  trackSlug: string | null;
  predicts: string | null;
  predictedDate: string | null;
  evidenceSummary: string | null;
  mentionCount: number;
  peakScore: number;
  communities: string[];
  stance: FanTheoryStance;
  sampleUrls: string[];
}

export interface MergedTheoryCluster {
  /** The canonical row's id — the one that survives as `status='accepted'`/`rejected`. */
  canonicalId: string;
  /** Every other row in the cluster — marked `status='merged'`, never deleted. */
  mergedIds: string[];
  name: string;
  claim: string;
  mechanism: string | null;
  symbols: string[];
  trackSlug: string | null;
  evidenceSummary: string | null;
  mentionCount: number;
  peakScore: number;
  communities: string[];
  sampleUrls: string[];
  stance: FanTheoryStance;
  decision: 'promote' | 'reject' | 'hold';
}

/** Canonical row's `trackSlug` wins; if it has none, the first mergedin row
 * that does supplies it — a merge should never drop a song association a
 * sibling candidate already had (P2-6 depends on this surviving promotion:
 * `live_theory.track_slug` is the only way the song-weaving intake script
 * finds a promoted theory's song). Must be called with the CANONICAL row
 * first and its siblings after (i.e. `sortedGroup`, not the raw
 * discovery-order `group`) — a raw-order scan would return whichever row
 * happened to be discovered first, not the row that actually survives as
 * `status='accepted'`/`rejected`. */
function clusterTrackSlug(orderedRows: readonly FanTheoryCandidateRow[]): string | null {
  for (const r of orderedRows) if (r.trackSlug) return r.trackSlug;
  return null;
}

/** Majority stance across a cluster; ties break toward `contested` (the
 * honest "the fandom disagrees" reading of a tie) rather than arbitrarily
 * picking a side. */
function clusterStance(rows: readonly FanTheoryCandidateRow[]): FanTheoryStance {
  const counts: Record<FanTheoryStance, number> = {
    believed: 0,
    contested: 0,
    debunked_by_fans: 0,
  };
  for (const r of rows) counts[r.stance] = (counts[r.stance] ?? 0) + 1;
  const max = Math.max(counts.believed ?? 0, counts.contested ?? 0, counts.debunked_by_fans ?? 0);
  const leaders = (Object.keys(counts) as FanTheoryStance[]).filter(
    (k) => (counts[k] ?? 0) === max,
  );
  return leaders.length === 1 ? (leaders[0] ?? 'contested') : 'contested';
}

function unionCapped(lists: readonly string[][], cap: number): string[] {
  const set: string[] = [];
  for (const list of lists) {
    for (const v of list) {
      if (!set.includes(v)) set.push(v);
      if (set.length >= cap) return set;
    }
  }
  return set;
}

function union(lists: readonly string[][]): string[] {
  const set = new Set<string>();
  for (const list of lists) for (const v of list) set.add(v);
  return [...set];
}

/** Groups candidate rows into near-duplicate clusters via theory-match.ts's
 * existing threshold, picks the highest-mention_count row in each cluster
 * as canonical (ties broken by highest peak_score, then by id for
 * determinism), and decides promote/reject/hold. Pure — no I/O, so this is
 * unit-testable without a DB, same discipline as theory-match.ts. */
export function mergeTheoryCandidates(
  rows: readonly FanTheoryCandidateRow[],
): MergedTheoryCluster[] {
  const remaining = [...rows];
  const clusters: MergedTheoryCluster[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift();
    if (!seed) break;
    const group: FanTheoryCandidateRow[] = [seed];

    // Repeat full sweeps of `remaining` until a pass adds nothing new —
    // a single left-to-right pass is order-dependent (a candidate that
    // only transitively matches the seed via ANOTHER candidate added
    // later in the same pass would otherwise never get a second look and
    // would wrongly seed its own separate cluster). Iterating to a fixed
    // point makes clustering order-independent, i.e. a genuine
    // transitive closure under isTheoryMatch.
    let addedInPass = true;
    while (addedInPass) {
      addedInPass = false;
      for (let i = remaining.length - 1; i >= 0; i--) {
        const candidate = remaining[i];
        if (!candidate) continue;
        const matchesAny = group.some((g) =>
          isTheoryMatch(
            { name: candidate.name, symbols: candidate.symbols },
            { name: g.name, symbols: g.symbols },
          ),
        );
        if (matchesAny) {
          group.push(candidate);
          remaining.splice(i, 1);
          addedInPass = true;
        }
      }
    }

    const sortedGroup = [...group].sort((a, b) => {
      if (b.mentionCount !== a.mentionCount) return b.mentionCount - a.mentionCount;
      if (b.peakScore !== a.peakScore) return b.peakScore - a.peakScore;
      return a.id.localeCompare(b.id);
    });
    const canonical = sortedGroup[0];
    if (!canonical) continue; // group is never empty (seeded above), but satisfies noUncheckedIndexedAccess

    const mentionCount = group.reduce((sum, r) => sum + r.mentionCount, 0);
    const peakScore = Math.max(...group.map((r) => r.peakScore));
    const stance = clusterStance(group);
    const trackSlug = clusterTrackSlug(sortedGroup);
    const decision: MergedTheoryCluster['decision'] =
      mentionCount < PROMOTION_MENTION_THRESHOLD
        ? 'hold'
        : stance === 'debunked_by_fans'
          ? 'reject'
          : 'promote';

    clusters.push({
      canonicalId: canonical.id,
      mergedIds: group.filter((r) => r.id !== canonical.id).map((r) => r.id),
      name: canonical.name,
      claim: canonical.claim,
      mechanism: canonical.mechanism,
      symbols: union(group.map((r) => r.symbols)),
      trackSlug,
      evidenceSummary: canonical.evidenceSummary,
      mentionCount,
      peakScore,
      communities: union(group.map((r) => r.communities)),
      sampleUrls: unionCapped(
        group.map((r) => r.sampleUrls),
        MAX_SAMPLE_URLS,
      ),
      stance,
      decision,
    });
  }

  return clusters;
}

export interface ExistingLiveTheoryRow {
  id: string;
  name: string;
  symbols: string[];
  heat: number;
  mentionCount: number | null;
  communities: string[];
}

export interface PromotedLiveTheoryUpsert {
  existingId?: string;
  row: {
    name: string;
    claim: string;
    origin: 'fan';
    status: 'rumor' | 'debunked';
    outcome: 'pending';
    symbols: string[];
    heat: number;
    persistent: true;
    mention_count: number;
    communities: string[];
    // Community Engine P2-4: the promoted cluster's fan-side confidence
    // (§3.3's `fan_theory_candidate.stance`) rides straight onto the
    // `live_theory` row so the Clue Web / eggs board can render a stance
    // chip without a second lookup — same "carry the corpus columns
    // through, don't re-derive them" convention as mention_count/communities.
    stance: FanTheoryStance;
    redline_ok: true;
    track_slug: string | null;
  };
}

/** Builds the live_theory upsert payload for a cluster decided `promote`.
 * Bumps an existing fan-origin live_theory row when theory-match.ts finds
 * one (mirrors write-knowledge.ts's upsertLiveTheory bump-vs-insert shape),
 * else inserts fresh. Pure — the caller performs the actual DB write. */
export function buildLiveTheoryUpsert(
  cluster: MergedTheoryCluster,
  existingLiveTheories: readonly ExistingLiveTheoryRow[],
): PromotedLiveTheoryUpsert {
  const match = findTheoryMatch(
    { name: cluster.name, symbols: cluster.symbols },
    existingLiveTheories,
  );
  const row = {
    name: cluster.name,
    claim: cluster.claim,
    origin: 'fan' as const,
    status: cluster.stance === 'debunked_by_fans' ? ('debunked' as const) : ('rumor' as const),
    outcome: 'pending' as const,
    symbols: cluster.symbols,
    heat: cluster.mentionCount,
    persistent: true as const,
    mention_count: match ? (match.mentionCount ?? 0) + cluster.mentionCount : cluster.mentionCount,
    communities: match ? union([match.communities, cluster.communities]) : cluster.communities,
    stance: cluster.stance,
    redline_ok: true as const,
    track_slug: cluster.trackSlug,
  };
  return match ? { existingId: match.id, row } : { row };
}
