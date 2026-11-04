// Cross-row same-event grouping for force backfill. Reuses the live dedupe
// gate's shortlist scorers and its same-event LLM check (dates in the prompt).
// Rows are visited best-first (passing by writing score, then facts, then
// earlier observed_on; non-passing last). The first unassigned row anchors a
// group; a rival joins only when it shares a (non-universal) entity or a fact
// claim with the anchor, the gate judged it the same event as the anchor, and
// its observed_on is within +-3 days of EVERY member (no transitive chains).
// A group survives only through a passing anchor; with none, keep is null.

import { checkSameEvent } from './dedupe-gate-llm';
import { buildShortlist, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION, normalizeEntity, sharesFact } from './dedupe-shortlist';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadExistingV2Rows, type ExistingV2Row, type ForceCandidateRow } from './backfill-force-load';
import type { RowResult } from './backfill-force-write';
import { ExtractUsageStore } from './usage-store';

export const DEDUPE_WINDOW_DAYS = 3;
export const DEDUPE_MAX_CHECKS = 200;
export const DEDUPE_INCOMPLETE_RATIO = 0.1;
const MAX_ROUNDS_PER_ANCHOR = 4;
const DAY_MS = 86_400_000;
const EXCLUDED_ENTITIES: ReadonlySet<string> = new Set(['taylor swift', 'taylor', 'swift', 'travis kelce', 'travis', 'kelce']);

export interface DedupeEntry {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  observedOn: string;
  entities: readonly string[];
  facts: readonly { claim: string }[];
  /** Set only for a row whose rewrite passed every gate. */
  writingScore: number | null;
}

export interface DuplicateGroup {
  keep: string | null;
  members: string[];
  /** Days between the earliest and latest observed_on in the group. */
  spanDays: number;
}

export interface DedupeResult {
  groups: DuplicateGroup[];
  checks: number;
  failed: number;
}

/** In-memory per-run budget for the dedupe checks, separate from every shared store: 2 x eligible rows, max 200. */
export function createDedupeUsage(eligible: number): Promise<ExtractUsageStore> {
  const cap = Math.min(DEDUPE_MAX_CHECKS, 2 * eligible);
  return ExtractUsageStore.create({ todaysCallCount: async () => 0, incrementToday: async () => undefined }, cap, cap);
}

export function dedupeEntry(row: ForceCandidateRow, res: RowResult): DedupeEntry {
  return {
    id: row.id,
    headline: row.headline,
    summary: res.report.newLead ?? row.summary,
    detail: res.report.newBody ?? row.detail,
    observedOn: row.observed_on,
    entities: row.entities ?? [],
    facts: res.report.facts,
    writingScore: res.write ? res.write.writingScore : null,
  };
}

function withinWindow(a: string, b: string): boolean {
  return Math.abs(Date.parse(a) - Date.parse(b)) <= DEDUPE_WINDOW_DAYS * DAY_MS;
}

function sharesSubject(a: DedupeEntry, b: DedupeEntry): boolean {
  const own = (e: DedupeEntry) => new Set(e.entities.map(normalizeEntity).filter((x) => x && !EXCLUDED_ENTITIES.has(x)));
  const left = own(a);
  for (const entity of own(b)) if (left.has(entity)) return true;
  return sharesFact(a.facts, b.facts);
}

function bestFirst(a: DedupeEntry, b: DedupeEntry): number {
  if ((a.writingScore === null) !== (b.writingScore === null)) return a.writingScore === null ? 1 : -1;
  if (a.writingScore !== null && b.writingScore !== null && a.writingScore !== b.writingScore) return b.writingScore - a.writingScore;
  if (a.facts.length !== b.facts.length) return b.facts.length - a.facts.length;
  return a.observedOn < b.observedOn ? -1 : a.observedOn > b.observedOn ? 1 : 0;
}

export async function findDuplicateGroups(
  usage: ExtractUsageStore,
  entries: readonly DedupeEntry[],
  errors: string[],
  sameEvent: typeof checkSameEvent = checkSameEvent,
): Promise<DedupeResult> {
  const ordered = [...entries].sort(bestFirst);
  const assigned = new Set<string>();
  const groups: DuplicateGroup[] = [];
  let checks = 0;
  let failed = 0;
  for (const anchor of ordered) {
    if (assigned.has(anchor.id)) continue;
    assigned.add(anchor.id);
    const members = [anchor];
    let rivals = ordered.filter((o) => !assigned.has(o.id) && withinWindow(anchor.observedOn, o.observedOn) && sharesSubject(anchor, o));
    for (let round = 0; round < MAX_ROUNDS_PER_ANCHOR && rivals.length > 0; round++) {
      const shortlist = buildShortlist(anchor, rivals, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION);
      checks++;
      let verdict: Awaited<ReturnType<typeof checkSameEvent>>;
      try {
        verdict = await sameEvent(
          usage,
          { headline: anchor.headline, summary: anchor.summary, detail: anchor.detail, facts: anchor.facts, observedOn: anchor.observedOn },
          shortlist.map((o) => ({ id: o.id, headline: o.headline, summary: o.summary, detail: o.detail, observedOn: o.observedOn, facts: o.facts })),
        );
      } catch (err) {
        errors.push(`duplicate check failed for ${anchor.id}: ${(err as Error).message}`);
        failed++;
        break;
      }
      if (verdict === null) {
        errors.push(`duplicate check deferred for ${anchor.id} (no budget or key)`);
        failed++;
        break;
      }
      if (!verdict.sameEvent || !verdict.matchId) break;
      const match = rivals.find((r) => r.id === verdict.matchId);
      rivals = rivals.filter((r) => r.id !== verdict.matchId);
      if (match && members.every((m) => withinWindow(m.observedOn, match.observedOn))) {
        members.push(match);
        assigned.add(match.id);
      }
    }
    if (members.length < 2) continue;
    const times = members.map((m) => Date.parse(m.observedOn));
    groups.push({
      keep: anchor.writingScore !== null ? anchor.id : null,
      members: members.map((m) => m.id),
      spanDays: Math.round((Math.max(...times) - Math.min(...times)) / DAY_MS),
    });
  }
  return { groups, checks, failed };
}

export function existingEntry(row: ExistingV2Row): DedupeEntry {
  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    detail: row.detail,
    observedOn: row.observed_on,
    entities: row.entities ?? [],
    facts: row.facts,
    writingScore: row.writing_score ?? 1,
  };
}

/**
 * Cross-batch dedupe: each candidate is compared with the visible rows that already carry v2 facts
 * (an earlier batch), within 3 days and sharing a non-universal entity or fact claim. A candidate the
 * gate matches to one of them is a duplicate of it; the existing row is never displaced.
 */
export async function matchExistingV2(
  usage: ExtractUsageStore,
  candidates: readonly DedupeEntry[],
  existing: readonly DedupeEntry[],
  errors: string[],
  sameEvent: typeof checkSameEvent = checkSameEvent,
): Promise<{ matches: Map<string, string>; checks: number; failed: number }> {
  const matches = new Map<string, string>();
  let checks = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const rivals = existing.filter((o) => o.id !== candidate.id && withinWindow(candidate.observedOn, o.observedOn) && sharesSubject(candidate, o));
    if (rivals.length === 0) continue;
    const shortlist = buildShortlist(candidate, rivals, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION);
    checks++;
    try {
      const verdict = await sameEvent(
        usage,
        { headline: candidate.headline, summary: candidate.summary, detail: candidate.detail, facts: candidate.facts, observedOn: candidate.observedOn },
        shortlist.map((o) => ({ id: o.id, headline: o.headline, summary: o.summary, detail: o.detail, observedOn: o.observedOn, facts: o.facts })),
      );
      if (verdict === null) {
        errors.push(`existing-row duplicate check deferred for ${candidate.id} (no budget or key)`);
        failed++;
      } else if (verdict.sameEvent && verdict.matchId) matches.set(candidate.id, verdict.matchId);
    } catch (err) {
      errors.push(`existing-row duplicate check failed for ${candidate.id}: ${(err as Error).message}`);
      failed++;
    }
  }
  return { matches, checks, failed };
}

export interface DuplicatePlan {
  groups: DuplicateGroup[];
  /** duplicate id -> the row that survives (a group anchor, or an existing v2 row from an earlier batch). */
  losers: Map<string, string>;
  checks: number;
  failed: number;
  incomplete: boolean;
}

export async function planDuplicates(
  db: SupabaseClient,
  usage: ExtractUsageStore,
  candidates: readonly ForceCandidateRow[],
  entries: readonly DedupeEntry[],
  errors: string[],
  sameEvent?: typeof checkSameEvent,
): Promise<DuplicatePlan> {
  let existing: DedupeEntry[] = [];
  let loadFailed = false;
  try {
    existing = (await loadExistingV2Rows(db, candidates)).map(existingEntry);
  } catch (err) {
    errors.push((err as Error).message);
    loadFailed = true;
  }
  const cross = await matchExistingV2(usage, entries, existing, errors, sameEvent);
  const rest = entries.filter((e) => !cross.matches.has(e.id));
  const intra = await findDuplicateGroups(usage, rest, errors, sameEvent);
  const checks = cross.checks + intra.checks + (loadFailed ? 1 : 0);
  const failed = cross.failed + intra.failed + (loadFailed ? 1 : 0);
  const incomplete = checks > 0 && failed / checks > DEDUPE_INCOMPLETE_RATIO;
  const losers = new Map<string, string>();
  if (!incomplete) {
    for (const [id, keep] of cross.matches) losers.set(id, keep);
    for (const group of intra.groups) {
      if (group.keep) for (const id of group.members) if (id !== group.keep) losers.set(id, group.keep);
    }
  }
  return { groups: intra.groups, losers, checks, failed, incomplete };
}
