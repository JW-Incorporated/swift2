/**
 * Clownbot — theory naming.
 *
 * Ported from build A's `clownbot-names.ts` (J1: rebuild, don't refit — but the
 * naming registry itself is untouched content, not architecture). Naming a
 * theory is how the fandom makes one portable: a named theory can be
 * referenced, argued with, and scored later. The community's own "Debutation"
 * (the debut + Reputation re-record pairing) is the model — that example comes
 * from the approved research pass, and is used here as a canonical name rather
 * than as a sourced claim in reader-facing copy.
 *
 * REUSE WITHOUT MEMORY: the interesting half of "coin and reuse a name" is the
 * reuse, and true cross-session reuse needs per-user persistence — which is
 * out of scope (J2, no phase-2 engine). What ships here is *deterministic*
 * reuse: a small registry of canonical names keyed to receipt ids and topic
 * patterns. If a take's receipts match a registry entry, the canonical name
 * wins and the model is not allowed to rename it. Everyone sees the same name
 * for the same theory, in every session, with no storage at all.
 *
 * NOTE ON THE RECEIPT TYPE: build A's resolver took `Receipt` from
 * `clownbot-receipts.ts`, which is deleted with build A (§ Salvage). The
 * resolver only ever reads `.id` off a receipt, so this port declares that
 * minimal shape locally (`NamedReceipt`) instead of importing a file slated
 * for deletion or reaching sideways into a sibling step's in-flight retrieval
 * module. Any receipt-shaped object with an `id` satisfies it.
 */

export interface CanonicalName {
  name: string;
  /** Receipt ids that pin this name only when the receipt is dominant. */
  receiptIds?: readonly string[];
  /** Normalised substrings in the reader's question that pin this name. */
  keywords?: readonly string[];
}

/** Minimal receipt shape the resolver needs — decoupled from clownbot-receipts.ts. */
export interface NamedReceipt {
  id: string;
}

export const NAME_REGISTRY: readonly CanonicalName[] = [
  {
    name: 'Debutation',
    receiptIds: ['lore:rep-tv-debut-tv'],
    keywords: [
      'rep tv',
      'reputation tv',
      'debut tv',
      'taylors version of reputation',
      're-record',
      'rerecord',
    ],
  },
  {
    name: 'The Sourdough Fiasco',
    receiptIds: ['lore:superbowl-lx-swiftie-theory', 'lore:superbowl-lx-halftime'],
    keywords: ['super bowl', 'superbowl', 'halftime', 'sourdough'],
  },
  {
    name: 'The Twelve Doors',
    receiptIds: ['lore:orange-doors-hunt'],
    keywords: ['orange door', 'orange doors', 'qr code', 'scavenger hunt'],
  },
  {
    name: 'The Machine Question',
    receiptIds: ['lore:swifties-against-ai'],
    keywords: [
      'ai',
      'generative',
      'swifties against ai',
      'swiftiesagainstai',
      'artificial intelligence',
      'orange door videos',
    ],
  },
  {
    name: 'The Twelve-Twelve Cipher',
    receiptIds: ['lore:tloas-countdown-announcement'],
    keywords: ['countdown', '12 12', '1212', 'twelve', 'numerology'],
  },
  {
    name: 'The evermore Hill',
    // The bot's opinionated album take, grounded in the evermore announcement
    // and folklore's Album of the Year win as the honest counterpoint.
    receiptIds: [
      'moment:vault-evermore-folklores-sister-arrives',
      'moment:vault-evermore-folklore-makes-her-the-first-woman-to-win-album-of-the-year-',
    ],
    // Narrow on purpose: the hill is the *comparison*, not any evermore mention.
    keywords: [
      'evermore hill',
      'evermore vs folklore',
      'evermore is better',
      'evermore better than folklore',
      'better than folklore',
    ],
  },
];

/** Same normalisation shape as the safety layer: lowercase, alphanumeric runs. */
function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Resolve the name for a take. A canonical match beats whatever the model
 * coined — so the same theory carries the same name for every reader.
 * Returns null when nothing matches and the model offered nothing usable.
 */
export function resolveTheoryName(
  question: string,
  receipts: readonly NamedReceipt[],
  modelProposed: unknown,
): { name: string; canonical: boolean } | null {
  const q = ` ${normalizeQuery(question)} `;
  const dominantReceiptId = receipts[0]?.id;

  // Only the first cited receipt may pin a name; supporting receipts do not
  // define the take. Score every entry before choosing so overlapping phrases
  // resolve by specificity instead of registry order (#1996).
  let best: { name: string; score: number } | null = null;
  let tied = false;
  for (const entry of NAME_REGISTRY) {
    let score = dominantReceiptId && entry.receiptIds?.includes(dominantReceiptId) ? 2 : 0;
    for (const keyword of entry.keywords ?? []) {
      const normalized = normalizeQuery(keyword);
      if (normalized && q.includes(` ${normalized} `)) {
        score += 1 + normalized.split(' ').length;
      }
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { name: entry.name, score };
      tied = false;
    } else if (score > 0 && best?.score === score) {
      tied = true;
    }
  }
  if (best && !tied) return { name: best.name, canonical: true };

  // Equal evidence is ambiguous. Use the model's bounded proposal instead of
  // quietly restoring first-entry-wins behavior.
  if (typeof modelProposed === 'string') {
    // Trim to something that reads as a name, not a sentence.
    const cleaned = modelProposed
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.!?]+$/, '');
    if (cleaned.length >= 3 && cleaned.length <= 60) return { name: cleaned, canonical: false };
  }

  return null;
}
