import { describe, expect, it } from 'vitest';
import { readmeText, splitKit, stratify } from './build-writer-eval-kit.mjs';
import { restoreSnapshots } from './restore-copy-snapshot.mjs';

function kitRow(i: number, category: string, sourceTier: string) {
  return {
    kitId: `k${String(i).padStart(3, '0')}`, headline: `H${i}`, category, sourceTier, statusHint: 'reported',
    facts: [], contextText: '', userMessage: `u${i}`, sonnetDraft: { lead: `lead${i}`, body: `body${i}`, citations: [] },
  };
}

describe('writer eval kit builder', () => {
  const rows = [
    ...Array.from({ length: 10 }, (_, i) => kitRow(i, 'release', 'established')),
    ...Array.from({ length: 10 }, (_, i) => kitRow(10 + i, 'tour', 'official')),
    ...Array.from({ length: 2 }, (_, i) => kitRow(20 + i, 'appearance', 'unverified')),
  ];

  it('stratifies across category and source tier', () => {
    const picked = stratify(rows, 6);
    expect(picked).toHaveLength(6);
    const counts = new Map<string, number>();
    for (const p of picked) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    expect(Object.fromEntries(counts)).toEqual({ appearance: 2, release: 2, tour: 2 });
  });

  it('returns every row when n exceeds the pool', () => {
    expect(stratify(rows, 100)).toHaveLength(22);
  });

  it('strips Sonnet drafts from items and keeps them separate', () => {
    const { items, drafts } = splitKit(stratify(rows, 4));
    for (const item of items) expect(item).not.toHaveProperty('sonnetDraft');
    expect(drafts).toHaveLength(4);
    expect(drafts[0]).toHaveProperty('lead');
    expect(JSON.stringify(items)).not.toContain('lead0');
  });

  it('states the reply contract in the README', () => {
    const text = readmeText(4, { type: 'object' });
    expect(text).toContain('write_post');
    expect(text).toContain('1200');
  });
});

function snapshotDb(snapshots: Record<string, unknown>[]) {
  const updates: { values: Record<string, unknown>; id: unknown }[] = [];
  const from = (table: string) => {
    let rows = snapshots;
    let pending: { values: Record<string, unknown>; id: unknown } | undefined;
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = (c: string, v: unknown) => {
      if (pending) pending.id = v; else rows = rows.filter((r) => r[c] === v);
      return b;
    };
    b.gte = (c: string, v: string) => { rows = rows.filter((r) => String(r[c]) >= v); return b; };
    b.order = () => {
      rows = [...rows].sort((x, y) => String(y.snapshot_at).localeCompare(String(x.snapshot_at)));
      return b;
    };
    b.update = (values: Record<string, unknown>) => { pending = { values, id: undefined }; return b; };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending) { updates.push(pending); return resolve({ error: null }); }
      return resolve({ data: table === 'current_item_copy_snapshot' ? rows : [], error: null });
    };
    return b;
  };
  return { db: { from }, updates };
}

describe('restoreSnapshots', () => {
  const snaps = [
    { current_item_id: 'a', headline: 'H old', summary: 'S old', detail: 'D old', snapshot_at: '2026-11-01T00:00:00Z' },
    { current_item_id: 'a', headline: 'H newer', summary: 'S newer', detail: 'D newer', snapshot_at: '2026-11-02T00:00:00Z' },
    { current_item_id: 'b', headline: 'Hb', summary: 'Sb', detail: 'Db', snapshot_at: '2026-11-02T00:00:00Z' },
  ];

  it('restores the latest snapshot and nulls facts and score', async () => {
    const { db, updates } = snapshotDb(snaps);
    const result = await restoreSnapshots(db, { id: 'a', dryRun: false });
    expect(result).toMatchObject({ found: 1, restored: 1 });
    expect(updates).toEqual([{ id: 'a', values: { headline: 'H newer', summary: 'S newer', detail: 'D newer', facts: null, writing_score: null } }]);
  });

  it('restores everything since a timestamp', async () => {
    const { db, updates } = snapshotDb(snaps);
    const result = await restoreSnapshots(db, { since: '2026-11-02T00:00:00Z', dryRun: false });
    expect(result.restored).toBe(2);
    expect(updates.map((u) => u.id).sort()).toEqual(['a', 'b']);
  });

  it('writes nothing in a dry run', async () => {
    const { db, updates } = snapshotDb(snaps);
    const result = await restoreSnapshots(db, { id: 'a' });
    expect(result).toMatchObject({ found: 1, restored: 0 });
    expect(updates).toEqual([]);
  });
});
