import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getTopTheories } from './notification-clownbot-source';

describe('getTopTheories', () => {
  it('only reads live theories that carry an image (media rule)', async () => {
    const calls: unknown[][] = [];
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'order']) q[m] = () => q;
    q.not = (...args: unknown[]) => {
      calls.push(args);
      return q;
    };
    q.limit = () => Promise.resolve({ data: [{ claim: 'c', name: 'n', heat: 2 }], error: null });
    const db = { from: () => q } as unknown as SupabaseClient;
    const result = await getTopTheories(db, 3);
    expect(calls).toEqual([['image_url', 'is', null]]);
    expect(result).toEqual([{ summary: 'c' }]);
  });
});
