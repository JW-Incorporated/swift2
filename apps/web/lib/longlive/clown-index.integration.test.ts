import { describe, expect, it } from 'vitest';

import { CONTENT } from './content';
import { THEORIES_RAW } from './theories.generated';
import { LORE } from './clownbot-lore';
import { screenTopic } from './clown-blocklist';
import { buildClownDocs, type ClownDoc } from './clown-index';
import type { EraId } from '@swift2/experience';

/**
 * `clown-index.test.ts` mocks `./clown-blocklist` + every corpus module to
 * prove the WIRING deterministically. That leaves the property that actually
 * matters unproven: that no real document, screened by the real blocklist,
 * ends up in the real index. This file proves exactly that — no mocking at
 * all, real corpora, real `screenTopic`.
 *
 * "Candidate" below means every raw record `clown-index.ts` considers before
 * screening: one per theory note, one per lore item, one per Vault moment,
 * and one per moment's `rumors[]` entry (which is screened independently and
 * again cascaded off its parent moment — see clown-index.ts). Reported via
 * the test name below rather than a hardcoded id list, so it never rots as
 * the corpus changes.
 */
const theoryCandidates = Object.values(THEORIES_RAW).reduce((n, notes) => n + (notes?.length ?? 0), 0);
const loreCandidates = LORE.length;
const momentCandidates = CONTENT.length;
const rumorCandidates = CONTENT.reduce((n, item) => n + (item.rumors?.length ?? 0), 0);
const totalCandidates = theoryCandidates + loreCandidates + momentCandidates + rumorCandidates;

const docs = buildClownDocs();
const admitted = docs.length;
const excluded = totalCandidates - admitted;

const statusCounts = { rumor: 0, reported: 0, confirmed: 0, debunked: 0 };
for (const doc of docs) statusCounts[doc.status] += 1;

describe('clown-index — integration (real corpus, real blocklist, no mocking)', () => {
  it(
    `admits ${admitted} of ${totalCandidates} real candidates into the index ` +
      `(${excluded} excluded by the real blocklist), and every admitted doc's ` +
      `text still passes screenTopic on re-check`,
    () => {
      // Point 3 — the invariant can't pass vacuously by building nothing.
      expect(admitted).toBeGreaterThan(0);
      expect(totalCandidates).toBeGreaterThan(0);

      // Point 2 — the universal invariant: nothing currently in the index
      // trips the real blocklist. Asserted per-doc (not as a hardcoded id
      // list) so a future corpus change that introduces a leak fails loudly.
      for (const doc of docs) {
        expect(
          screenTopic(doc.text),
          `doc ${doc.id} is in the index but its text trips the real blocklist`,
        ).toBeNull();
      }
    },
  );

  it(
    `status distribution across ${admitted} admitted docs — ` +
      `rumor:${statusCounts.rumor} reported:${statusCounts.reported} ` +
      `confirmed:${statusCounts.confirmed} debunked:${statusCounts.debunked}`,
    () => {
      expect(statusCounts.rumor + statusCounts.reported + statusCounts.confirmed + statusCounts.debunked).toBe(
        admitted,
      );
    },
  );

  /**
   * The regression this whole change exists to prevent: a real, live
   * debunked lore item ("The Super Bowl LX theory, and how thoroughly it
   * died", `clownbot-lore.ts`) is indexed with `open: false` — under the old
   * boolean-only shape `!open` would have rendered it as `'confirmed'`,
   * asserting a debunked theory as fact.
   */
  it("the real 'superbowl-lx-swiftie-theory' debunked lore item is indexed as status: 'debunked', not 'confirmed'", () => {
    const doc = docs.find((d) => d.id === 'lore:superbowl-lx-swiftie-theory');
    expect(doc, 'expected the known debunked lore item to still exist in the real corpus').toBeDefined();
    expect(doc?.status).toBe('debunked');
    expect(doc?.status).not.toBe('confirmed');
  });

  /**
   * The universal side of the same rule: walk every admitted doc, and for
   * every one marked `'confirmed'`, check its own real source record
   * genuinely says confirmed (or, for a Vault moment, that moments are
   * confirmed by design — dated, sourced records of things that happened).
   * No hardcoded id list — this re-derives "genuinely confirmed" from the
   * same real corpora the index was built from.
   */
  it("no doc has status: 'confirmed' unless its real source genuinely said confirmed", () => {
    const confirmedDocs = docs.filter((d) => d.status === 'confirmed');
    expect(confirmedDocs.length).toBeGreaterThan(0);
    for (const doc of confirmedDocs) {
      expect(
        sourceGenuinelyConfirmed(doc),
        `doc ${doc.id} is status:'confirmed' but its real source did not say so`,
      ).toBe(true);
    }
  });
});

/** Re-derives "did the real source genuinely say confirmed" independent of clown-index.ts's own mapping. */
function sourceGenuinelyConfirmed(doc: ClownDoc): boolean {
  if (doc.kind === 'moment') return true; // Vault moments are confirmed by design (see clown-index.ts).

  if (doc.kind === 'lore') {
    const id = doc.id.slice('lore:'.length);
    return LORE.find((item) => item.id === id)?.status === 'confirmed';
  }

  if (doc.kind === 'theory') {
    const [, eraId, slug] = doc.id.split(':');
    const note = (THEORIES_RAW[eraId as EraId] ?? []).find((n) => n.slug === slug);
    return note?.outcome === 'confirmed';
  }

  if (doc.kind === 'rumor') {
    const [, momentId, indexStr] = doc.id.split(':');
    const moment = CONTENT.find((item) => item.id === momentId);
    return moment?.rumors?.[Number(indexStr)]?.status === 'confirmed';
  }

  return false;
}
