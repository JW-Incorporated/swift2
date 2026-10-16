import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs modules
import { buildMatcherInput, readTidewatchQueue } from '../../merch-engine/build-matcher-input.mjs';
// @ts-expect-error plain .mjs module
import { runMerchAction } from './merch.mjs';

const now = new Date('2026-10-15T12:00:00.000Z');
const outfit = {
  id: 'decision-outfit', class: 'merch_outfit', decided_at: now.toISOString(),
  watch_item: { source_ref: JSON.stringify({
    moment: { id: 'vault-lover-replayed-look', title: 'Replayed look' },
    momentImageUrl: 'https://images.example/replayed-look.jpg',
  }) },
};

function dedupingDb() {
  const keys = new Set<string>();
  const insert = vi.fn((row: { dedupe_key: string }) => ({
    select: () => ({
      maybeSingle: async () => {
        if (keys.has(row.dedupe_key)) {
          return { data: null, error: { code: '23505', message: 'duplicate' } };
        }
        keys.add(row.dedupe_key);
        return { data: { id: `event-${keys.size}` }, error: null };
      },
    }),
  }));
  return { from: vi.fn(() => ({ insert })), insert, keys };
}

describe('Tidewatch merch actions', () => {
  it('puts a live replayed outfit into the next matcher input', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'p2-11-outfit-'));
    const queue = join(dir, 'outfit.jsonl');
    try {
      await runMerchAction(outfit, {
        live: true, queuePaths: { outfit: queue, fan: join(dir, 'fan.jsonl') },
      });
      const input = buildMatcherInput({
        corpora: [], tidewatchClass: { enabled: true, shadow: false }, now,
        tidewatchItems: await readTidewatchQueue(queue),
      });
      expect(input.moments).toEqual([expect.objectContaining({
        source: 'tidewatch',
        moment: { id: 'vault-lover-replayed-look', title: 'Replayed look' },
        momentImageUrl: 'https://images.example/replayed-look.jpg',
      })]);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('appends a live fan-made item to the curation queue', async () => {
    const append = vi.fn();
    const queuePaths = { outfit: 'outfit.jsonl', fan: 'fan.jsonl' };
    await runMerchAction({
      id: 'decision-fan', class: 'merch_fan', decided_at: now.toISOString(),
      watch_item: { source_ref: 'listing-1', title: 'Handmade bracelet', excerpt: 'Seller' },
    }, { live: true, append, queuePaths });
    expect(append).toHaveBeenCalledWith('fan.jsonl', {
      decisionId: 'decision-fan', sourceRef: 'listing-1', title: 'Handmade bracelet',
      excerpt: 'Seller', decidedAt: now.toISOString(),
    });
  });

  it('confirms the store-drop draft and dedupes the T2 event when live', async () => {
    const db = dedupingDb();
    const loadStoreDropDraft = vi.fn(async () => ({
      products: [{ sourceId: 'drop-1', item: 'Cardigan' }],
    }));
    const decision = { id: 'decision-official', class: 'merch_official' };
    const first = await runMerchAction(decision, { live: true, db, now, loadStoreDropDraft });
    const second = await runMerchAction(decision, { live: true, db, now, loadStoreDropDraft });
    expect(first).toMatchObject({ draftConfirmed: true, event: { emitted: true } });
    expect(second).toMatchObject({ draftConfirmed: true, event: { emitted: false, deduped: true } });
    expect(loadStoreDropDraft).toHaveBeenCalledTimes(2);
    expect(db.keys.size).toBe(1);
  });

  it('keeps every merch effect behind the live argument', async () => {
    const append = vi.fn();
    const loadStoreDropDraft = vi.fn();
    const emitOfficial = vi.fn();
    for (const classId of ['merch_outfit', 'merch_fan', 'merch_official']) {
      await expect(runMerchAction({ ...outfit, class: classId }, {
        live: false, append, loadStoreDropDraft, emitOfficial,
      })).resolves.toEqual({ acted: false, reason: 'router-not-live' });
    }
    expect(append).not.toHaveBeenCalled();
    expect(loadStoreDropDraft).not.toHaveBeenCalled();
    expect(emitOfficial).not.toHaveBeenCalled();
  });
});
