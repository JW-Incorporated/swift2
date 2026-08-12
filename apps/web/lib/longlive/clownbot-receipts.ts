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
import { NAME_REGISTRY } from './clownbot-names';
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
 * Retrieval stopwords — function words and the question scaffolding that used
 * to sink the old matcher. The prior version did stopword-less AND-substring
 * matching and, on a miss, fell back to the single longest token; the result
 * was "is rep tv actually coming" matching on **actually**, "orange door a
 * clue" matching on **something**, and "hi" matching **Hi**ddleswift. Dropping
 * these terms is what stops a meaningless token from carrying a match.
 *
 * Domain-meaningful short words (`tv`, `ai`, `rep`) are deliberately NOT here —
 * the name-registry alias pass below resolves those to their real receipts.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'into', 'on', 'onto', 'at', 'for',
  'with', 'about', 'from', 'by', 'as', 'than', 'then', 'up', 'down',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'do', 'does', 'did', 'done', 'has', 'have',
  'had', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
  'this', 'that', 'these', 'those', 'there', 'here',
  'what', 'whats', 'which', 'who', 'whom', 'whose', 'why', 'how', 'when', 'where',
  'not', 'no', 'nope', 'yes', 'yeah', 'so', 'just', 'really', 'actually', 'ever', 'even', 'still',
  'also', 'too', 'very', 'much', 'more', 'most', 'some', 'any', 'all',
  'ok', 'okay', 'hi', 'hey', 'hello', 'yo', 'um', 'uh', 'pls', 'please', 'thanks', 'thx', 'lol',
  'get', 'got', 'give', 'tell', 'make', 'made', 'want', 'wanna', 'know', 'think', 'thinks', 'say',
  'said', 'go', 'going', 'come', 'coming', 'out', 'now',
  'something', 'someone', 'somebody', 'anything', 'anyone', 'everything', 'everyone', 'nothing',
  'thing', 'things', 'one', 'stuff',
  // Generic WITHIN this bot — everything here is a theory/clue/take, so these
  // words discriminate nothing. Dropping them means "give me your best theory"
  // has no meaningful term left, falls to the canon-theory path (#1993), and
  // does not spuriously match the hundreds of receipts that mention "theory".
  'theory', 'theories', 'take', 'takes', 'clue', 'clues', 'clown', 'clowns', 'clowning', 'clowned',
  'decode', 'rank', 'commit', 'argue', 'delulu', 'best', 'wildest', 'craziest', 'boldest', 'hottest',
  'favourite', 'favorite', 'hunch', 'opinion', 'guess',
]);

/**
 * Query normalisation for the alias pass — identical to clownbot-names.ts so a
 * registry keyword like `rep tv` matches the same way in both places.
 */
function aliasNormalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Meaningful query terms: normalised, de-duplicated, stopwords and single characters dropped. */
function meaningfulTerms(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of tokenize(query)) {
    if (term.length < 2 || STOPWORDS.has(term)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    out.push(term);
  }
  return out;
}

/**
 * Meaningful-term overlap for one receipt. Word-boundary matching only — a bare
 * substring never counts, which is precisely what kept "hi" out of
 * "Hiddleswift" and a month token out of every dated moment. A title hit is
 * worth far more than a body hit; a whole word beats a prefix.
 *
 * The returned number is the RELEVANCE score the threshold is applied to. It
 * carries no editorial bonuses — those (see `qualityBonus`) only reorder
 * receipts that already cleared the bar, they never lift a weak match over it.
 */
export function scoreReceipt(receipt: Receipt, terms: readonly string[]): number {
  if (terms.length === 0) return 0;
  const titleWords = normalize(receipt.title).split(' ');
  const bodyWords = normalize(
    `${receipt.title} ${receipt.detail} ${receipt.dateLabel} ${receipt.eraId ?? ''}`,
  ).split(' ');

  let score = 0;
  for (const term of terms) {
    if (titleWords.includes(term)) score += 12;
    else if (term.length >= 3 && titleWords.some((w) => w.startsWith(term))) score += 7;
    else if (bodyWords.includes(term)) score += 5;
    else if (term.length >= 4 && bodyWords.some((w) => w.startsWith(term))) score += 2;
  }
  return score;
}

/** Editorial preference among receipts that already cleared the threshold. */
function qualityBonus(receipt: Receipt): number {
  let bonus = 0;
  if (receipt.sources.length > 0) bonus += 2; // a receipt with no source is not a receipt
  if (receipt.date) bonus += 1; // a date is what makes a receipt land
  if (receipt.kind === 'lore') bonus += 3; // live lore outranks archive; the news cycle is the point
  return bonus;
}

/**
 * The minimum meaningful-term overlap a receipt must reach to be surfaced. Set
 * so a single body-word hit (5) is NOT enough — a lone weak match ("february"
 * against a dated moment) stays below the line and the reader gets an honest
 * empty rather than a 60%-confidence receipt it never earned. A single title
 * word (12), a title-word prefix plus one body word, or any two meaningful body
 * hits all clear it.
 */
export const RELEVANCE_THRESHOLD = 8;

/** Where alias-resolved receipts sit before quality bonuses — always above the pack. */
const ALIAS_BASE = 100;

export const DEFAULT_RECEIPT_LIMIT = 6;

/**
 * Receipt ids pinned by a name-registry alias in the query. This is the fix for
 * the false-empty class (#1983/#1994): "is rep tv actually coming" resolves the
 * `rep tv` alias to the debut-re-record lore item even though no lexical term
 * survives, and "orange door" resolves to the doors hunt rather than matching a
 * junk token elsewhere.
 */
function aliasReceiptIds(query: string): string[] {
  const q = ` ${aliasNormalize(query)} `;
  const ids: string[] = [];
  for (const entry of NAME_REGISTRY) {
    if (!entry.keywords || !entry.receiptIds) continue;
    if (entry.keywords.some((k) => q.includes(` ${k} `))) ids.push(...entry.receiptIds);
  }
  return ids;
}

/**
 * Retrieve the top-K receipts for a reader's words. Deterministic, free, and
 * the ONLY way vault material reaches the model.
 *
 * Real relevance matching, not the old AND-substring-then-longest-token hack:
 *   1. Resolve name-registry ALIASES first — a known theory name pins its real
 *      receipts regardless of surface wording.
 *   2. Score every receipt by meaningful-term overlap (stopwords dropped,
 *      word-boundary matches only) and keep those over RELEVANCE_THRESHOLD.
 *
 * Below the threshold the honest answer is an EMPTY result (see
 * EMPTY_RECEIPTS_MESSAGE) — we never pad with unrelated moments and never
 * surface a weak match at a confidence it did not earn.
 */
export function findReceipts(query: string, limit = DEFAULT_RECEIPT_LIMIT): Receipt[] {
  const terms = meaningfulTerms(query);
  const aliasIds = aliasReceiptIds(query);
  if (terms.length === 0 && aliasIds.length === 0) return [];

  const ranked = new Map<string, { receipt: Receipt; rank: number }>();

  // Alias hits are known on-topic receipts — admitted above the threshold.
  for (const id of aliasIds) {
    const receipt = receiptById(id);
    if (receipt) ranked.set(id, { receipt, rank: ALIAS_BASE + qualityBonus(receipt) });
  }

  // Lexical hits that clear the relevance bar.
  if (terms.length > 0) {
    for (const receipt of allReceipts()) {
      const overlap = scoreReceipt(receipt, terms);
      if (overlap < RELEVANCE_THRESHOLD) continue;
      const prev = ranked.get(receipt.id);
      // An alias hit that ALSO matches lexically keeps its lead and gains the overlap.
      ranked.set(receipt.id, {
        receipt,
        rank: (prev ? prev.rank : qualityBonus(receipt)) + overlap,
      });
    }
  }

  return [...ranked.values()]
    .sort((a, b) => b.rank - a.rank || a.receipt.id.localeCompare(b.receipt.id))
    .slice(0, limit)
    .map((r) => r.receipt);
}

/**
 * Resolve the receipt an authored suggested-prompt was written against. Chips
 * carry their lore `sourceId` so a prompt ALWAYS lands on its intended receipt
 * (#1990) even when the prompt's prose shares no meaningful term with it.
 */
export function receiptForSource(sourceId: string): Receipt | undefined {
  const id = sourceId.startsWith('lore:') ? sourceId : `lore:${sourceId}`;
  return receiptById(id);
}

/**
 * Clownbot's own ride-or-die theories, each grounded in REAL receipts. When a
 * reader asks for the bot's take/best theory (#1993) and retrieval finds no
 * specific receipt, the route offers one of these instead of throwing the
 * answer away. Deterministic per question so it is not always the same one —
 * which is also what makes the theory label vary rather than defaulting to
 * "Debutation" every time (#1996). Every id here resolves — a test asserts it.
 */
export interface CanonTheory {
  name: string;
  receiptIds: readonly string[];
}

export const CANON_THEORIES: readonly CanonTheory[] = [
  { name: 'Debutation', receiptIds: ['lore:rep-tv-debut-tv'] },
  {
    name: 'The evermore Hill',
    receiptIds: [
      'moment:vault-evermore-folklores-sister-arrives',
      'moment:vault-folklore-folklore-makes-her-the-first-woman-to-win-album-of-the-year-',
    ],
  },
  {
    name: 'The Sourdough Fiasco',
    receiptIds: ['lore:superbowl-lx-swiftie-theory', 'lore:superbowl-lx-halftime'],
  },
];

/** Stable non-negative hash so a given question always draws the same canon theory. */
function canonIndex(text: string): number {
  let h = 7;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % CANON_THEORIES.length;
}

/** The receipts backing the canon theory chosen for this question. */
export function canonReceipts(text: string): Receipt[] {
  const theory = CANON_THEORIES[canonIndex(text)];
  return theory.receiptIds
    .map((id) => receiptById(id))
    .filter((r): r is Receipt => r !== undefined);
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
