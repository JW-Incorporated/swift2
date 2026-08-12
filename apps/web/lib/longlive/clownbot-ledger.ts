/**
 * Clownbot — the CLOWNED / CONFIRMED ledger.
 *
 * Pulled forward from V2 on the founder's instruction: the research identified
 * this as the main reason a user would come *back* after a news event, so it is
 * the highest-value item past the V1 line and it ships here.
 *
 * It is built DETERMINISTICALLY from records that already carry citations —
 * lore items with a `ledger` block, plus the Vault's own theory corpus where a
 * theory resolved `confirmed` or `debunked`. Nothing is hand-written into a
 * separate list that could drift from the sources, and an entry with no source
 * cannot exist because both inputs require one.
 *
 * Keeping the losses in public is the product (research finding #1 and #6): the
 * loop is assemble receipts → commit publicly → be gloriously wrong →
 * self-deprecate → clown again. A ledger that only showed the wins would be
 * the overpromising failure mode the research warns about.
 *
 * DEFERRED TO V2 (seam noted in the PR): user-submitted ledger entries and
 * communal Swiftball-style prediction ballots. Both need identity and writes;
 * this version is read-only and static, and the shape below is what a writable
 * backend would have to produce.
 */

import { LORE, type LoreSource } from './clownbot-lore';
import { THEORIES_RAW } from './theories.generated';
import { getEra } from './eras';
import type { EraId } from './types';

export interface LedgerEntry {
  id: string;
  verdict: 'clowned' | 'confirmed';
  /** What the fandom committed to. */
  theory: string;
  /** How it landed. */
  outcome: string;
  /** Display string — a date where we have one, otherwise the era. */
  when: string;
  /** ISO date for sorting; null sorts last. */
  sortDate: string | null;
  sources: LoreSource[];
}

/**
 * Vault theories that resolved. `kind: 'theory'` is a fan theory — a debunked
 * one means the fandom was wrong, which is a clowning. Easter eggs are
 * excluded from the CLOWNED side: a documented planted-and-decoded egg is not
 * a fandom prediction that failed.
 */
function fromVault(): LedgerEntry[] {
  const out: LedgerEntry[] = [];
  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      const resolved =
        note.outcome === 'confirmed' ? 'confirmed' : note.outcome === 'debunked' ? 'clowned' : null;
      if (resolved === null) continue;
      if (resolved === 'clowned' && note.kind !== 'theory') continue;
      if (note.sources.length === 0) continue; // no source, no entry

      out.push({
        id: `theory:${eraId}:${note.slug}`,
        verdict: resolved,
        theory: note.claim,
        outcome:
          note.evidence ??
          (resolved === 'confirmed' ? 'Confirmed by the record.' : 'Did not survive contact with reality.'),
        when: getEra(eraId as EraId).shortName,
        sortDate: null,
        sources: note.sources.map((s) => ({ name: s.name, url: s.url })),
      });
    }
  }
  return out;
}

function fromLore(): LedgerEntry[] {
  return LORE.filter((item) => item.ledger).map((item) => ({
    id: `lore:${item.id}`,
    verdict: item.ledger!.verdict,
    theory: item.ledger!.theory,
    outcome: item.detail,
    when: item.ledger!.on,
    sortDate: item.ledger!.on,
    sources: [...item.sources],
  }));
}

let cache: LedgerEntry[] | null = null;

/** Dated entries first (newest first), then undated vault entries by title. */
export function ledger(): LedgerEntry[] {
  if (cache !== null) return cache;
  const entries = [...fromLore(), ...fromVault()];
  entries.sort((a, b) => {
    if (a.sortDate && b.sortDate) return b.sortDate.localeCompare(a.sortDate);
    if (a.sortDate) return -1;
    if (b.sortDate) return 1;
    return a.theory.localeCompare(b.theory);
  });
  cache = entries;
  return cache;
}

/** Test seam. */
export function resetLedgerCache(): void {
  cache = null;
}

export interface LedgerTally {
  clowned: number;
  confirmed: number;
}

export function ledgerTally(): LedgerTally {
  const entries = ledger();
  return {
    clowned: entries.filter((e) => e.verdict === 'clowned').length,
    confirmed: entries.filter((e) => e.verdict === 'confirmed').length,
  };
}

/**
 * The self-deprecating stat, derived rather than written — so the bit stays
 * true as the ledger grows. This is the running gag with a number behind it.
 */
export function wigCountLine(): string {
  const { clowned, confirmed } = ledgerTally();
  return `${confirmed} called, ${clowned} clowned. I keep both columns.`;
}

/** The most recent N entries, for the surface's ledger panel. */
export function recentLedger(limit = 6): LedgerEntry[] {
  return ledger().slice(0, limit);
}
