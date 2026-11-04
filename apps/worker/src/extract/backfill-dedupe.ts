// Cross-row same-event grouping for force backfill. Reuses the live dedupe
// gate's shortlist scorers and its same-event LLM check (dates in the prompt);
// each row is compared only against rows observed within +-3 days. Within a
// group the passing row with the highest writing score survives (ties: more
// facts, then earlier observed_on); a group with no passing row keeps none.

import { checkSameEvent } from './dedupe-gate-llm';
import { buildShortlist, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION } from './dedupe-shortlist';
import type { ExtractUsageStore } from './usage-store';

export const DEDUPE_WINDOW_DAYS = 3;
const DAY_MS = 86_400_000;

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
}

function withinWindow(a: string, b: string): boolean {
  return Math.abs(Date.parse(a) - Date.parse(b)) <= DEDUPE_WINDOW_DAYS * DAY_MS;
}

function betterKeeper(a: DedupeEntry, b: DedupeEntry): boolean {
  if (a.writingScore !== b.writingScore) return (a.writingScore as number) > (b.writingScore as number);
  if (a.facts.length !== b.facts.length) return a.facts.length > b.facts.length;
  return a.observedOn < b.observedOn;
}

export async function findDuplicateGroups(
  usage: ExtractUsageStore,
  entries: readonly DedupeEntry[],
  errors: string[],
  sameEvent: typeof checkSameEvent = checkSameEvent,
): Promise<DuplicateGroup[]> {
  const parent = new Map<string, string>(entries.map((e) => [e.id, e.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    return root;
  };
  for (const entry of entries) {
    const rivals = entries.filter((o) => o.id !== entry.id && find(o.id) !== find(entry.id) && withinWindow(entry.observedOn, o.observedOn));
    const shortlist = buildShortlist(entry, rivals, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION);
    if (shortlist.length === 0) continue;
    try {
      const verdict = await sameEvent(
        usage,
        { headline: entry.headline, summary: entry.summary, detail: entry.detail, facts: entry.facts, observedOn: entry.observedOn },
        shortlist.map((o) => ({ id: o.id, headline: o.headline, summary: o.summary, detail: o.detail, observedOn: o.observedOn, facts: o.facts })),
      );
      if (verdict === null) errors.push(`duplicate check deferred for ${entry.id} (no budget or key); its duplicates, if any, stay visible`);
      else if (verdict.sameEvent && verdict.matchId) parent.set(find(verdict.matchId), find(entry.id));
    } catch (err) {
      errors.push(`duplicate check failed for ${entry.id}: ${(err as Error).message}`);
    }
  }
  const byRoot = new Map<string, DedupeEntry[]>();
  for (const entry of entries) {
    const root = find(entry.id);
    byRoot.set(root, [...(byRoot.get(root) ?? []), entry]);
  }
  return [...byRoot.values()].filter((g) => g.length > 1).map((group) => {
    const keeper = group.filter((e) => e.writingScore !== null).reduce<DedupeEntry | null>(
      (best, e) => (best === null || betterKeeper(e, best) ? e : best), null,
    );
    return { keep: keeper?.id ?? null, members: group.map((e) => e.id) };
  });
}
