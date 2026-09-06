import { describe, expect, it, vi } from 'vitest';

import type { ContentItem, TheoryNote } from '@swift2/experience';
import type { LoreItem } from './clownbot-lore';

/**
 * The `status: ItemStatus` mapping matrix on `ClownDoc` — every source
 * outcome/status value, per corpus, mapped onto the four `ItemStatus`
 * values it is allowed to become. THE RULE UNDER TEST: only ever
 * `'confirmed'` when the source explicitly says so; every ambiguous or
 * unresolved state degrades to `'rumor'` (or `'reported'` for a genuine
 * partial), never rounds up.
 *
 * Mocked fixtures (not the real corpus) so every branch — including
 * `abandoned`/`unfalsifiable`/`faded`, which may or may not exist in today's
 * live data — is exercised regardless of what the corpus currently contains.
 * `clown-index.integration.test.ts` covers the same rule against the real,
 * unmocked corpus.
 */
const fixtures = vi.hoisted(() => ({
  LORE_BY_STATUS: [
    { id: 'lore-rumor', status: 'rumor', date: '2026-08-01', lastCheckedOn: '2026-08-01', headline: 'Lore rumor', detail: 'A live rumor.', sources: [{ name: 'Outlet', url: 'https://example.com/1' }] },
    { id: 'lore-reported', status: 'reported', date: '2026-08-01', lastCheckedOn: '2026-08-01', headline: 'Lore reported', detail: 'A reported item.', sources: [{ name: 'Outlet', url: 'https://example.com/2' }] },
    { id: 'lore-confirmed', status: 'confirmed', date: '2026-08-01', lastCheckedOn: '2026-08-01', headline: 'Lore confirmed', detail: 'A confirmed item.', sources: [{ name: 'Outlet', url: 'https://example.com/3' }] },
    { id: 'lore-debunked', status: 'debunked', date: '2026-08-01', lastCheckedOn: '2026-08-01', headline: 'Lore debunked', detail: 'A debunked item.', sources: [{ name: 'Outlet', url: 'https://example.com/4' }] },
  ],
  THEORIES_BY_OUTCOME: [
    { slug: 'confirmed', kind: 'theory', title: 'Confirmed theory', claim: 'c', evidence: null, confidence: 'official', outcome: 'confirmed', sources: [{ name: 'Outlet', url: 'https://example.com/t1' }] },
    { slug: 'partially-confirmed', kind: 'theory', title: 'Partially confirmed theory', claim: 'c', evidence: null, confidence: 'plausible', outcome: 'partially_confirmed', sources: [{ name: 'Outlet', url: 'https://example.com/t2' }] },
    { slug: 'pending', kind: 'theory', title: 'Pending theory', claim: 'c', evidence: null, confidence: 'plausible', outcome: 'pending', sources: [{ name: 'Outlet', url: 'https://example.com/t3' }] },
    { slug: 'debunked', kind: 'theory', title: 'Debunked theory', claim: 'c', evidence: null, confidence: 'plausible', outcome: 'debunked', sources: [{ name: 'Outlet', url: 'https://example.com/t4' }] },
    { slug: 'abandoned', kind: 'theory', title: 'Abandoned theory', claim: 'c', evidence: null, confidence: 'plausible', outcome: 'abandoned', sources: [{ name: 'Outlet', url: 'https://example.com/t5' }] },
    { slug: 'unfalsifiable', kind: 'theory', title: 'Unfalsifiable theory', claim: 'c', evidence: null, confidence: 'plausible', outcome: 'unfalsifiable', sources: [{ name: 'Outlet', url: 'https://example.com/t6' }] },
  ],
  MOMENT_WITH_RUMORS_BY_STATUS: {
    id: 'moment-rumor-matrix',
    eraId: 'lover',
    date: '2026-01-01',
    dateLabel: 'January 2026',
    title: 'A moment with one rumor per status',
    summary: 'Carries the full rumor-status matrix.',
    body: ['Body.'],
    tags: [],
    images: [{ url: '/eras/lover.png', kind: 'primary' }],
    rumors: [
      { claim: 'Unconfirmed rumor.', reportedBy: 'Outlet', reportedOn: '2026-08-01', status: 'unconfirmed', url: 'https://example.com/r0' },
      { claim: 'Partially confirmed rumor.', reportedBy: 'Outlet', reportedOn: '2026-08-01', status: 'partially_confirmed', url: 'https://example.com/r1' },
      { claim: 'Confirmed rumor.', reportedBy: 'Outlet', reportedOn: '2026-08-01', status: 'confirmed', url: 'https://example.com/r2' },
      { claim: 'Debunked rumor.', reportedBy: 'Outlet', reportedOn: '2026-08-01', status: 'debunked', url: 'https://example.com/r3' },
      { claim: 'Faded rumor.', reportedBy: 'Outlet', reportedOn: '2026-08-01', status: 'faded', url: 'https://example.com/r4' },
    ],
  },
  PLAIN_MOMENT: {
    id: 'plain-moment',
    eraId: 'lover',
    date: '2026-01-01',
    dateLabel: 'January 2026',
    title: 'A plain settled moment',
    summary: 'Nothing speculative.',
    body: ['Body.'],
    tags: [],
    images: [{ url: '/eras/lover.png', kind: 'primary' }],
  },
}));

vi.mock('./clown-blocklist', () => ({ screenTopic: (): null => null }));

vi.mock('./clownbot-lore', () => ({ LORE: fixtures.LORE_BY_STATUS as LoreItem[] }));

vi.mock('./content', () => ({
  CONTENT: [fixtures.MOMENT_WITH_RUMORS_BY_STATUS, fixtures.PLAIN_MOMENT] as unknown as ContentItem[],
}));

vi.mock('./theories.generated', () => ({
  THEORIES_RAW: { lover: fixtures.THEORIES_BY_OUTCOME as TheoryNote[] },
}));

const { buildClownDocs } = await import('./clown-index');

describe('clown-index — status mapping (lore)', () => {
  const docs = buildClownDocs();
  it.each([
    ['lore-rumor', 'rumor'],
    ['lore-reported', 'reported'],
    ['lore-confirmed', 'confirmed'],
    ['lore-debunked', 'debunked'],
  ] as const)('%s -> status %s', (id, expected) => {
    expect(docs.find((d) => d.id === `lore:${id}`)?.status).toBe(expected);
  });
});

describe('clown-index — status mapping (theories)', () => {
  const docs = buildClownDocs();
  it.each([
    ['confirmed', 'confirmed'],
    ['partially-confirmed', 'reported'],
    ['pending', 'rumor'],
    ['debunked', 'debunked'],
    ['abandoned', 'rumor'],
    ['unfalsifiable', 'rumor'],
  ] as const)('outcome for slug %s -> status %s', (slug, expected) => {
    expect(docs.find((d) => d.id === `theory:lover:${slug}`)?.status).toBe(expected);
  });

  it('never maps `abandoned` to `debunked` — a theory nobody pursued was never disproved', () => {
    expect(docs.find((d) => d.id === 'theory:lover:abandoned')?.status).not.toBe('debunked');
  });
});

describe('clown-index — status mapping (rumors)', () => {
  const docs = buildClownDocs();
  it.each([
    [0, 'unconfirmed', 'rumor'],
    [1, 'partially_confirmed', 'reported'],
    [2, 'confirmed', 'confirmed'],
    [3, 'debunked', 'debunked'],
    [4, 'faded', 'rumor'],
  ] as const)('index %i (%s) -> status %s', (index, _sourceStatus, expected) => {
    expect(docs.find((d) => d.id === `rumor:moment-rumor-matrix:${index}`)?.status).toBe(expected);
  });
});

describe('clown-index — status mapping (moments)', () => {
  it('a Vault moment is always confirmed', () => {
    const docs = buildClownDocs();
    expect(docs.find((d) => d.id === 'moment:plain-moment')?.status).toBe('confirmed');
  });
});
