/**
 * Clownbot (build B) — retrieval index over the existing corpora.
 *
 * `buildClownDocs()` is pure: it folds threads/theories (theories.generated.ts),
 * rumors/lore (clownbot-lore.ts), and Vault moments — plus each moment's own
 * `rumors` block (content.ts) — into one flat `ClownDoc[]`. The model never
 * touches these source files directly; `clown-retrieve.ts` ranks over this
 * index and hands the route a small fixed candidate set.
 *
 * THE PRIVACY PRE-FILTER RUNS HERE, AT BUILD TIME. `screenTopic()`
 * (clown-blocklist.ts) is applied to every candidate document's searchable
 * text before it is ever pushed into the index. A document that trips it is
 * excluded outright — not filtered later, not ranked low, GONE — so blocked
 * material can never become clowning material no matter what a reader asks
 * for. When a moment's own text is blocked, every rumor attached to that
 * moment is dropped too, on the same rule: a rumor about a blocked topic is
 * still that topic.
 *
 * Studied `clownbot-receipts.ts` (build A) for the retrieval shape this repo
 * already trusts — namespaced ids, one flat corpus, a lazy memoised build —
 * but this file does not extend it; build A is being retired.
 */

import { CONTENT } from './content';
import { THEORIES_RAW } from './theories.generated';
import { LORE } from './clownbot-lore';
import { screenTopic } from './clown-blocklist';
import type { ItemStatus } from './clown-fallback';
import type { LoreStatus } from './clownbot-lore';
import type { EraId, RumorNote, RumorStatus, TheoryOutcome } from './types';

export type ClownDocKind = 'theory' | 'lore' | 'moment' | 'rumor';

export interface ClownDocSource {
  name: string;
  url: string;
}

export interface ClownDoc {
  /** Namespaced id: `theory:<eraId>:<slug>` | `lore:<id>` | `moment:<id>` | `rumor:<momentId>:<index>`. */
  id: string;
  kind: ClownDocKind;
  title: string;
  /** Searchable haystack — our words only. What `clown-retrieve.ts` scores against. */
  text: string;
  /** ISO display date, or null when the record is undated (most theories). */
  date: string | null;
  /**
   * Most recent activity date for recency ranking — `max(date, lastCheckedOn)`
   * where the corpus carries both. Null when nothing dates the doc at all.
   */
  recencyDate: string | null;
  /**
   * "Live clowning material" — a rumor still `unconfirmed`, lore still
   * `rumor`/`reported`, or a theory still `pending`. Vault moments are
   * settled fact and are never open. Drives `detectRecencyIntent()` ranking.
   */
  open: boolean;
  /**
   * The honesty label — feeds `RetrievedItem.status` (`clown-fallback.ts`),
   * which drives the prefix on every fallback answer and `ClownItemCard`'s
   * styling. THE RULE: only ever `'confirmed'` when the source corpus says so
   * explicitly. Every ambiguous or unresolved source state degrades to the
   * weakest honest label (`'rumor'`) rather than being rounded up — see the
   * `map*Status`/`map*Outcome` functions below for the exact per-corpus rule.
   * Overstating is the failure mode this exists to prevent; understating is
   * merely conservative.
   */
  status: ItemStatus;
  sources: ClownDocSource[];
  eraId: EraId | null;
}

/**
 * Lore's own `LoreStatus` already speaks the `ItemStatus` vocabulary — passed
 * straight through. The `default` branch is unreachable under the current
 * `LoreStatus` union but stays as a defensive floor: an unrecognised value
 * degrades to `'rumor'`, never `'confirmed'`, if the corpus type ever grows.
 */
function mapLoreStatus(status: LoreStatus): ItemStatus {
  switch (status) {
    case 'rumor':
    case 'reported':
    case 'confirmed':
    case 'debunked':
      return status;
    default:
      return 'rumor';
  }
}

/**
 * `abandoned` is deliberately NOT `'debunked'` — a theory nobody pursued was
 * never disproved, and calling it debunked is its own false claim.
 * `partially_confirmed` degrades to `'reported'`, not `'confirmed'`.
 */
function mapTheoryOutcome(outcome: TheoryOutcome): ItemStatus {
  switch (outcome) {
    case 'confirmed':
      return 'confirmed';
    case 'debunked':
      return 'debunked';
    case 'partially_confirmed':
      return 'reported';
    case 'pending':
    case 'abandoned':
    case 'unfalsifiable':
      return 'rumor';
    default:
      return 'rumor';
  }
}

/** Same shape as `mapTheoryOutcome` — `faded` degrades to `'rumor'`, not silently dropped. */
function mapRumorStatus(status: RumorStatus): ItemStatus {
  switch (status) {
    case 'confirmed':
      return 'confirmed';
    case 'debunked':
      return 'debunked';
    case 'partially_confirmed':
      return 'reported';
    case 'unconfirmed':
    case 'faded':
      return 'rumor';
    default:
      return 'rumor';
  }
}

/** The later of two ISO dates, tolerating either being absent. */
function laterDate(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * The blocklist pre-filter. `screenTopic()` (clown-blocklist.ts) returns a
 * `BlocklistCategory | null` — anything truthy means "blocked".
 */
function blocked(text: string): boolean {
  return Boolean(screenTopic(text));
}

function buildTheoryDocs(): ClownDoc[] {
  const out: ClownDoc[] = [];
  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      const text = `${note.title} ${note.claim} ${note.evidence ?? ''}`;
      if (blocked(text)) continue;
      out.push({
        id: `theory:${eraId}:${note.slug}`,
        kind: 'theory',
        title: note.title,
        text,
        date: null,
        recencyDate: null,
        open: note.outcome === 'pending',
        status: mapTheoryOutcome(note.outcome),
        sources: note.sources.map((s) => ({ name: s.name, url: s.url })),
        eraId: eraId as EraId,
      });
    }
  }
  return out;
}

function buildLoreDocs(): ClownDoc[] {
  const out: ClownDoc[] = [];
  for (const item of LORE) {
    const text = `${item.headline} ${item.detail}`;
    if (blocked(text)) continue;
    out.push({
      id: `lore:${item.id}`,
      kind: 'lore',
      title: item.headline,
      text,
      date: item.date,
      recencyDate: laterDate(item.date, item.lastCheckedOn),
      open: item.status === 'rumor' || item.status === 'reported',
      status: mapLoreStatus(item.status),
      sources: item.sources.map((s) => ({ name: s.name, url: s.url })),
      eraId: null,
    });
  }
  return out;
}

function buildRumorDoc(
  momentId: string,
  momentTitle: string,
  momentEraId: EraId,
  index: number,
  rumor: RumorNote,
): ClownDoc {
  return {
    id: `rumor:${momentId}:${index}`,
    kind: 'rumor',
    title: momentTitle,
    text: `${momentTitle} ${rumor.claim} ${rumor.note ?? ''}`,
    date: rumor.reportedOn,
    recencyDate: laterDate(rumor.reportedOn, rumor.lastCheckedOn),
    open: rumor.status === 'unconfirmed',
    status: mapRumorStatus(rumor.status),
    sources: [{ name: rumor.reportedBy, url: rumor.url }],
    eraId: momentEraId,
  };
}

function buildMomentDocs(): ClownDoc[] {
  const out: ClownDoc[] = [];
  for (const item of CONTENT) {
    const text = `${item.title} ${item.summary} ${item.body[0] ?? ''}`;
    const momentBlocked = blocked(text);
    if (!momentBlocked) {
      out.push({
        id: `moment:${item.id}`,
        kind: 'moment',
        title: item.title,
        text,
        date: item.date,
        recencyDate: item.date,
        open: false,
        // Vault moments are dated, sourced records of things that actually
        // happened — never speculation — so they are always 'confirmed'.
        status: 'confirmed',
        sources: (item.sources ?? []).map((s) => ({ name: s.name, url: s.url })),
        eraId: item.eraId,
      });
    }

    for (const [index, rumor] of (item.rumors ?? []).entries()) {
      // A rumor about a blocked moment is still the blocked topic — dropped
      // regardless of whether its own text independently trips the filter.
      const rumorDoc = buildRumorDoc(item.id, item.title, item.eraId, index, rumor);
      if (momentBlocked || blocked(rumorDoc.text)) continue;
      out.push(rumorDoc);
    }
  }
  return out;
}

/** Build the whole retrieval corpus. Pure — no I/O, no network, no model. */
export function buildClownDocs(): ClownDoc[] {
  return [...buildTheoryDocs(), ...buildLoreDocs(), ...buildMomentDocs()];
}

let cache: ClownDoc[] | null = null;

export function allClownDocs(): ClownDoc[] {
  if (cache === null) cache = buildClownDocs();
  return cache;
}

/** Test seam — drop the memoised index. */
export function resetClownDocCache(): void {
  cache = null;
}
