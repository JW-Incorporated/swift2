import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dateMath } from './date-math';
import {
  getChatter,
  getPrecedents,
  getRecentItems,
  getSymbolActivity,
  getTrack,
  searchKnowledgeDocs,
} from './client';
import type { CurrentItemRow, EggLedgerRow, FanSignalRow, KnowledgeDocRow, SymbolActivityRow } from '../current-map';

/**
 * A minimal, REAL in-memory query builder over fixture rows — not a canned
 * result stub. `.eq`/`.is`/`.gte`/`.contains`/`.overlaps`/`.ilike`/
 * `.textSearch`/`.order`/`.limit` all actually filter/sort the fixture array
 * each test seeds `fakeDb()` with, so a test asserting on the returned rows
 * is asserting on real filtering behavior, the same contract the real
 * PostgREST query would apply. Matches the `db: SupabaseClient` injection
 * convention `apps/worker/src/extract/write-knowledge.test.ts` already uses.
 */
function makeQueryBuilder(rows: unknown[]) {
  let result = [...rows] as Record<string, unknown>[];
  const builder = {
    select: () => builder,
    eq: (col: string, val: unknown) => {
      result = result.filter((r) => r[col] === val);
      return builder;
    },
    is: (col: string, val: unknown) => {
      result = result.filter((r) => (val === null ? r[col] === null || r[col] === undefined : r[col] === val));
      return builder;
    },
    gte: (col: string, val: unknown) => {
      result = result.filter((r) => String(r[col]) >= String(val));
      return builder;
    },
    contains: (col: string, val: unknown[]) => {
      result = result.filter(
        (r) => Array.isArray(r[col]) && val.every((v) => (r[col] as unknown[]).includes(v)),
      );
      return builder;
    },
    overlaps: (col: string, val: unknown[]) => {
      result = result.filter(
        (r) => Array.isArray(r[col]) && (r[col] as unknown[]).some((v) => val.includes(v)),
      );
      return builder;
    },
    ilike: (col: string, pattern: string) => {
      const re = new RegExp(`^${pattern.split('%').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`, 'i');
      result = result.filter((r) => typeof r[col] === 'string' && re.test(r[col] as string));
      return builder;
    },
    textSearch: (_col: string, query: string) => {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((r) => {
        const hay = `${String(r['title'] ?? '')} ${String(r['text'] ?? '')}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
      return builder;
    },
    order: (col: string, opts?: { ascending?: boolean }) => {
      const asc = opts?.ascending !== false;
      result = [...result].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (asc ? 1 : -1);
      });
      return builder;
    },
    limit: (n: number) => {
      result = result.slice(0, n);
      return builder;
    },
    then: (resolve: (r: { data: Record<string, unknown>[]; error: null }) => void) =>
      resolve({ data: result, error: null }),
  };
  return builder;
}

function fakeDb(tables: Record<string, unknown[]>): SupabaseClient {
  return { from: (table: string) => makeQueryBuilder(tables[table] ?? []) } as unknown as SupabaseClient;
}

/** Simulates the DB-unreachable case (network error, RLS denial, etc.) —
 * every chain method is a no-op, resolving with a PostgREST-shaped error.
 * A caller (e.g. the future Stage 10 chat route) catches this and falls
 * back to `clown-index.ts`'s compile-time corpus; this layer's contract is
 * simply to surface the failure loudly rather than silently return `[]`. */
function errorDb(message = 'network unreachable'): SupabaseClient {
  const builder: Record<string, unknown> = {
    then: (resolve: (r: { data: null; error: { message: string } }) => void) =>
      resolve({ data: null, error: { message } }),
  };
  for (const method of ['select', 'eq', 'is', 'gte', 'contains', 'overlaps', 'ilike', 'textSearch', 'order', 'limit']) {
    builder[method] = () => builder;
  }
  return { from: () => builder } as unknown as SupabaseClient;
}

function knowledgeDocRow(overrides: Partial<KnowledgeDocRow>): KnowledgeDocRow {
  return {
    id: 'moment:x',
    kind: 'moment',
    tier: 'vault',
    title: 'Untitled',
    text: '',
    date: null,
    recency_date: null,
    open: false,
    status: 'confirmed',
    source_tier: 'established',
    sources: [],
    era_id: null,
    symbols: [],
    entities: [],
    expires_at: null,
    redline_ok: true,
    ...overrides,
  };
}

describe('searchKnowledgeDocs', () => {
  const docs = [
    {
      ...knowledgeDocRow({
        id: 'moment:1',
        title: 'Track 5 mystery',
        text: 'Fans noticed a pattern with track five placements across albums.',
        era_id: 'tloas',
        symbols: ['5'],
      }),
      updated_at: '2026-08-20T00:00:00.000Z',
    },
    {
      ...knowledgeDocRow({
        id: 'current:1',
        tier: 'current',
        title: 'New single teased',
        text: 'A teaser dropped on Instagram hinting at a new single.',
        era_id: 'tloas',
        symbols: ['13'],
      }),
      updated_at: '2026-08-23T00:00:00.000Z',
    },
    {
      ...knowledgeDocRow({
        id: 'moment:2',
        title: 'Wardrobe callback',
        text: 'She wore the same jacket from an old era.',
        era_id: 'other-era',
        symbols: ['jacket'],
      }),
      updated_at: '2026-08-01T00:00:00.000Z',
    },
  ];

  it('matches a plain-text query against title+text', async () => {
    const db = fakeDb({ knowledge_doc: docs });
    const result = await searchKnowledgeDocs(db, 'teaser');
    expect(result.map((d) => d.id)).toEqual(['current:1']);
  });

  it('filters by tier with a blank query', async () => {
    const db = fakeDb({ knowledge_doc: docs });
    const result = await searchKnowledgeDocs(db, '', { tier: 'vault' });
    expect(result.map((d) => d.id).sort()).toEqual(['moment:1', 'moment:2']);
  });

  it('filters by eraId', async () => {
    const db = fakeDb({ knowledge_doc: docs });
    const result = await searchKnowledgeDocs(db, '', { eraId: 'tloas' });
    expect(result.map((d) => d.id).sort()).toEqual(['current:1', 'moment:1']);
  });

  it('filters by symbol overlap', async () => {
    const db = fakeDb({ knowledge_doc: docs });
    const result = await searchKnowledgeDocs(db, '', { symbols: ['13'] });
    expect(result.map((d) => d.id)).toEqual(['current:1']);
  });
});

describe('getPrecedents', () => {
  function eggRow(overrides: Partial<EggLedgerRow>): EggLedgerRow {
    return {
      id: 'egg:x',
      hint_doc_id: null,
      reveal_doc_id: null,
      hint_date: '2026-01-01',
      reveal_date: null,
      lag_days: null,
      mechanism: 'other',
      symbols: [],
      era_id: 'tloas',
      confirmed: true,
      outcome: 'confirmed',
      summary: 'summary',
      sources: [],
      ...overrides,
    };
  }
  const eggs = [
    eggRow({ id: 'egg:a', hint_date: '2026-01-01', mechanism: 'wardrobe', symbols: ['13', 'jacket'] }),
    eggRow({ id: 'egg:b', hint_date: '2026-02-01', mechanism: 'number', symbols: ['13'] }),
    eggRow({ id: 'egg:c', hint_date: '2026-03-01', mechanism: 'wardrobe', symbols: ['13'] }),
  ];

  it('groups precedents touching a symbol by mechanism, not technique', async () => {
    const db = fakeDb({ egg_ledger: eggs });
    const result = await getPrecedents(db, '13');
    expect(result.map((g) => g.mechanism)).toEqual(['wardrobe', 'number']);
    expect(result[0]?.entries.map((e) => e.id)).toEqual(['egg:c', 'egg:a']); // newest hint_date first within a bucket
    expect(result[1]?.entries.map((e) => e.id)).toEqual(['egg:b']);
  });

  it('degrades to a single bucket for a symbol touching only one mechanism', async () => {
    const db = fakeDb({ egg_ledger: eggs });
    const result = await getPrecedents(db, 'jacket');
    expect(result).toEqual([{ mechanism: 'wardrobe', entries: [expect.objectContaining({ id: 'egg:a' })] }]);
  });

  it('returns an empty array for a symbol with no precedents (technique-table-empty-safe)', async () => {
    const db = fakeDb({ egg_ledger: eggs });
    const result = await getPrecedents(db, 'nonexistent');
    expect(result).toEqual([]);
  });
});

describe('getRecentItems', () => {
  const dm = dateMath();
  function itemRow(overrides: Partial<CurrentItemRow>): CurrentItemRow {
    return {
      id: 'ci:x',
      story_id: null,
      observed_on: dm.today(),
      era_id: 'tloas',
      category: 'sighting',
      tags: [],
      headline: 'H',
      summary: 'S',
      detail: 'D',
      status: 'reported',
      confidence: 'reputable_reporting',
      source_tier: 'established',
      sources: [],
      location_level: null,
      image_url: null,
      social_post: null,
      symbols: [],
      entities: [],
      heat: 1,
      promoted_to: null,
      last_checked_on: dm.today(),
      expires_at: '2099-01-01T00:00:00.000Z',
      updated_at: '2026-08-23T00:00:00.000Z',
      redline_ok: true,
      ...overrides,
    };
  }
  const items = [
    itemRow({ id: 'ci:1', observed_on: dm.daysAgo(1) }),
    itemRow({ id: 'ci:2', observed_on: dm.daysAgo(5) }),
    itemRow({ id: 'ci:3', observed_on: dm.daysAgo(10) }), // outside the 7-day window
    itemRow({ id: 'ci:4', observed_on: dm.daysAgo(2), redline_ok: false }), // screened out
    itemRow({ id: 'ci:5', observed_on: dm.daysAgo(3), promoted_to: 'moment:xyz' }), // already promoted
  ];

  it('returns only redline_ok, unpromoted items within the last N days, newest first', async () => {
    const db = fakeDb({ current_item: items });
    const result = await getRecentItems(db, 7);
    expect(result.map((r) => r.id)).toEqual(['ci:1', 'ci:2']);
  });
});

describe('getChatter', () => {
  function signalRow(overrides: Partial<FanSignalRow>): FanSignalRow {
    return {
      id: 'fs:x',
      window_start: '2026-08-20T00:00:00.000Z',
      window_end: '2026-08-21T00:00:00.000Z',
      platform: 'bluesky',
      community: 'bluesky:general',
      topic: 'topic',
      summary: 'summary',
      volume: 1,
      heat: 1,
      stance_mix: {},
      symbols: [],
      theory_ids: [],
      current_item_ids: [],
      sample_urls: [],
      expires_at: '2099-01-01T00:00:00.000Z',
      redline_ok: true,
      ...overrides,
    };
  }
  const signals = [
    signalRow({ id: 'fs1', topic: 'a popular thread about the setlist', symbols: ['setlist'], heat: 3.1 }),
    signalRow({ id: 'fs2', topic: 'random other topic', symbols: ['13'], heat: 5.0 }),
    signalRow({ id: 'fs3', topic: 'another setlist thread heating up', symbols: [], heat: 1.2 }),
  ];

  it('merges topic-text and symbol-overlap matches, deduped, heat-ordered', async () => {
    const db = fakeDb({ fan_signal: signals });
    const result = await getChatter(db, 'setlist');
    expect(result.map((r) => r.id)).toEqual(['fs1', 'fs3']);
  });

  it('returns an empty array when nothing matches', async () => {
    const db = fakeDb({ fan_signal: signals });
    const result = await getChatter(db, 'nonexistent-topic');
    expect(result).toEqual([]);
  });
});

describe('getSymbolActivity', () => {
  const rows: SymbolActivityRow[] = [
    { symbol: '13', week: '2026-08-17', n: 5 },
    { symbol: '13', week: '2026-08-10', n: 2 },
    { symbol: '22', week: '2026-08-17', n: 9 },
  ];

  it('returns weekly counts for the given symbol, newest week first', async () => {
    const db = fakeDb({ symbol_activity: rows });
    const result = await getSymbolActivity(db, '13');
    expect(result).toEqual([
      { symbol: '13', week: '2026-08-17', n: 5 },
      { symbol: '13', week: '2026-08-10', n: 2 },
    ]);
  });
});

describe('getTrack', () => {
  const docs = [
    knowledgeDocRow({ id: 'track:tloas:cardigan', kind: 'track', tier: 'vault', title: 'Cardigan' }),
    knowledgeDocRow({ id: 'track:folklore:august', kind: 'track', tier: 'vault', title: 'August' }),
    knowledgeDocRow({ id: 'moment:cardigan-story', kind: 'moment', tier: 'vault', title: 'Cardigan' }),
  ];

  it('finds a track by title, case-insensitive, kind/tier-filtered', async () => {
    const db = fakeDb({ knowledge_doc: docs });
    const result = await getTrack(db, 'cardigan');
    expect(result?.id).toBe('track:tloas:cardigan');
  });

  it('returns null when no track matches', async () => {
    const db = fakeDb({ knowledge_doc: docs });
    const result = await getTrack(db, 'nonexistent track');
    expect(result).toBeNull();
  });
});

describe('DB-unreachable fallback path', () => {
  it('search surfaces a query error rather than returning an empty result silently', async () => {
    await expect(searchKnowledgeDocs(errorDb(), 'anything')).rejects.toThrow(/search:.*network unreachable/);
  });

  it('precedents surfaces a query error', async () => {
    await expect(getPrecedents(errorDb(), '13')).rejects.toThrow(/precedents:.*network unreachable/);
  });

  it('recent surfaces a query error', async () => {
    await expect(getRecentItems(errorDb(), 7)).rejects.toThrow(/recent:.*network unreachable/);
  });

  it('chatter surfaces a query error', async () => {
    await expect(getChatter(errorDb(), 'topic')).rejects.toThrow(/chatter/);
  });

  it('symbolActivity surfaces a query error', async () => {
    await expect(getSymbolActivity(errorDb(), '13')).rejects.toThrow(/symbolActivity:.*network unreachable/);
  });

  it('track surfaces a query error', async () => {
    await expect(getTrack(errorDb(), 'cardigan')).rejects.toThrow(/track:.*network unreachable/);
  });
});
