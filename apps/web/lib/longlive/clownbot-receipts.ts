/**
 * Clownbot — receipt retrieval over the Vault.
 *
 * THE DIFFERENTIATOR (research finding #4): this repo holds ~733 dated, sourced
 * moments plus 60 theories — precisely the corpus every other Taylor bot
 * lacks. "That's not delulu — she literally capitalised LOVER in the ME! lyric
 * video, April 26 2019" is the difference between a Swiftie and a chatbot.
 *
 * THE ARCHITECTURAL RULE, borrowed from mood-client's discipline: THE MODEL
 * NEVER SEARCHES THE VAULT. Retrieval is pure, deterministic TypeScript that
 * runs here, before any spend. The route hands the model a small fixed set of
 * receipts and the model may only cite ids from that set; anything else is
 * dropped downstream. The model therefore *structurally cannot* invent a
 * receipt, exactly as the Mood classifier structurally cannot invent a song.
 *
 * Reuses `normalize` / `tokenize` from search.ts rather than building a second
 * text index — this is a different corpus shape (moments + theories + lore
 * folded into one Receipt type), but the tokenisation must not drift.
 */

import { CONTENT } from './content';
import { THEORIES_RAW } from './theories.generated';
import { normalize, tokenize } from './search';
import { LORE, type LoreSource, type LoreStatus } from './clownbot-lore';
import type { EraId } from './types';

export interface Receipt {
  /** Namespaced id the model cites: `moment:<id>` | `theory:<era>:<slug>` | `lore:<id>`. */
  id: string;
  kind: 'moment' | 'theory' | 'lore';
  /** ISO date, or null for undated theory records. */
  date: string | null;
  /** Human display date. */
  dateLabel: string;
  title: string;
  /** One short line of substance. */
  detail: string;
  sources: LoreSource[];
  /** Normalised lifecycle status, where the record has one. */
  status: LoreStatus | null;
  eraId: EraId | null;
}

/** Trim editorial prose to a single citable line. */
function firstLine(text: string, max = 240): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return `${(lastStop > 80 ? cut.slice(0, lastStop) : cut).trimEnd()}…`;
}

/**
 * Map a theory's outcome onto the lore status vocabulary so the whole receipt
 * corpus speaks one language. `pending`/`unfalsifiable`/`abandoned` have no
 * lore equivalent and stay null rather than being forced into one.
 */
function statusFromOutcome(outcome: string): LoreStatus | null {
  if (outcome === 'confirmed') return 'confirmed';
  if (outcome === 'partially_confirmed') return 'reported';
  if (outcome === 'debunked') return 'debunked';
  return null;
}

let cache: Receipt[] | null = null;

/** Build the receipt corpus once, lazily. Pure — no I/O, no network. */
export function buildReceipts(): Receipt[] {
  const out: Receipt[] = [];

  for (const item of CONTENT) {
    out.push({
      id: `moment:${item.id}`,
      kind: 'moment',
      date: item.date,
      dateLabel: item.dateLabel,
      title: item.title,
      detail: firstLine(item.summary || item.body[0] || ''),
      sources: (item.sources ?? []).map((s) => ({ name: s.name, url: s.url })),
      status: null,
      eraId: item.eraId,
    });
  }

  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      out.push({
        id: `theory:${eraId}:${note.slug}`,
        kind: 'theory',
        date: null,
        dateLabel: 'undated',
        title: note.title,
        detail: firstLine(note.claim),
        sources: note.sources.map((s) => ({ name: s.name, url: s.url })),
        status: statusFromOutcome(note.outcome),
        eraId: eraId as EraId,
      });
    }
  }

  for (const item of LORE) {
    out.push({
      id: `lore:${item.id}`,
      kind: 'lore',
      date: item.date,
      dateLabel: item.date,
      title: item.headline,
      detail: firstLine(item.detail),
      sources: [...item.sources],
      status: item.status,
      eraId: null,
    });
  }

  return out;
}

export function allReceipts(): Receipt[] {
  if (cache === null) cache = buildReceipts();
  return cache;
}

/** Test seam — drop the memoised corpus. */
export function resetReceiptCache(): void {
  cache = null;
}

const BY_ID = new Map<string, Receipt>();

export function receiptById(id: string): Receipt | undefined {
  if (BY_ID.size === 0) {
    for (const r of allReceipts()) BY_ID.set(r.id, r);
  }
  return BY_ID.get(id);
}

/**
 * Score one receipt against the query terms. Deliberately simple and lexical,
 * mirroring search.ts's weighting shape: a title hit is worth much more than a
 * body hit, and every term must appear somewhere (AND semantics) or the
 * receipt scores zero.
 */
export function scoreReceipt(receipt: Receipt, terms: readonly string[]): number {
  if (terms.length === 0) return 0;
  const title = normalize(receipt.title);
  const body = normalize(`${receipt.title} ${receipt.detail} ${receipt.dateLabel} ${receipt.eraId ?? ''}`);

  let score = 0;
  for (const term of terms) {
    if (!body.includes(term)) return 0; // AND across terms
    if (title === term) score += 60;
    else if (title.startsWith(term)) score += 30;
    else if (new RegExp(`\\b${term}`).test(title)) score += 18;
    else if (title.includes(term)) score += 9;
    else if (new RegExp(`\\b${term}`).test(body)) score += 5;
    else score += 2;
  }

  // Prefer records that carry a citable source — a receipt with no source is
  // not a receipt.
  if (receipt.sources.length > 0) score += 4;
  // Prefer dated records; a date is the thing that makes a receipt land.
  if (receipt.date) score += 3;
  // Live lore outranks archive on equal footing: the news cycle is the point.
  if (receipt.kind === 'lore') score += 6;

  return score;
}

export const DEFAULT_RECEIPT_LIMIT = 6;

/**
 * Retrieve the top-K receipts for a reader's words. Deterministic, free, and
 * the ONLY way vault material reaches the model.
 *
 * Falls back progressively: full query → drop to the single strongest term →
 * empty. An empty result is a real answer (see EMPTY_RECEIPTS_MESSAGE) — we do
 * not pad it with unrelated moments to look busy.
 */
export function findReceipts(query: string, limit = DEFAULT_RECEIPT_LIMIT): Receipt[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const corpus = allReceipts();
  const rank = (ts: readonly string[]): Receipt[] =>
    corpus
      .map((receipt) => ({ receipt, score: scoreReceipt(receipt, ts) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.receipt.id.localeCompare(b.receipt.id))
      .slice(0, limit)
      .map((r) => r.receipt);

  const full = rank(terms);
  if (full.length > 0) return full;

  // Every term had to match; relax to the longest single term before giving up.
  const longest = [...terms].sort((a, b) => b.length - a.length)[0];
  return longest ? rank([longest]) : [];
}

/**
 * The compact form handed to the model — id, date, title, one line. Nothing
 * else crosses the boundary, so the prompt stays small and the model has
 * nothing to embellish from.
 */
export function receiptsForPrompt(receipts: readonly Receipt[]): string {
  return receipts
    .map((r) => `[${r.id}] (${r.dateLabel}${r.status ? `, ${r.status}` : ''}) ${r.title} — ${r.detail}`)
    .join('\n');
}
