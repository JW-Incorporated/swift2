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
  mergeNewFactsIntoOriginal,
} from './write-knowledge';

/** A minimal thenable query-builder stub — every chain method returns
 * itself; resolving the chain (await/.then) yields the given result, same
 * shape the real @supabase/supabase-js PostgrestFilterBuilder resolves to. */
function chain(result: { data?: unknown; error?: unknown }) {
  const obj: Record<string, unknown> = {
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  for (const method of ['insert', 'select', 'single', 'maybeSingle', 'eq', 'neq', 'is', 'lt', 'update', 'upsert']) {
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
  it('emits an event only when redline and publish-quality gates both pass', async () => {
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
        summary:
          'Taylor announced a new single today during a surprise livestream event watched by millions. Fans immediately began speculating about which upcoming album the single belongs to.',
        detail:
          'The announcement came via her official Instagram account, posted shortly after midnight with a cryptic caption that fans quickly decoded using the same numerology and color-language techniques that have accompanied past album rollouts, drawing on nearly a decade of precedent across multiple prior eras, and echoing the exact visual motifs fans had already flagged earlier in the week as likely hints.',
        symbols: ['13'],
        entities: [],
        statusHint: 'confirmed',
      } as never,
      [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
      undefined,
      'https://www.people.com/photo.jpg',
    );
    expect(result.id).toBe('item-1');
    expect(result.redlineOk).toBe(true);
    expect(result.holdReason).toBeUndefined();
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(db.from).toHaveBeenNthCalledWith(1, 'current_item');
    expect(db.from).toHaveBeenNthCalledWith(2, 'events');
  });

  it('holds a quality-failing row without inserting an events row', async () => {
    const db = fakeDb(() => chain({ data: { id: 'item-held' }, error: null }));
    let insertedRow: Record<string, unknown> | undefined;
    (db.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const c = chain({ data: { id: 'item-held' }, error: null }) as Record<string, unknown>;
      c.insert = (row: Record<string, unknown>) => {
        insertedRow = row;
        return c;
      };
      return c;
    });
    const result = await writeCurrentItem(
      db,
      'story-1',
      'tloas',
      {
        observedOn: '2026-08-23',
        category: 'release',
        tags: ['music'],
        headline: 'New single announced',
        summary:
          'Taylor announced a new single today during a surprise livestream event watched by millions. Fans immediately began speculating about which upcoming album the single belongs to.',
        detail:
          'The announcement came via her official Instagram account, posted shortly after midnight with a cryptic caption that fans quickly decoded using the same numerology and color-language techniques that have accompanied past album rollouts, drawing on nearly a decade of precedent across multiple prior eras, and echoing the exact visual motifs fans had already flagged earlier in the week as likely hints.',
        symbols: ['13'],
        entities: [],
        statusHint: 'confirmed',
        // no imageUrl
      } as never,
      [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
    );
    expect(result.id).toBe('item-held');
    expect(result.redlineOk).toBe(false);
    expect(result.holdReason).toBe('missing_image');
    expect(insertedRow?.redline_ok).toBe(false);
    expect(insertedRow?.quality_hold_reason).toBe('missing_image');
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.from).toHaveBeenCalledWith('current_item');
  });

  it('holds the row when the summary/detail are too thin, even with an image and a clean redline', async () => {
    const db = fakeDb(() => chain({ data: { id: 'item-thin' }, error: null }));
    const result = await writeCurrentItem(
      db,
      'story-1',
      'tloas',
      {
        observedOn: '2026-08-23',
        category: 'sighting',
        tags: [],
        headline: 'Seen out',
        summary: 'Taylor was seen.',
        detail: 'Short.',
        symbols: [],
        entities: [],
        statusHint: 'reported',
      } as never,
      [],
      undefined,
      'https://www.people.com/photo.jpg',
    );
    expect(result.redlineOk).toBe(false);
    expect(result.holdReason).toBe('summary_too_short');
  });

  it('regression: reads the image from the positional imageUrl param (the real run-extract-stage call shape), not off the item', async () => {
    const inserted: Record<string, unknown>[] = [];
    const db = fakeDb(() => {
      const c = chain({ data: { id: 'item-r' }, error: null }) as Record<string, unknown>;
      c.insert = (row: Record<string, unknown>) => {
        inserted.push(row);
        return c;
      };
      return c;
    });
    const result = await writeCurrentItem(
      db,
      'story-r',
      'tloas',
      {
        observedOn: '2026-08-23',
        category: 'release',
        tags: ['music'],
        headline: 'New single announced',
        summary:
          'Taylor announced a new single today during a surprise livestream event watched by millions. Fans immediately began speculating about which upcoming album the single belongs to.',
        detail:
          'The announcement came via her official Instagram account, posted shortly after midnight with a cryptic caption that fans quickly decoded using the same numerology and color-language techniques that have accompanied past album rollouts, drawing on nearly a decade of precedent across multiple prior eras, and echoing the exact visual motifs fans had already flagged earlier in the week as likely hints.',
        symbols: [],
        entities: [],
        statusHint: 'reported',
      },
      [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
      undefined,
      'https://www.people.com/photo.jpg',
    );
    expect(result.holdReason).toBeUndefined();
    expect(result.redlineOk).toBe(true);
    expect(inserted[0]?.image_url).toBe('https://www.people.com/photo.jpg');
  });

  it('holds a redline-failing row without inserting an events row', async () => {
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
        summary:
          'Fans began discussing a photograph after it circulated widely online. No official source supported the speculation, and reputable coverage emphasized that the claim remained entirely unverified.',
        detail:
          'The discussion began after an ordinary public photograph was reposted without context across several fan accounts. No representative, official channel, or reputable outlet confirmed the claim, and the available reporting offered no factual basis for it. The item is retained only for audit review because the subject matter crosses the privacy redline and must never be served or used to trigger a notification event.',
        symbols: [],
        entities: [],
        statusHint: 'confirmed',
      },
      [],
      undefined,
      'https://www.people.com/photo.jpg',
    );
    expect(result.redlineOk).toBe(false);
    expect(result.holdReason).toBe('redline_failed');
    expect(result.id).toBe('item-2'); // still written for audit
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.from).toHaveBeenCalledWith('current_item');
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

describe('mergeNewFactsIntoOriginal', () => {
  const GOOD_ORIGINAL = {
    headline: 'New single announced',
    summary:
      'Taylor announced a new single today during a surprise livestream event watched by millions. Fans immediately began speculating about which upcoming album the single belongs to.',
    detail:
      'The announcement came via her official Instagram account, posted shortly after midnight with a cryptic caption that fans quickly decoded using the same numerology and color-language techniques that have accompanied past album rollouts, drawing on nearly a decade of precedent across multiple prior eras, and echoing the exact visual motifs fans had already flagged earlier in the week as likely hints.',
    sources: [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' as const }],
    imageUrl: 'https://www.people.com/photo.jpg',
  };

  function fakeMergeDb(): { db: SupabaseClient; updatedRow: () => Record<string, unknown> | undefined } {
    let updatedRow: Record<string, unknown> | undefined;
    const db = fakeDb(() => {
      const c = chain({ data: null, error: null }) as Record<string, unknown>;
      c.update = (row: Record<string, unknown>) => {
        updatedRow = { ...updatedRow, ...row };
        return c;
      };
      return c;
    });
    return { db, updatedRow: () => updatedRow };
  }

  it('keeps the original copy and redline_ok=true when the merge rewrite FAILS the quality gate (too thin)', async () => {
    const { db, updatedRow } = fakeMergeDb();
    const result = await mergeNewFactsIntoOriginal(db, 'item-orig', GOOD_ORIGINAL, {
      mergedSummary: 'Short.',
      mergedDetail: 'Too thin.',
      duplicateSources: [{ outletName: 'Variety', url: 'https://variety.com/y', tier: 'established' }],
      duplicateImageUrl: null,
    });
    expect(result.redlineOk).toBe(true);
    expect(result.holdReason).toBeUndefined();
    const row = updatedRow();
    // The original's good copy survives — the failing rewrite is discarded.
    expect(row?.summary).toBe(GOOD_ORIGINAL.summary);
    expect(row?.detail).toBe(GOOD_ORIGINAL.detail);
    expect(row?.redline_ok).toBe(true);
    expect(row?.quality_hold_reason).toBeNull();
    // Sources are still unioned and the duplicate is still folded in even
    // though its rewrite was rejected.
    expect((row?.sources as unknown[]).length).toBe(2);
  });

  it('sets quality_hold_reason to null and uses the rewrite when the merge passes the quality gate', async () => {
    const { db, updatedRow } = fakeMergeDb();
    const mergedSummary =
      'Taylor announced a new single AND a surprise music video today during a livestream watched by millions worldwide. Fans immediately began speculating about which upcoming album the single belongs to.';
    const mergedDetail =
      'The announcement came via her official Instagram account, posted shortly after midnight with a cryptic caption that fans quickly decoded using the same numerology and color-language techniques, and a companion outlet also confirmed a surprise music video would drop alongside the single within the next 24 hours, extending the rollout across multiple platforms at once and drawing comparisons to past surprise-release eras that fans had already been tracking closely.';
    const result = await mergeNewFactsIntoOriginal(db, 'item-orig', GOOD_ORIGINAL, {
      mergedSummary,
      mergedDetail,
      duplicateSources: [{ outletName: 'Variety', url: 'https://variety.com/y', tier: 'established' }],
      duplicateImageUrl: null,
    });
    expect(result.redlineOk).toBe(true);
    expect(result.holdReason).toBeUndefined();
    const row = updatedRow();
    expect(row?.summary).toBe(mergedSummary);
    expect(row?.detail).toBe(mergedDetail);
    expect(row?.quality_hold_reason).toBeNull();
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
