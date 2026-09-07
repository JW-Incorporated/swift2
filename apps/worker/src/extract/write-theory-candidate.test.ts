import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { theoryCandidatePassesScreen, upsertTheoryCandidate } from './write-theory-candidate';
import type { ExtractedFanTheory } from './theory-types';

/** Same minimal thenable query-builder stub as write-knowledge.test.ts. */
function chain(result: { data?: unknown; error?: unknown }) {
  const obj: Record<string, unknown> = {
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  for (const method of ['insert', 'select', 'single', 'maybeSingle', 'eq', 'update']) {
    obj[method] = () => obj;
  }
  return obj;
}

function fakeDb(fromImpl: (table: string) => unknown) {
  return { from: vi.fn(fromImpl) } as unknown as SupabaseClient;
}

const baseTheory: ExtractedFanTheory = {
  name: 'Vault Track Countdown',
  claim: 'Fans believe the countdown clock predicts a new vault track drop.',
  theoryKey: 'vault-track-countdown',
  symbols: ['13'],
  stance: 'believed',
};

describe('theoryCandidatePassesScreen', () => {
  it('passes an ordinary theory', () => {
    expect(theoryCandidatePassesScreen(baseTheory)).toBe(true);
  });

  it('fails a theory that trips the redline screen', () => {
    expect(
      theoryCandidatePassesScreen({
        ...baseTheory,
        name: 'Where does she live',
        claim: 'Fans think they found her home address.',
      }),
    ).toBe(false);
  });

  it('screens evidenceSummary too, not just name/claim', () => {
    expect(
      theoryCandidatePassesScreen({
        ...baseTheory,
        evidenceSummary: 'Fans speculate she is pregnant based on a photo.',
      }),
    ).toBe(false);
  });
});

describe('upsertTheoryCandidate', () => {
  it('returns null for a theory that fails the screen — never inserts', async () => {
    const db = fakeDb(() => {
      throw new Error('must not touch the db for a screened-out theory');
    });
    const result = await upsertTheoryCandidate(
      db,
      { ...baseTheory, claim: 'is she pregnant, fans wonder' },
      {
        community: 'TaylorSwift',
        score: 5,
        today: '2026-09-06',
      },
    );
    expect(result).toBeNull();
  });

  it('inserts a new candidate when no existing row matches theory_key', async () => {
    let insertedRow: Record<string, unknown> | undefined;
    const db = fakeDb((table) => {
      expect(table).toBe('fan_theory_candidate');
      const c = chain({ data: null, error: null }) as Record<string, unknown>;
      c.maybeSingle = () => Promise.resolve({ data: null, error: null });
      c.insert = (row: Record<string, unknown>) => {
        insertedRow = row;
        return chain({ data: { id: 'cand-1' }, error: null });
      };
      return c;
    });
    const result = await upsertTheoryCandidate(db, baseTheory, {
      community: 'TaylorSwift',
      permalink: 'https://www.reddit.com/r/TaylorSwift/comments/abc/x/',
      score: 5,
      today: '2026-09-06',
    });
    expect(result).toEqual({ id: 'cand-1', created: true });
    expect(insertedRow?.redline_ok).toBe(true);
    expect(insertedRow?.theory_key).toBe('vault-track-countdown');
    expect(insertedRow?.communities).toEqual(['TaylorSwift']);
    expect(insertedRow?.sample_urls).toEqual([
      'https://www.reddit.com/r/TaylorSwift/comments/abc/x/',
    ]);
  });

  it('bumps an existing candidate instead of inserting a duplicate', async () => {
    let updatedRow: Record<string, unknown> | undefined;
    const db = fakeDb((table) => {
      expect(table).toBe('fan_theory_candidate');
      const c = chain({ data: null, error: null }) as Record<string, unknown>;
      c.maybeSingle = () =>
        Promise.resolve({
          data: {
            id: 'cand-existing',
            mention_count: 3,
            peak_score: 10,
            communities: ['TaylorSwift'],
            sample_urls: ['https://old-url'],
          },
          error: null,
        });
      c.update = (row: Record<string, unknown>) => {
        updatedRow = row;
        return chain({ error: null });
      };
      return c;
    });
    const result = await upsertTheoryCandidate(db, baseTheory, {
      community: 'SwiftlyNeutral',
      permalink: 'https://new-url',
      score: 20,
      today: '2026-09-07',
    });
    expect(result).toEqual({ id: 'cand-existing', created: false });
    expect(updatedRow?.mention_count).toBe(4);
    expect(updatedRow?.peak_score).toBe(20); // max(10, 20)
    expect(updatedRow?.communities).toEqual(['TaylorSwift', 'SwiftlyNeutral']);
    expect(updatedRow?.sample_urls).toEqual(['https://old-url', 'https://new-url']);
  });

  it('does not duplicate a community or sample_url already recorded', async () => {
    let updatedRow: Record<string, unknown> | undefined;
    const db = fakeDb(() => {
      const c = chain({ data: null, error: null }) as Record<string, unknown>;
      c.maybeSingle = () =>
        Promise.resolve({
          data: {
            id: 'cand-existing',
            mention_count: 1,
            peak_score: 5,
            communities: ['TaylorSwift'],
            sample_urls: ['https://same-url'],
          },
          error: null,
        });
      c.update = (row: Record<string, unknown>) => {
        updatedRow = row;
        return chain({ error: null });
      };
      return c;
    });
    await upsertTheoryCandidate(db, baseTheory, {
      community: 'TaylorSwift',
      permalink: 'https://same-url',
      score: 1,
      today: '2026-09-07',
    });
    expect(updatedRow?.communities).toEqual(['TaylorSwift']);
    expect(updatedRow?.sample_urls).toEqual(['https://same-url']);
  });

  it('caps sample_urls at 3', async () => {
    let updatedRow: Record<string, unknown> | undefined;
    const db = fakeDb(() => {
      const c = chain({ data: null, error: null }) as Record<string, unknown>;
      c.maybeSingle = () =>
        Promise.resolve({
          data: {
            id: 'cand-existing',
            mention_count: 1,
            peak_score: 5,
            communities: ['TaylorSwift'],
            sample_urls: ['u1', 'u2', 'u3'],
          },
          error: null,
        });
      c.update = (row: Record<string, unknown>) => {
        updatedRow = row;
        return chain({ error: null });
      };
      return c;
    });
    await upsertTheoryCandidate(db, baseTheory, {
      community: 'TaylorSwift',
      permalink: 'u4',
      score: 1,
      today: '2026-09-07',
    });
    expect(updatedRow?.sample_urls).toEqual(['u1', 'u2', 'u3']);
  });

  it('throws on an insert failure', async () => {
    const db = fakeDb(() => {
      const c = chain({ data: null, error: null }) as Record<string, unknown>;
      c.maybeSingle = () => Promise.resolve({ data: null, error: null });
      c.insert = () => chain({ data: null, error: { message: 'boom' } });
      return c;
    });
    await expect(
      upsertTheoryCandidate(db, baseTheory, {
        community: 'TaylorSwift',
        score: 1,
        today: '2026-09-07',
      }),
    ).rejects.toThrow('fan_theory_candidate insert failed');
  });
});
