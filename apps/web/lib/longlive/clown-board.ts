/**
 * Clownbot — the two prefill columns.
 * Both columns. Pure and deterministic: same corpus in => same board out.
 * ZERO model calls — this is what keeps the columns free (J2).
 *
 * Column 1 is derived from `theories.generated.ts` (unresolved theories, i.e.
 * `kind === 'theory' && outcome === 'pending'`) plus `clownbot-lore.ts` rumors
 * still open (`status === 'rumor' | 'reported'`). Column 2 ports the
 * confirmed side of `clownbot-ledger.ts`'s CLOWNED/CONFIRMED derivation:
 * vault entries with `outcome === 'confirmed'`, plus lore items whose
 * `ledger.verdict === 'confirmed'`. Debunked/clowned verdicts never appear in
 * either column.
 *
 * `TheoryNote` (theories.generated.ts) carries no per-item date. The era's
 * `end` boundary is the best real signal the corpus offers for a sort key —
 * it is never invented, only read off the era record — and column 1 clamps
 * it to `now` so a still-open era never sorts as though it happened in the
 * future.
 */

import { LORE } from './clownbot-lore';
import { THEORIES_RAW } from './theories.generated';
import { getEra } from './eras';

export type BoardItem = {
  id: string;
  /** Column 1 headline, or column 2 egg name. */
  title: string;
  /** One line of context. Never a claim of fact for an unresolved item. */
  blurb: string;
  /** What tapping it puts in the composer. Authored, not generated. */
  prompt: string;
  /** Sort key. ISO date. */
  date: string;
};

const MAX_CURRENT_THEORIES = 10;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Trim editorial prose to a single line of context. Never a model call. */
function firstLine(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return `${(lastStop > 80 ? cut.slice(0, lastStop) : cut).trimEnd()}…`;
}

/** A plain question built from a title — never model-generated. */
function naturalPrompt(title: string): string {
  return `Make the case: what's actually going on with ${title}?`;
}

/** Vault theory notes have no per-item date; clamp the era's `end` to `now`. */
function vaultTheoryDate(eraId: string, now: Date): string {
  const end = getEra(eraId).end;
  const today = isoDate(now);
  return end < today ? end : today;
}

function byDateDesc(a: BoardItem, b: BoardItem): number {
  return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
}

/**
 * Column 1 — "top 10 current theories".
 * Unresolved theories + open rumors, recency-ranked, capped at 10.
 *
 * J2: derived from the corpus we already have. If the corpus yields fewer
 * than 10, RETURN FEWER. Do not pad, do not invent, do not reach further
 * back in time to fill the slot — a padded "current" list is a lie about
 * what is current. The UI handles a short list (§ Step 8).
 */
export function currentTheories(now: Date): BoardItem[] {
  const items: BoardItem[] = [];

  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      if (note.kind !== 'theory' || note.outcome !== 'pending') continue;
      items.push({
        id: `theory:${eraId}:${note.slug}`,
        title: note.title,
        blurb: firstLine(note.claim),
        prompt: naturalPrompt(note.title),
        date: vaultTheoryDate(eraId, now),
      });
    }
  }

  for (const item of LORE) {
    if (item.status !== 'rumor' && item.status !== 'reported') continue;
    items.push({
      id: `lore:${item.id}`,
      title: item.headline,
      blurb: firstLine(item.detail),
      prompt: item.prompts?.[0] ?? naturalPrompt(item.headline),
      date: item.date,
    });
  }

  items.sort(byDateDesc);
  return items.slice(0, MAX_CURRENT_THEORIES);
}

export interface ConfirmedEggsOptions {
  /**
   * True: only entries whose `kind` is a planted-and-decoded easter egg
   * (`kind === 'easter_egg'`). A confirmed *theory* (a fan prediction that
   * landed) is excluded, and so are lore-ledger confirmations — every
   * ledger entry records a fan-theory verdict by construction (see
   * `clownbot-ledger.ts`'s own framing), never a decoded egg, so `LoreItem`
   * carries no `kind` to test here. Default `false`: every confirmed entry,
   * matching build A's ledger unchanged.
   */
  eggsOnly?: boolean;
  /** Cap the number of items returned, newest first. Omitted = unlimited. */
  limit?: number;
}

/**
 * Column 2 — "past confirmed easter eggs".
 * Ported from clownbot-ledger.ts: theories.generated.ts entries with
 * outcome === 'confirmed', plus lore items with a ledger block.
 * Confirmed only — 'debunked' is a different thing and does not belong
 * in a column labelled "confirmed".
 *
 * Sort key: same as column 1 — newest first, by `date` (the lore item's
 * `ledger.on` resolution date, or the vault entry's era `end` boundary),
 * with a title tiebreak. `limit` slices AFTER that sort, so a capped list
 * is always the most recent confirmations, never an arbitrary slice.
 */
export function confirmedEggs(opts: ConfirmedEggsOptions = {}): BoardItem[] {
  const { eggsOnly = false, limit } = opts;
  const items: BoardItem[] = [];

  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      if (note.outcome !== 'confirmed') continue;
      if (eggsOnly && note.kind !== 'easter_egg') continue;
      items.push({
        id: `theory:${eraId}:${note.slug}`,
        title: note.title,
        blurb: firstLine(note.evidence ?? note.claim),
        prompt: naturalPrompt(note.title),
        date: getEra(eraId).end,
      });
    }
  }

  for (const item of LORE) {
    if (!item.ledger || item.ledger.verdict !== 'confirmed') continue;
    // Ledger entries are fan-theory verdicts, never planted-and-decoded eggs.
    if (eggsOnly) continue;
    items.push({
      id: `lore:${item.id}`,
      title: item.headline,
      blurb: firstLine(item.detail),
      prompt: item.prompts?.[0] ?? naturalPrompt(item.headline),
      date: item.ledger.on,
    });
  }

  items.sort(byDateDesc);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}
