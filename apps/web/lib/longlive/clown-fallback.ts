/**
 * Clownbot — the zero-model fallback card composer.
 *
 * PLAN.md (Clownbot rebuild, Step 5): this is what serves the surface when
 * the daily compose cap is exhausted, when there is no API key, or when the
 * model is down. It is not a degraded apology — per the Mood Chat re-spec's
 * standard for the equivalent surface, "the fallback is the primary design,
 * not an apology." The output is a deliberate, in-character response built
 * from FIXED framing lines wrapped around the retrieved items' own authored
 * text. It never calls a model, never invents a claim, and never asserts an
 * unresolved theory as settled fact — that last guarantee is enforced here,
 * by the status-keyed prefix below, not left to trust in the source text.
 *
 * Pure and deterministic: same items in, same `FallbackAnswer` out. No
 * `Date.now()`, no randomness, no network.
 */
import type { ClownDoc } from './clown-index';

/** How resolved a retrieved claim is. Mirrors `LoreStatus` (clownbot-lore.ts)
 * and the vault theory corpus's `outcome` field — the two things
 * `clown-retrieve.ts` (PLAN.md Step 3) draws its items from. */
export type ItemStatus = 'rumor' | 'reported' | 'confirmed' | 'debunked';

export interface ItemSource {
  name: string;
  url: string;
}

/**
 * One retrieval hit, ready to compose. Mirrors the shape already established
 * by `clownbot-lore.ts`'s `LoreItem` and `clownbot-ledger.ts`'s `LedgerEntry`:
 * headline/detail in our own words, a `status` that says exactly how
 * resolved the claim is, and at least one named, dated source.
 *
 * `clown-retrieve.ts` is the intended producer of these (built in parallel,
 * not yet landed as of this file) — this is the shape it needs to hand over
 * for the composer below to have anything to compose against.
 */
export interface RetrievedItem {
  id: string;
  /** One line, our words. */
  headline: string;
  /** 1–3 sentences, our words. Never asserts beyond `status`. */
  detail: string;
  status: ItemStatus;
  /** ISO date. */
  date: string;
  /** At least one, in real data — composer degrades gracefully to zero. */
  sources: ItemSource[];
}

export interface FallbackAnswer {
  /** The composed, in-character text. Fixed framing lines + items' own text. */
  text: string;
  /** The items the text was built from, unmodified — render these as the
   * source cards beneath the answer. */
  items: RetrievedItem[];
}

/**
 * Which of the two paths landed on this composer — they are NOT the same
 * situation and must not share an intro line:
 *
 * - `'degraded'` — the daily compose cap is exhausted, there is no API key,
 *   the model is down, or the kill switch is on. The model was supposed to
 *   run and didn't. "No model on deck" is true here.
 * - `'chip'` — a reader tapped an item in one of the two prefill columns.
 *   The model was never going to be called; that is the design, and it is
 *   what keeps both columns free. Using the degraded line here would
 *   apologise for an outage that is not happening, on what will be the most
 *   common interaction on the page.
 *
 * No default — every call site must say which path it is on.
 */
export type FallbackReason = 'chip' | 'degraded';

/** `reason: 'degraded'` intro. Shown before the item list when the model was
 * supposed to run and couldn't. Sets the frame plainly rather than apologizing. */
export const FALLBACK_INTRO_DEGRADED =
  "No model on deck right now, so you get the raw board: here's exactly what the vault holds on that, dated and sourced, none of my usual spin.";

/** `reason: 'chip'` intro. Shown before the item list when a column tap
 * intentionally skipped the model — no hint of failure, the bot is choosing
 * to pull the file rather than compensating for anything broken. */
export const FALLBACK_INTRO_CHIP =
  "Pulling the file on that one — dated and sourced, straight from the vault, no argument built on top.";

/** Shown after the item list. The self-aware close — matches the bot's
 * established stance (clownbot-persona.ts's degraded copy) that a composer
 * without the model is not a composer that overclaims to make up for it. */
export const FALLBACK_OUTRO =
  "Take it as receipts, not as a verdict — I didn't build you a case, I just handed you the file.";

/** The whole answer when retrieval came back empty. Not a refusal, and not
 * silence — the surface never returns nothing (same non-negotiable as Mood). */
export const FALLBACK_EMPTY =
  "The vault's got nothing filed under that one. Not a refusal — just an empty shelf. Try a different clue and I'll go dig again.";

/**
 * The hedge is keyed on `status`, not on trusting the item's own prose to
 * hedge itself — that is what makes "never assert an unresolved theory as
 * fact" a guarantee of this function rather than a hope about upstream data.
 */
const STATUS_PREFIX: Record<ItemStatus, string> = {
  confirmed: 'Confirmed',
  debunked: 'Debunked',
  reported: 'Reported, not confirmed',
  rumor: 'Rumor only, not confirmed',
};

function formatSources(sources: ItemSource[]): string {
  return sources.map((s) => s.name).join(', ');
}

/** Exported so `clown-safety.ts` can recognise a stored fallback answer's
 * item lines on re-screen (`isFallbackAnswerText`) using the exact same
 * formatting this composer uses — never a re-implementation that could
 * silently drift from what real fallback text actually looks like. */
export function formatItem(item: RetrievedItem): string {
  const prefix = STATUS_PREFIX[item.status];
  const attribution = item.sources.length > 0 ? `${formatSources(item.sources)}, ${item.date}` : item.date;
  return `${prefix}: ${item.headline}. ${item.detail} (${attribution})`;
}

/** `ClownDoc` -> `RetrievedItem`. `status` maps straight across — it is the
 * honesty label the source corpus already assigned; it is never re-derived
 * from `open` or anything else here. Single source of truth for both the
 * route (building the retrieval set the composer runs on) and
 * `clown-safety.ts` (recognising self-authored fallback lines on re-screen)
 * — moved here from `route.ts` so neither has to duplicate the mapping. */
export function docToRetrievedItem(doc: ClownDoc): RetrievedItem {
  return {
    id: doc.id,
    headline: doc.title,
    detail: doc.text,
    status: doc.status,
    date: doc.date ?? doc.recencyDate ?? 'undated',
    sources: doc.sources,
  };
}

/**
 * Compose a fallback answer from retrieved items. Zero model calls.
 *
 * `reason` is required, not defaulted — see `FallbackReason` above for why a
 * default would let a future caller silently get the wrong framing.
 *
 * Same items + reason in, same `FallbackAnswer` out — no hidden state, no clock.
 */
export function composeFallback(items: RetrievedItem[], reason: FallbackReason): FallbackAnswer {
  if (items.length === 0) {
    return { text: FALLBACK_EMPTY, items: [] };
  }
  const intro = reason === 'degraded' ? FALLBACK_INTRO_DEGRADED : FALLBACK_INTRO_CHIP;
  const lines = items.map(formatItem);
  const text = [intro, '', ...lines, '', FALLBACK_OUTRO].join('\n');
  return { text, items };
}
