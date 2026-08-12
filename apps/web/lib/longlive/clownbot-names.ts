/**
 * Clownbot — theory naming.
 *
 * Pulled forward from V2 with the ledger. Naming a theory is how the fandom
 * makes one portable: a named theory can be referenced, argued with, and
 * scored later, which is exactly what the ledger needs. The community's own
 * "Debutation" (the debut + Reputation re-record pairing) is the model — that
 * example comes from the approved research pass, and is used here as a
 * canonical name rather than as a sourced claim in reader-facing copy.
 *
 * REUSE WITHOUT MEMORY: the interesting half of "coin and reuse a name" is the
 * reuse, and true cross-session reuse needs per-user persistence — which is
 * explicitly deferred (see the V2 seam in the PR). What ships here is
 * *deterministic* reuse: a small registry of canonical names keyed to receipt
 * ids and topic patterns. If a take's receipts match a registry entry, the
 * canonical name wins and the model is not allowed to rename it. Everyone sees
 * the same name for the same theory, in every session, with no storage at all.
 */

import type { Receipt } from './clownbot-receipts';

export interface CanonicalName {
  name: string;
  /** Receipt ids that, if cited, pin this name. */
  receiptIds?: readonly string[];
  /** Normalised substrings in the reader's question that pin this name. */
  keywords?: readonly string[];
}

export const NAME_REGISTRY: readonly CanonicalName[] = [
  {
    name: 'Debutation',
    receiptIds: ['lore:rep-tv-debut-tv'],
    keywords: ['rep tv', 'reputation tv', 'debut tv', 'taylors version of reputation', 're-record', 'rerecord'],
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
    keywords: ['ai', 'generative', 'swifties against ai', 'artificial intelligence'],
  },
  {
    name: 'The Twelve-Twelve Cipher',
    receiptIds: ['lore:tloas-countdown-announcement'],
    keywords: ['countdown', '12 12', '1212', 'twelve'],
  },
  {
    name: 'The evermore Hill',
    // The bot's opinionated album take, grounded in the evermore announcement
    // and folklore's Album of the Year win as the honest counterpoint.
    receiptIds: [
      'moment:vault-evermore-folklores-sister-arrives',
      'moment:vault-folklore-folklore-makes-her-the-first-woman-to-win-album-of-the-year-',
    ],
    // Narrow on purpose: the hill is the *comparison*, not any evermore mention.
    keywords: ['evermore hill', 'evermore vs folklore', 'evermore is better', 'evermore better than folklore', 'better than folklore'],
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
  receipts: readonly Receipt[],
  modelProposed: unknown,
): { name: string; canonical: boolean } | null {
  const citedIds = new Set(receipts.map((r) => r.id));
  const q = ` ${normalizeQuery(question)} `;

  // 1) STRONGEST signal — the theory whose OWN receipts were actually cited.
  //    Pick the entry with the most cited-receipt overlap, not the first in the
  //    registry: this is why a take citing the AI receipt now surfaces as "The
  //    Machine Question" instead of everything collapsing to "Debutation"
  //    (#1996). The receipts the answer stands on decide its name.
  let best: { name: string; overlap: number } | null = null;
  for (const entry of NAME_REGISTRY) {
    const overlap = entry.receiptIds?.filter((id) => citedIds.has(id)).length ?? 0;
    if (overlap > 0 && (best === null || overlap > best.overlap)) {
      best = { name: entry.name, overlap };
    }
  }
  if (best) return { name: best.name, canonical: true };

  // 2) Otherwise the reader's own wording pins a canonical theory.
  for (const entry of NAME_REGISTRY) {
    if (entry.keywords?.some((k) => q.includes(` ${k} `))) {
      return { name: entry.name, canonical: true };
    }
  }

  if (typeof modelProposed === 'string') {
    // Trim to something that reads as a name, not a sentence.
    const cleaned = modelProposed.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
    if (cleaned.length >= 3 && cleaned.length <= 60) return { name: cleaned, canonical: false };
  }

  return null;
}
