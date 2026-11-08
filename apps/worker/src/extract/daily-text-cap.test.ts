import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
  countTextPublishedToday, countTier2PublishedToday, DAILY_TEXT_CAP, dailyTextCapHold, TIER2_DAILY_CAP,
  tierCapDecision, tierCapHold, utcDayStart,
} from './daily-text-cap';

interface Row {
  'significance_verdict->>tier'?: string;
  era_id: string;
  redline_ok: boolean;
  merged_into: string | null;
  retracted_at: string | null;
  created_at: string;
}

function fakeDb(rows: Row[]): SupabaseClient {
  const filters: ((row: Row) => boolean)[] = [];
  const query: Record<string, unknown> = {
    then: (resolve: (value: unknown) => void) =>
      resolve({ count: rows.filter((row) => filters.every((f) => f(row))).length, error: null }),
    eq: (column: keyof Row, value: unknown) => (filters.push((row) => row[column] === value), query),
    is: (column: keyof Row, value: unknown) => (filters.push((row) => row[column] === value), query),
    gte: (column: keyof Row, value: string) => (filters.push((row) => String(row[column]) >= value), query),
  };
  return { from: () => ({ select: () => query }) } as unknown as SupabaseClient;
}

const NOW = new Date('2026-11-04T15:30:00.000Z');
const FACTS = [{ id: 'f1', claim: 'A claim.', attribution: 'People', confidence: 'reported' as const }];

function published(count: number, overrides: Partial<Row> = {}): Row[] {
  return Array.from({ length: count }, () => ({
    era_id: 'tloas',
    redline_ok: true,
    merged_into: null,
    retracted_at: null,
    created_at: '2026-11-04T08:00:00.000Z',
    ...overrides,
  }));
}

describe('daily text cap', () => {
  it('lets the 6th item through and holds the 7th', async () => {
    expect(DAILY_TEXT_CAP).toBe(6);
    expect(await dailyTextCapHold(fakeDb(published(5)), 'tloas', FACTS, NOW)).toBeUndefined();
    expect(await dailyTextCapHold(fakeDb(published(6)), 'tloas', FACTS, NOW)).toEqual({
      facts: FACTS,
      holdReason: 'daily_text_cap',
    });
  });

  it('resets on a new UTC day', async () => {
    const yesterday = published(6, { created_at: '2026-11-03T23:59:59.000Z' });
    expect(await countTextPublishedToday(fakeDb(yesterday), 'tloas', NOW)).toBe(0);
    expect(await dailyTextCapHold(fakeDb(yesterday), 'tloas', FACTS, NOW)).toBeUndefined();
    expect(await dailyTextCapHold(fakeDb(yesterday), 'tloas', FACTS, new Date('2026-11-03T23:59:59.500Z'))).toBeDefined();
    expect(utcDayStart(NOW)).toBe('2026-11-04T00:00:00.000Z');
  });

  it('does not count other eras, held, merged or retracted rows', async () => {
    const rows = [
      ...published(6, { era_id: 'midnights' }),
      ...published(2, { redline_ok: false }),
      ...published(2, { merged_into: 'x' }),
      ...published(2, { retracted_at: '2026-11-04T09:00:00.000Z' }),
      ...published(3),
    ];
    expect(await countTextPublishedToday(fakeDb(rows), 'tloas', NOW)).toBe(3);
    expect(await dailyTextCapHold(fakeDb(rows), 'tloas', FACTS, NOW)).toBeUndefined();
    expect(await dailyTextCapHold(fakeDb(rows), 'midnights', FACTS, NOW)).toBeDefined();
  });
});

describe('tier-aware cap', () => {
  it('never caps tier 1', () => {
    expect(tierCapDecision(1, 0)).toEqual({ publish: true });
    expect(tierCapDecision(1, 99)).toEqual({ publish: true });
  });

  it('lets the 4th tier 2 item through and holds the 5th', () => {
    expect(tierCapDecision(2, TIER2_DAILY_CAP - 1)).toEqual({ publish: true });
    expect(tierCapDecision(2, TIER2_DAILY_CAP)).toEqual({ publish: false, reason: 'daily_tier2_cap' });
  });

  it('never publishes tier 3', () => {
    expect(tierCapDecision(3, 0)).toEqual({ publish: false, reason: 'not_notable:tier3' });
  });
});

describe('tierCapHold', () => {
  const tiered = (tiers: (number | undefined)[]) => tiers.map((tier) => ({
    ...published(1)[0]!,
    'significance_verdict->>tier': tier === undefined ? undefined : String(tier),
  }));

  it('publishes tier 1 after 6 text posts', async () => {
    const rows = tiered([2, 2, 2, 2, 1, undefined]);
    expect(await tierCapHold(fakeDb(rows as Row[]), 'tloas', FACTS, 1, NOW)).toBeUndefined();
  });

  it('counts only tier-2 rows toward the tier-2 cap', async () => {
    const three = tiered([2, 2, 2, 1, 1, undefined]);
    expect(await countTier2PublishedToday(fakeDb(three as Row[]), 'tloas', NOW)).toBe(3);
    expect(await tierCapHold(fakeDb(three as Row[]), 'tloas', FACTS, 2, NOW)).toBeUndefined();
    const four = tiered([2, 2, 2, 2]);
    expect(await tierCapHold(fakeDb(four as Row[]), 'tloas', FACTS, 2, NOW)).toEqual({
      facts: FACTS,
      holdReason: 'daily_tier2_cap',
    });
  });

  it('holds tier 3 regardless of count', async () => {
    expect(await tierCapHold(fakeDb([]), 'tloas', FACTS, 3, NOW)).toEqual({ facts: FACTS, holdReason: 'not_notable:tier3' });
  });

  it('falls back to counting every published item when the column is missing', async () => {
    const errorQuery: Record<string, unknown> = {
      then: (resolve: (value: unknown) => void) => resolve({
        count: null,
        error: { code: '42703', message: 'column current_item.significance_verdict does not exist' },
      }),
    };
    for (const method of ['eq', 'is', 'gte']) errorQuery[method] = () => errorQuery;
    let calls = 0;
    const db = {
      from: () => ({
        select: () => {
          calls++;
          if (calls === 1) return errorQuery;
          const ok: Record<string, unknown> = { then: (resolve: (value: unknown) => void) => resolve({ count: 5, error: null }) };
          for (const method of ['eq', 'is', 'gte']) ok[method] = () => ok;
          return ok;
        },
      }),
    } as unknown as SupabaseClient;
    expect(await countTier2PublishedToday(db, 'tloas', NOW)).toBe(5);
  });
});
