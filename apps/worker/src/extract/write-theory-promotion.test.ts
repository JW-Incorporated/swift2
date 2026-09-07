import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runTheoryPromotePass } from './write-theory-promotion';
import { PROMOTION_MENTION_THRESHOLD } from './theory-promote';

/** Minimal thenable query-builder stub, same shape as write-theory-
 * candidate.test.ts's `chain()` — extended with `in`/`neq` for this
 * module's extra query shapes. */
function chain(result: { data?: unknown; error?: unknown }) {
  const obj: Record<string, unknown> = {
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  for (const method of ['insert', 'select', 'single', 'maybeSingle', 'eq', 'neq', 'in', 'update']) {
    obj[method] = () => obj;
  }
  return obj;
}

function fakeDb(fromImpl: (table: string) => unknown) {
  return { from: vi.fn(fromImpl) } as unknown as SupabaseClient;
}

const baseCandidateRow = {
  id: 'cand-1',
  claim: 'Fans believe the countdown clock predicts a new vault track.',
  theory_key: 'vault-track-countdown',
  mechanism: 'number',
  symbols: ['13'],
  track_slug: null,
  predicts: null,
  predicted_date: null,
  evidence_summary: null,
  mention_count: PROMOTION_MENTION_THRESHOLD,
  peak_score: 10,
  communities: ['TaylorSwift'],
  stance: 'believed',
  sample_urls: [],
};

describe('runTheoryPromotePass', () => {
  it('returns zeroed counts and touches nothing when there are no candidates', async () => {
    const db = fakeDb((table) => {
      if (table === 'fan_theory_candidate') return chain({ data: [], error: null });
      throw new Error(`unexpected table ${table}`);
    });
    const result = await runTheoryPromotePass(db);
    expect(result.candidatesConsidered).toBe(0);
    expect(result.clustersFormed).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('promotes a qualifying candidate into a fresh live_theory row', async () => {
    let insertedRow: Record<string, unknown> | undefined;
    let acceptedId: string | undefined;
    const db = fakeDb((table) => {
      if (table === 'fan_theory_candidate') {
        const c = chain({ data: [baseCandidateRow], error: null }) as Record<string, unknown>;
        c.update = (row: Record<string, unknown>) => {
          if (row.status === 'accepted') acceptedId = 'called';
          return chain({ error: null });
        };
        return c;
      }
      if (table === 'live_theory') {
        const c = chain({ data: [], error: null }) as Record<string, unknown>;
        c.insert = (row: Record<string, unknown>) => {
          insertedRow = row;
          return chain({ data: { id: 'live-new' }, error: null });
        };
        return c;
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await runTheoryPromotePass(db);
    expect(result.candidatesConsidered).toBe(1);
    expect(result.promoted).toBe(1);
    expect(result.errors).toEqual([]);
    expect(insertedRow?.origin).toBe('fan');
    expect(insertedRow?.persistent).toBe(true);
    expect(acceptedId).toBe('called');
  });

  it('rejects a debunked, threshold-clearing candidate without writing to live_theory', async () => {
    let liveTheoryWriteCalled = false;
    const debunked = { ...baseCandidateRow, stance: 'debunked_by_fans' };
    const db = fakeDb((table) => {
      if (table === 'fan_theory_candidate') return chain({ data: [debunked], error: null });
      if (table === 'live_theory') {
        // Reading existing fan-origin live theories (for match lookup) is
        // expected even on the reject path — only an insert/update WRITE
        // must never happen for a rejected cluster.
        const c = chain({ data: [], error: null }) as Record<string, unknown>;
        c.insert = () => {
          liveTheoryWriteCalled = true;
          return chain({ data: null, error: null });
        };
        c.update = () => {
          liveTheoryWriteCalled = true;
          return chain({ error: null });
        };
        return c;
      }
      throw new Error(`unexpected table ${table}`);
    });
    const result = await runTheoryPromotePass(db);
    expect(result.rejected).toBe(1);
    expect(result.promoted).toBe(0);
    expect(liveTheoryWriteCalled).toBe(false);
  });

  it('holds a candidate below the mention threshold, leaving it status=candidate', async () => {
    const held = { ...baseCandidateRow, mention_count: 1 };
    let updateCalled = false;
    const db = fakeDb((table) => {
      if (table === 'fan_theory_candidate') {
        const c = chain({ data: [held], error: null }) as Record<string, unknown>;
        c.update = () => {
          updateCalled = true;
          return chain({ error: null });
        };
        return c;
      }
      if (table === 'live_theory') return chain({ data: [], error: null });
      throw new Error(`unexpected table ${table}`);
    });
    const result = await runTheoryPromotePass(db);
    expect(result.held).toBe(1);
    expect(updateCalled).toBe(false);
  });

  it('one cluster write failure is recorded in errors and does not abort the run', async () => {
    const a = { ...baseCandidateRow, id: 'a', theory_key: 'a' };
    const b = {
      ...baseCandidateRow,
      id: 'b',
      theory_key: 'b',
      claim: 'Totally different unrelated claim about merch.',
    };
    const db = fakeDb((table) => {
      if (table === 'fan_theory_candidate') {
        const c = chain({ data: [a, b], error: null }) as Record<string, unknown>;
        c.update = () => chain({ error: null });
        return c;
      }
      if (table === 'live_theory') {
        const c = chain({ data: [], error: null }) as Record<string, unknown>;
        c.insert = () => chain({ data: null, error: { message: 'boom' } });
        return c;
      }
      throw new Error(`unexpected table ${table}`);
    });
    const result = await runTheoryPromotePass(db);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('boom');
  });
});
