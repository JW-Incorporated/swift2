import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const emit = vi.hoisted(() => vi.fn());
vi.mock('./write-knowledge', () => ({ emitEasterEggEvent: emit }));

import { reresolveHeldTheoryImages } from './held-theory-image-pass';

type Row = Record<string, unknown>;

function fakeDb(theories: Row[], items: Row[]) {
  const theoryUpdates: { patch: Row; id: unknown }[] = [];
  const docUpdates: { patch: Row; id: unknown }[] = [];
  const db = {
    from: (table: string) => {
      if (table === 'live_theory') {
        return {
          select: () => {
            const q: Record<string, unknown> = {};
            for (const m of ['is', 'eq', 'neq', 'gt', 'not', 'order']) q[m] = () => q;
            q.range = (from: number, to: number) =>
              Promise.resolve({ data: theories.slice(from, to + 1), error: null });
            return q;
          },
          update: (patch: Row) => {
            const c: Record<string, unknown> = {};
            c.eq = (_col: string, id: unknown) => {
              theoryUpdates.push({ patch, id });
              return c;
            };
            c.is = () => c;
            c.then = (resolve: (v: unknown) => void) => resolve({ error: null });
            return c;
          },
        };
      }
      if (table === 'current_item') {
        return {
          select: () => {
            const q: Record<string, unknown> = {};
            q.in = () => q;
            q.eq = () => q;
            q.is = () => Promise.resolve({ data: items, error: null });
            return q;
          },
        };
      }
      if (table === 'knowledge_doc') {
        return {
          update: (patch: Row) => ({
            eq: (_c: string, id: unknown) => {
              docUpdates.push({ patch, id });
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient;
  return { db, theoryUpdates, docUpdates };
}

describe('reresolveHeldTheoryImages', () => {
  beforeEach(() => emit.mockReset());

  it('adopts the first cited current_item image that passes and un-hides the theory', async () => {
    const { db, theoryUpdates, docUpdates } = fakeDb(
      [{ id: 't1', name: 'T One', claim: 'c', evidence_ids: ['current:bad', 'current:good'] }],
      [
        { id: 'bad', image_url: 'https://evil.example.com/a.jpg' },
        { id: 'good', image_url: 'https://www.people.com/photo.jpg' },
      ],
    );
    const result = await reresolveHeldTheoryImages(db);
    expect(result).toEqual({ checked: 1, published: 1, errors: [] });
    expect(theoryUpdates[0]).toEqual({
      id: 't1',
      patch: { image_url: 'https://www.people.com/photo.jpg', quality_hold_reason: null },
    });
    expect(docUpdates[0]).toEqual({ id: 'ltheory:t1', patch: { redline_ok: true } });
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(db, 't1', expect.objectContaining({ name: 'T One', claim: 'c' }));
  });

  it('leaves a theory hidden when it has no evidence or no evidence image passes', async () => {
    const { db, theoryUpdates } = fakeDb(
      [
        { id: 'legacy', name: 'L', claim: 'c', evidence_ids: [] },
        { id: 'offlist', name: 'O', claim: 'c', evidence_ids: ['current:bad'] },
      ],
      [{ id: 'bad', image_url: 'https://evil.example.com/a.jpg' }],
    );
    const result = await reresolveHeldTheoryImages(db);
    expect(result).toEqual({ checked: 1, published: 0, errors: [] });
    expect(theoryUpdates).toHaveLength(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it('still adopts an adoptable theory sitting behind more than 25 unadoptable ones', async () => {
    const unadoptable = Array.from({ length: 30 }, (_, i) => ({
      id: `u${i}`,
      name: 'U',
      claim: 'c',
      evidence_ids: i % 2 ? [] : ['current:bad'],
    }));
    const { db, theoryUpdates } = fakeDb(
      [...unadoptable, { id: 'late', name: 'Late', claim: 'c', evidence_ids: ['current:good'] }],
      [
        { id: 'bad', image_url: 'https://evil.example.com/a.jpg' },
        { id: 'good', image_url: 'https://www.people.com/photo.jpg' },
      ],
    );
    const result = await reresolveHeldTheoryImages(db);
    expect(result.published).toBe(1);
    expect(theoryUpdates.map((u) => u.id)).toEqual(['late']);
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
