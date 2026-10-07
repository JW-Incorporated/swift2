import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildDraftPatch,
  countNewLeads,
  lintReply,
  lintWhy,
  parseDrafts,
  applyDrafts,
  MAX_DRAFT_ENTRIES,
  pickForDrafting,
} from './awareness-draft.mjs';

const catalog = {
  eras: [{ id: 'folklore', name: 'folklore' }],
  moments: [{ id: 'vault-folklore-x', eraId: 'folklore', title: 'x' }],
};

describe('reply lint (no link, no pitch)', () => {
  it('accepts a short, human, on-topic reply', () => {
    expect(lintReply('folklore at number one and I will not be taking questions')).toEqual([]);
  });

  it.each([
    ['a link', 'see https://example.com for more'],
    ['a bare domain', 'it is on longlivets.com now'],
    ['the site name', 'longlive has this'],
    ['a pitch', 'you should check it out'],
    ['an own-site phrase', 'my site has the timeline'],
    ['a hashtag', 'best era #folklore'],
    ['an em dash', 'best era — hands down'],
    ['an AI tell', 'Great question, folklore it is'],
  ])('rejects %s', (_name, text) => {
    expect(lintReply(text).length).toBeGreaterThan(0);
  });

  it('rejects empty and over-long replies', () => {
    expect(lintReply('')).toHaveLength(1);
    expect(lintReply('word '.repeat(80)).join(' ')).toMatch(/max 300/);
  });

  it('wants a one-line why of sensible length', () => {
    expect(lintWhy('Era ranking, so a card fits')).toEqual([]);
    expect(lintWhy('')).toHaveLength(1);
  });
});

describe('draft patch', () => {
  const good = {
    draft: 'folklore, no contest',
    why: 'Era ranking thread, so a card fits',
    imageRef: undefined,
    current: 'era:folklore',
  };

  it('returns a drafted patch with link_included=false and a validated image ref', () => {
    expect(buildDraftPatch(good, catalog)).toEqual({
      patch: {
        draft: 'folklore, no contest',
        why: 'Era ranking thread, so a card fits',
        image_ref: 'era:folklore',
        link_included: false,
        status: 'drafted',
      },
    });
  });

  it('lets the routine pick another valid card but rejects an id outside the catalogue', () => {
    expect(
      buildDraftPatch({ ...good, imageRef: 'moment:vault-folklore-x' }, catalog).patch?.image_ref,
    ).toBe('moment:vault-folklore-x');
    const bad = buildDraftPatch({ ...good, imageRef: 'moment:invented' }, catalog);
    expect(bad.patch).toBeUndefined();
    expect(bad.problems.join(' ')).toMatch(/not in the catalogue/);
  });

  it('reports every lint problem together', () => {
    const result = buildDraftPatch({ ...good, draft: 'visit https://x.test', why: '' }, catalog);
    expect(result.problems.length).toBeGreaterThanOrEqual(2);
  });
});

describe('pickForDrafting', () => {
  it('limits per sub and in total, lower tier first', () => {
    const tiers = new Map([
      ['A', { tier: 1 }],
      ['B', { tier: 3 }],
    ]);
    const leads = [
      ...[1, 2, 3, 4].map((n) => ({
        id: `a${n}`,
        community: 'A',
        created_at: `2026-10-01T0${n}:00Z`,
      })),
      { id: 'b1', community: 'B', created_at: '2026-10-01T00:00:00Z' },
    ];
    const picked = pickForDrafting(leads, tiers, { limit: 8, perSub: 3 });
    expect(picked.map((l: { id: string }) => l.id)).toEqual(['a1', 'a2', 'a3', 'b1']);
    expect(pickForDrafting(leads, tiers, { limit: 2, perSub: 3 })).toHaveLength(2);
  });
});

describe('countNewLeads (the routine gate)', () => {
  it('returns the number of waiting awareness leads, and 0 on a query error', async () => {
    const chain = (result: unknown) => {
      const b: Record<string, unknown> = {
        select: () => b,
        eq: () => b,
        gte: () => Promise.resolve(result),
      };
      return b;
    };
    expect(await countNewLeads({ from: () => chain({ count: 4, error: null }) })).toBe(4);
    expect(await countNewLeads({ from: () => chain({ count: null, error: null }) })).toBe(0);
    expect(await countNewLeads({ from: () => chain({ count: 9, error: { message: 'x' } }) })).toBe(
      0,
    );
  });
});

describe('parseDrafts (untrusted LLM output)', () => {
  it('keeps only well-formed entries, drops unknown fields, and caps the list', () => {
    const entries = parseDrafts(
      JSON.stringify([
        { id: 'a', action: 'draft', draft: 'x', why: 'y', image_ref: 'era:folklore', evil: 'drop' },
        { id: 'b', action: 'skip' },
        { id: 'c', action: 'delete' },
        { action: 'draft' },
        'nope',
        ...Array.from({ length: 30 }, (_, i) => ({ id: `n${i}`, action: 'skip' })),
      ]),
    );
    expect(entries).toHaveLength(MAX_DRAFT_ENTRIES);
    expect(entries[0]).toEqual({
      id: 'a',
      action: 'draft',
      draft: 'x',
      why: 'y',
      image_ref: 'era:folklore',
    });
    expect(entries.some((e: { id: string }) => e.id === 'c')).toBe(false);
  });

  it('treats malformed JSON as nothing to apply', () => {
    expect(parseDrafts('not json')).toEqual([]);
    expect(parseDrafts('{"drafts": 4}')).toEqual([]);
    expect(parseDrafts(JSON.stringify({ drafts: [{ id: 'a', action: 'skip' }] }))).toHaveLength(1);
  });
});

describe('applyDrafts', () => {
  function fakeDb(waiting: { id: string; image_ref: string }[]) {
    const updates: { patch: unknown; id: string }[] = [];
    const db = {
      from: () => {
        const b: Record<string, unknown> = {
          select: () => b,
          in: () => b,
          eq: (col: string, val: string) => {
            if (col === 'id') updates.push({ patch: b.patch, id: val });
            return b;
          },
          update: (patch: unknown) => {
            b.patch = patch;
            return b;
          },
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: waiting, error: null }).then(resolve),
        };
        return b;
      },
    };
    return { db, updates };
  }

  it('saves valid drafts, applies skips, and rejects bad replies and ids that are not waiting', async () => {
    const { db, updates } = fakeDb([
      { id: 'ok', image_ref: 'era:folklore' },
      { id: 'bad', image_ref: 'era:folklore' },
      { id: 'sk', image_ref: 'era:folklore' },
    ]);
    const result = await applyDrafts(
      db,
      [
        {
          id: 'ok',
          action: 'draft',
          draft: 'folklore, no contest',
          why: 'Era ranking, so a card fits',
        },
        {
          id: 'bad',
          action: 'draft',
          draft: 'see https://x.test now',
          why: 'Era ranking, so a card fits',
        },
        { id: 'sk', action: 'skip', draft: '', why: '' },
        {
          id: 'ghost',
          action: 'draft',
          draft: 'folklore, no contest',
          why: 'Era ranking, so a card fits',
        },
      ],
      catalog,
    );
    expect(result).toMatchObject({ drafted: 1, skipped: 1 });
    expect(result.rejected.map((r: { id: string }) => r.id)).toEqual(['bad', 'ghost']);
    expect(updates.find((u) => u.id === 'ok')?.patch).toMatchObject({
      status: 'drafted',
      link_included: false,
    });
    expect(updates.find((u) => u.id === 'sk')?.patch).toEqual({ status: 'skipped_low_relevance' });
    expect(updates.some((u) => u.id === 'bad' || u.id === 'ghost')).toBe(false);
  });
});
