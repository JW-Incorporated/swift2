import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  writeCurrentItem,
  writeFanSignal,
  upsertLiveTheory,
  theoryPassesScreen,
  abandonQuietTheories,
  projectKnowledgeDoc,
  refreshSymbolActivity,
} from './write-knowledge';

/** A minimal thenable query-builder stub — every chain method returns
 * itself; resolving the chain (await/.then) yields the given result, same
 * shape the real @supabase/supabase-js PostgrestFilterBuilder resolves to. */
function chain(result: { data?: unknown; error?: unknown }) {
  const obj: Record<string, unknown> = {
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  for (const method of ['insert', 'select', 'single', 'maybeSingle', 'eq', 'neq', 'lt', 'update', 'upsert']) {
    obj[method] = () => obj;
  }
  return obj;
}

function fakeDb(fromImpl: (table: string) => unknown, rpcImpl?: (fn: string, args?: unknown) => unknown) {
  return {
    from: vi.fn(fromImpl),
    rpc: vi.fn(rpcImpl ?? (() => chain({ error: null }))),
  } as unknown as SupabaseClient;
}

describe('writeCurrentItem', () => {
  it('writes redline_ok=true when nothing trips the redline screen', async () => {
    const db = fakeDb(() => chain({ data: { id: 'item-1' }, error: null }));
    const result = await writeCurrentItem(
      db,
      'story-1',
      'tloas',
      {
        observedOn: '2026-08-23',
        category: 'release',
        tags: ['music'],
        headline: 'New single announced',
        summary: 'Taylor announced a new single today.',
        detail: 'The announcement came via her official Instagram.',
        symbols: ['13'],
        entities: [],
        statusHint: 'reported',
      },
      [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
    );
    expect(result.id).toBe('item-1');
    expect(result.redlineOk).toBe(true);
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('writes redline_ok=false — but still writes the row — when a string trips the redline screen', async () => {
    const db = fakeDb(() => chain({ data: { id: 'item-2' }, error: null }));
    const result = await writeCurrentItem(
      db,
      'story-1',
      'tloas',
      {
        observedOn: '2026-08-23',
        category: 'relationship',
        tags: [],
        headline: 'Is she pregnant? fans speculate',
        summary: 'Fans speculate she is pregnant based on a photo.',
        detail: 'No official confirmation exists.',
        symbols: [],
        entities: [],
        statusHint: 'rumor',
      },
      [],
    );
    expect(result.redlineOk).toBe(false);
    expect(result.id).toBe('item-2'); // still written for audit
  });

  it('throws on an insert failure', async () => {
    const db = fakeDb(() => chain({ data: null, error: { message: 'boom' } }));
    await expect(
      writeCurrentItem(
        db,
        'story-1',
        'tloas',
        {
          observedOn: '2026-08-23',
          category: 'sighting',
          tags: [],
          headline: 'H',
          summary: 'S',
          detail: 'D',
          symbols: [],
          entities: [],
          statusHint: 'reported',
        },
        [],
      ),
    ).rejects.toThrow('current_item insert failed');
  });
});

describe('writeFanSignal', () => {
  it('writes redline_ok based on the screen of topic/summary/theory claims', async () => {
    const db = fakeDb(() => chain({ data: { id: 'signal-1' }, error: null }));
    const result = await writeFanSignal(
      db,
      { topic: 'Ticket countdown theory', summary: 'A popular thread argues the countdown means something.', stanceMix: {}, symbols: ['13'], theories: [] },
      [],
      5,
    );
    expect(result.id).toBe('signal-1');
    expect(result.redlineOk).toBe(true);
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('upsertLiveTheory', () => {
  it('inserts a new theory when nothing matches', async () => {
    const db = fakeDb((table) => {
      if (table !== 'live_theory') throw new Error(`unexpected table ${table}`);
      return chain({ data: [], error: null }); // select: no existing rows
    });
    // second call (insert) needs its own chain — override .from to alternate
    let call = 0;
    (db.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      if (call === 1) return chain({ data: [], error: null });
      return chain({ data: { id: 'theory-new' }, error: null });
    });
    const result = await upsertLiveTheory(db, { name: 'Brand New Theory', claim: 'Something new' }, ['owl'], '2026-08-23');
    expect(result.id).toBe('theory-new');
  });

  it('sets redline_ok: true on the inserted row — theoryPassesScreen already gated this call, so a live_theory row is only ever written once it has passed', async () => {
    const db = fakeDb(() => chain({ data: [], error: null }));
    let call = 0;
    let insertedRow: Record<string, unknown> | undefined;
    (db.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      call++;
      if (call === 1) return chain({ data: [], error: null }); // select: no existing rows
      if (call === 2) {
        // live_theory insert
        const c = chain({ data: { id: 'theory-new' }, error: null }) as Record<string, unknown>;
        c.insert = (row: Record<string, unknown>) => {
          insertedRow = row;
          return c;
        };
        return c;
      }
      // call 3: the Phase 5 easter_egg insertEvent() side-effect against 'events'
      expect(table).toBe('events');
      return chain({ data: { id: 'evt-1' }, error: null });
    });
    await upsertLiveTheory(db, { name: 'Brand New Theory', claim: 'Something new' }, ['owl'], '2026-08-23');
    expect(insertedRow?.redline_ok).toBe(true);
  });

  it('bumps an existing matching theory instead of inserting a duplicate', async () => {
    const db = fakeDb(() => chain({ error: null }));
    let call = 0;
    (db.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      if (call === 1) {
        return chain({
          data: [{ id: 'theory-existing', name: 'Ticket Countdown Theory', symbols: ['13'], heat: 3 }],
          error: null,
        });
      }
      return chain({ error: null }); // update
    });
    const result = await upsertLiveTheory(db, { name: 'Ticket Countdown Theory', claim: 'x' }, ['13'], '2026-08-23');
    expect(result.id).toBe('theory-existing');
  });
});

describe('theoryPassesScreen', () => {
  it('passes an ordinary theory', () => {
    expect(theoryPassesScreen({ name: 'Ticket Countdown Theory', claim: 'The countdown means a new merch drop.' })).toBe(true);
  });

  it('fails a theory that trips the redline screen', () => {
    expect(theoryPassesScreen({ name: 'Where does she live', claim: 'Fans think they found her home address.' })).toBe(false);
  });
});

describe('abandonQuietTheories', () => {
  it('returns the count of rows flipped to abandoned', async () => {
    const db = fakeDb(() => chain({ data: [{ id: 'a' }, { id: 'b' }], error: null }));
    const count = await abandonQuietTheories(db, '2026-08-23');
    expect(count).toBe(2);
  });
});

describe('projectKnowledgeDoc', () => {
  it('upserts without throwing on success', async () => {
    const db = fakeDb(() => chain({ error: null }));
    await expect(
      projectKnowledgeDoc(db, {
        id: 'current:item-1',
        kind: 'current_item',
        title: 'T',
        text: 'X',
        open: true,
        status: 'reported',
        sourceTier: 'established',
        sources: [],
        symbols: [],
        entities: [],
        redlineOk: true,
      }),
    ).resolves.toBeUndefined();
  });
});

describe('refreshSymbolActivity', () => {
  it('calls the refresh RPC and throws on error', async () => {
    const db = fakeDb(undefined as unknown as (table: string) => unknown, () => chain({ error: { message: 'nope' } }));
    await expect(refreshSymbolActivity(db)).rejects.toThrow('refresh_symbol_activity failed');
  });
});
