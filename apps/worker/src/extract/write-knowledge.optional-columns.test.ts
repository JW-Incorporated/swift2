import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { writeCurrentItem } from './write-knowledge';
import type { ExtractedCurrentItem } from './types';

const ITEM: ExtractedCurrentItem = {
  observedOn: '2026-11-08',
  category: 'tour',
  tags: [],
  headline: 'Taylor announces a new tour date in Toronto',
  summary: 'A summary that is long enough to look like prose for the legacy floor check here.',
  detail: 'A detail. '.repeat(30),
  symbols: [],
  entities: [],
  statusHint: 'reported',
};
const EMBED = { provider: 'youtube', videoId: 'abc123def45' } as never;
const VERDICT = { tier: 2 as const, reason: 'r', model: 'm', at: '2026-11-08T00:00:00.000Z' };

function fakeDb(missing: string[]) {
  const attempts: Record<string, unknown>[] = [];
  const db = {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        attempts.push(row);
        const gone = missing.find((column) => column in row);
        return { select: () => ({ single: async () => gone
          ? { data: null, error: { code: '42703', message: `column "${gone}" of relation "current_item" does not exist` } }
          : { data: { id: 'ci-1' }, error: null } }) };
      },
    }),
  } as unknown as SupabaseClient;
  return { db, attempts };
}

describe('writeCurrentItem optional columns', () => {
  it.each([
    [[], ['embed', 'significance_verdict']],
    [['embed'], ['significance_verdict']],
    [['significance_verdict'], ['embed']],
    [['embed', 'significance_verdict'], []],
  ])('with %j missing writes the row keeping only %j', async (missing, kept) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db, attempts } = fakeDb(missing);
    const written = await writeCurrentItem(db, 's1', 'tloas', ITEM, [], undefined, 'https://x/i.jpg', undefined, EMBED, VERDICT);
    expect(written.id).toBe('ci-1');
    const last = attempts[attempts.length - 1]!;
    expect(Object.keys(last).filter((key) => key === 'embed' || key === 'significance_verdict').sort()).toEqual([...kept].sort());
  });
});
