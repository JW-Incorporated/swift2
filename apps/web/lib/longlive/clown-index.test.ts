import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContentItem, TheoryNote } from '@swift2/experience';
import type { LoreItem } from './clownbot-lore';

/**
 * `clown-blocklist.ts` (clown-index.ts's privacy pre-filter) is being written
 * in parallel and does not exist on disk yet — this is a narrow local test
 * double, per the step brief, never in source. `screenTopic()` trips on the
 * literal marker `BLOCKME` so the test controls exactly which fixture docs
 * are blocked, independent of the real module's eventual phrase lists.
 *
 * Fixtures live inside `vi.hoisted()` because `vi.mock()` factories are
 * hoisted above the rest of the file — a plain top-level `const` referenced
 * from a factory would be a temporal-dead-zone error at import time.
 */
const fixtures = vi.hoisted(() => {
  function moment(overrides: Record<string, unknown>): Record<string, unknown> {
    return {
      id: 'moment-default',
      eraId: 'lover',
      date: '2026-01-01',
      dateLabel: 'January 2026',
      title: 'Default moment',
      summary: 'A default summary.',
      body: ['Default body.'],
      tags: [],
      images: [{ url: '/eras/lover.png', kind: 'primary' }],
      ...overrides,
    };
  }

  return {
    CLEAN_LORE: {
      id: 'clean-lore',
      status: 'reported',
      date: '2026-08-01',
      lastCheckedOn: '2026-08-05',
      headline: 'A clean reported item',
      detail: 'Nothing sensitive here, safe to clown on.',
      sources: [{ name: 'Outlet', url: 'https://example.com/clean' }],
    },
    BLOCKED_LORE: {
      id: 'blocked-lore',
      status: 'rumor',
      date: '2026-08-01',
      lastCheckedOn: '2026-08-05',
      headline: 'BLOCKME sensitive headline',
      detail: 'This should never reach the index.',
      sources: [{ name: 'Outlet', url: 'https://example.com/blocked' }],
    },
    CONFIRMED_LORE: {
      id: 'confirmed-lore',
      status: 'confirmed',
      date: '2020-01-01',
      lastCheckedOn: '2020-01-02',
      headline: 'An old confirmed item',
      detail: 'Long settled, not open.',
      sources: [{ name: 'Outlet', url: 'https://example.com/confirmed' }],
    },
    CLEAN_MOMENT: moment({ id: 'clean-moment', title: 'Clean moment', summary: 'Nothing sensitive.' }),
    BLOCKED_MOMENT: moment({
      id: 'blocked-moment',
      title: 'BLOCKME moment',
      summary: 'Should never surface.',
    }),
    MOMENT_WITH_RUMOR: moment({
      id: 'moment-with-rumor',
      title: 'Moment with a clean rumor',
      rumors: [
        {
          claim: 'Reported to be doing a thing.',
          reportedBy: 'Outlet',
          reportedOn: '2026-08-10',
          status: 'unconfirmed',
          url: 'https://example.com/rumor',
        },
      ],
    }),
    MOMENT_WITH_BLOCKED_RUMOR: moment({
      id: 'moment-with-blocked-rumor',
      title: 'Moment whose rumor is blocked',
      rumors: [
        {
          claim: 'BLOCKME sensitive claim.',
          reportedBy: 'Outlet',
          reportedOn: '2026-08-10',
          status: 'unconfirmed',
          url: 'https://example.com/rumor-blocked',
        },
      ],
    }),
    BLOCKED_MOMENT_WITH_CLEAN_RUMOR: moment({
      id: 'blocked-moment-with-rumor',
      title: 'BLOCKME moment with an otherwise clean rumor',
      rumors: [
        {
          claim: 'This rumor text alone would pass.',
          reportedBy: 'Outlet',
          reportedOn: '2026-08-10',
          status: 'unconfirmed',
          url: 'https://example.com/rumor-cascade',
        },
      ],
    }),
    PENDING_THEORY: {
      slug: 'pending-theory',
      kind: 'theory',
      title: 'An unresolved theory',
      claim: 'Fans think this is happening.',
      evidence: 'Some circumstantial evidence.',
      confidence: 'plausible',
      outcome: 'pending',
      sources: [{ name: 'Outlet', url: 'https://example.com/theory' }],
    },
    CONFIRMED_THEORY: {
      slug: 'confirmed-theory',
      kind: 'easter_egg',
      title: 'A confirmed theory',
      claim: 'This one landed.',
      evidence: 'Confirmed by the artist.',
      confidence: 'official',
      outcome: 'confirmed',
      sources: [{ name: 'Outlet', url: 'https://example.com/confirmed-theory' }],
    },
    BLOCKED_THEORY: {
      slug: 'blocked-theory',
      kind: 'theory',
      title: 'BLOCKME theory',
      claim: 'Should never surface.',
      evidence: null,
      confidence: 'plausible',
      outcome: 'pending',
      sources: [{ name: 'Outlet', url: 'https://example.com/blocked-theory' }],
    },
  };
});

vi.mock('./clown-blocklist', () => ({
  screenTopic: (text: string): string | null => (text.includes('BLOCKME') ? 'blocked-topic' : null),
}));

vi.mock('./clownbot-lore', () => ({
  LORE: [fixtures.CLEAN_LORE, fixtures.BLOCKED_LORE, fixtures.CONFIRMED_LORE] as LoreItem[],
}));

vi.mock('./content', () => ({
  CONTENT: [
    fixtures.CLEAN_MOMENT,
    fixtures.BLOCKED_MOMENT,
    fixtures.MOMENT_WITH_RUMOR,
    fixtures.MOMENT_WITH_BLOCKED_RUMOR,
    fixtures.BLOCKED_MOMENT_WITH_CLEAN_RUMOR,
  ] as unknown as ContentItem[],
}));

vi.mock('./theories.generated', () => ({
  THEORIES_RAW: {
    lover: [fixtures.PENDING_THEORY, fixtures.CONFIRMED_THEORY, fixtures.BLOCKED_THEORY] as TheoryNote[],
  },
}));

const { allClownDocs, buildClownDocs, resetClownDocCache } = await import('./clown-index');

describe('clown-index — build-time privacy pre-filter', () => {
  beforeEach(() => {
    resetClownDocCache();
  });

  it('excludes a blocklist-tripping lore item from the built index', () => {
    const docs = buildClownDocs();
    expect(docs.find((d) => d.id === 'lore:blocked-lore')).toBeUndefined();
    expect(docs.find((d) => d.id === 'lore:clean-lore')).toBeDefined();
  });

  it('excludes a blocklist-tripping moment from the built index', () => {
    const docs = buildClownDocs();
    expect(docs.find((d) => d.id === 'moment:blocked-moment')).toBeUndefined();
    expect(docs.find((d) => d.id === 'moment:clean-moment')).toBeDefined();
  });

  it('excludes a blocklist-tripping theory from the built index', () => {
    const docs = buildClownDocs();
    expect(docs.find((d) => d.id === 'theory:lover:blocked-theory')).toBeUndefined();
    expect(docs.find((d) => d.id === 'theory:lover:pending-theory')).toBeDefined();
  });

  it('excludes a rumor whose own text trips the blocklist, even when its parent moment is clean', () => {
    const docs = buildClownDocs();
    expect(docs.find((d) => d.id === 'rumor:moment-with-blocked-rumor:0')).toBeUndefined();
    expect(docs.find((d) => d.id === 'moment:moment-with-blocked-rumor')).toBeDefined();
    expect(docs.find((d) => d.id === 'rumor:moment-with-rumor:0')).toBeDefined();
  });

  it('excludes every rumor attached to a blocked moment, even a rumor whose own text is clean', () => {
    const docs = buildClownDocs();
    expect(docs.find((d) => d.id === 'moment:blocked-moment-with-rumor')).toBeUndefined();
    expect(docs.find((d) => d.id === 'rumor:blocked-moment-with-rumor:0')).toBeUndefined();
  });

  it('marks open/closed correctly across corpora', () => {
    const docs = buildClownDocs();
    const pendingTheory = docs.find((d) => d.id === 'theory:lover:pending-theory');
    const confirmedTheory = docs.find((d) => d.id === 'theory:lover:confirmed-theory');
    const reportedLore = docs.find((d) => d.id === 'lore:clean-lore');
    const confirmedLore = docs.find((d) => d.id === 'lore:confirmed-lore');
    const rumorDoc = docs.find((d) => d.id === 'rumor:moment-with-rumor:0');
    const momentDoc = docs.find((d) => d.id === 'moment:clean-moment');

    expect(pendingTheory?.open).toBe(true);
    expect(confirmedTheory?.open).toBe(false);
    expect(reportedLore?.open).toBe(true);
    expect(confirmedLore?.open).toBe(false);
    expect(rumorDoc?.open).toBe(true);
    expect(momentDoc?.open).toBe(false);
  });

  it('memoises via allClownDocs() until resetClownDocCache()', () => {
    const first = allClownDocs();
    const second = allClownDocs();
    expect(second).toBe(first);
    resetClownDocCache();
    const third = allClownDocs();
    expect(third).not.toBe(first);
    expect(third).toEqual(first);
  });
});
