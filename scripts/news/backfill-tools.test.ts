import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readmeText, splitKit, stratify } from './build-writer-eval-kit.mjs';
import { parseDays, parseIds, parseIsoDate, parseLimit } from './backfill-args.mjs';
import { clearRetired, restoreSnapshots } from './restore-copy-snapshot.mjs';

function kitRow(i: number, category: string, sourceTier: string) {
  return {
    kitId: `k${String(i).padStart(3, '0')}`, headline: `H${i}`, category, sourceTier, statusHint: 'reported',
    facts: [], contextText: '', userMessage: `u${i}`, sonnetDraft: { lead: `lead${i}`, body: `body${i}`, citations: [], paragraphs: [] },
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
    expect(text).toContain('"paragraphs"');
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

  it('round-trips facts and writing_score from a rewrite snapshot', async () => {
    const facts = [{ id: 'f1', claim: 'c', attribution: 'People', confidence: 'reported' }];
    const { db, updates } = snapshotDb([
      { current_item_id: 'r', headline: 'Hr', summary: 'Sr', detail: 'Dr', facts, writing_score: 3, reason: 'backfill_rewrite', snapshot_at: '2026-11-04T00:00:00Z' },
    ]);
    await restoreSnapshots(db, { id: 'r', dryRun: false });
    expect(updates).toEqual([{ id: 'r', values: { headline: 'Hr', summary: 'Sr', detail: 'Dr', facts, writing_score: 3 } }]);
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

describe('clearRetired', () => {
  function retiredDb(rows: Record<string, unknown>[], snapshots: Record<string, unknown>[] = []) {
    const updates: { values: Record<string, unknown>; guards: Record<string, unknown> }[] = [];
    const from = (table: string) => {
      let found = table === 'current_item_copy_snapshot' ? snapshots : rows;
      let pending: { values: Record<string, unknown>; guards: Record<string, unknown> } | undefined;
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = (c: string, v: unknown) => {
        if (pending) pending.guards[c] = v; else found = found.filter((r) => r[c] === v);
        return b;
      };
      b.in = (c: string, v: unknown[]) => { found = found.filter((r) => v.includes(r[c])); return b; };
      b.gte = (c: string, v: string) => { found = found.filter((r) => String(r[c]) >= v); return b; };
      b.is = (c: string, v: unknown) => {
        if (pending) pending.guards[c] = v; else found = found.filter((r) => (r[c] ?? null) === v);
        return b;
      };
      b.update = (values: Record<string, unknown>) => { pending = { values, guards: {} }; return b; };
      b.then = (resolve: (v: unknown) => void) => {
        if (pending) { updates.push(pending); return resolve({ error: null }); }
        return resolve({ data: found.map((r) => (table === 'current_item_copy_snapshot' ? r : { id: r.id, quality_hold_reason: r.quality_hold_reason })), error: null });
      };
      return b;
    };
    return { db: { from }, updates };
  }
  const rows = [
    { id: 'a', quality_hold_reason: 'retired_below_floor', retracted_at: null },
    { id: 'b', quality_hold_reason: 'missing_image', retracted_at: null },
    { id: 'c', quality_hold_reason: 'retired_below_floor', retracted_at: '2026-11-01' },
  ];

  it('un-hides only retired, non-retracted rows with a guarded update', async () => {
    const { db, updates } = retiredDb(rows);
    const result = await clearRetired(db, { dryRun: false });
    expect(result).toMatchObject({ found: 1, restored: 1 });
    expect(updates).toEqual([{
      values: { redline_ok: true, quality_hold_reason: null },
      guards: { id: 'a', quality_hold_reason: 'retired_below_floor', retracted_at: null },
    }]);
  });

  it('also clears retired_duplicate (and its merged_into) and retired_unwritable rows', async () => {
    const more = [
      { id: 'dup', quality_hold_reason: 'retired_duplicate', retracted_at: null },
      { id: 'unw', quality_hold_reason: 'retired_unwritable', retracted_at: null },
    ];
    const { db, updates } = retiredDb(more);
    expect(await clearRetired(db, { dryRun: false })).toMatchObject({ found: 2, restored: 2 });
    expect(updates).toEqual([
      { values: { redline_ok: true, quality_hold_reason: null, merged_into: null }, guards: { id: 'dup', quality_hold_reason: 'retired_duplicate', retracted_at: null } },
      { values: { redline_ok: true, quality_hold_reason: null }, guards: { id: 'unw', quality_hold_reason: 'retired_unwritable', retracted_at: null } },
    ]);
  });

  it('with --since only clears rows retired since then', async () => {
    const two = [...rows, { id: 'd', quality_hold_reason: 'retired_below_floor', retracted_at: null }];
    const snaps = [
      { current_item_id: 'a', reason: 'retire_below_floor', snapshot_at: '2026-11-03T00:00:00Z' },
      { current_item_id: 'd', reason: 'retire_below_floor', snapshot_at: '2026-10-01T00:00:00Z' },
    ];
    const { db, updates } = retiredDb(two, snaps);
    const result = await clearRetired(db, { since: '2026-11-01T00:00:00Z', dryRun: false });
    expect(result).toMatchObject({ found: 1, restored: 1 });
    expect(updates.map((u) => u.guards.id)).toEqual(['a']);
  });

  it('writes nothing in a dry run', async () => {
    const { db, updates } = retiredDb(rows);
    expect(await clearRetired(db, {})).toMatchObject({ found: 1, restored: 0 });
    expect(updates).toEqual([]);
  });
});

describe('content-backfill workflow inputs', () => {
  const yml = readFileSync(new URL('../../.github/workflows/content-backfill.yml', import.meta.url), 'utf8');
  const script = yml.split('- name: Validate inputs')[1]!.split('run: |\n')[1]!.split('\n      - name:')[0]!
    .split('\n').map((l) => l.replace(/^ {10}/, '')).join('\n');
  const bash = spawnSync('bash', ['-c', 'true']);
  const validate = (env: Record<string, string>) =>
    spawnSync('bash', ['-c', script], { env: { PATH: process.env.PATH ?? '', INPUT_LIMIT: '0', INPUT_DAYS: '', INPUT_IDS: '', INPUT_MODE: 'rewrite', ...env }, encoding: 'utf8' });
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  it('offers rewrite, an ids input, and keeps dry_run defaulting to true', () => {
    expect(yml).toMatch(/options:\s+- floors\s+- force\s+- rewrite/);
    expect(yml).toMatch(/\n {6}ids:\n/);
    expect(yml).toMatch(/dry_run:[\s\S]*?default: true/);
    expect(yml).toContain('BACKFILL_IDS: ${{ inputs.ids }}');
    expect(yml).toContain('INPUT_IDS: ${{ inputs.ids }}');
  });

  it.skipIf(bash.error !== undefined)('validates ids, and refuses retire flags in rewrite mode', () => {
    expect(validate({}).status).toBe(0);
    expect(validate({ INPUT_IDS: `${uuid},${uuid}` }).status).toBe(0);
    expect(validate({ INPUT_IDS: `${uuid};rm -rf` }).status).toBe(1);
    expect(validate({ INPUT_IDS: 'abc' }).status).toBe(1);
    expect(validate({ INPUT_IDS: uuid, INPUT_MODE: 'force' }).status).toBe(1);
    expect(validate({ INPUT_RETIRE_BELOW_FLOOR: 'true' }).status).toBe(1);
    expect(validate({ INPUT_RETIRE_UNWRITABLE: 'true' }).status).toBe(1);
    expect(validate({ INPUT_MODE: 'force', INPUT_RETIRE_UNWRITABLE: 'true' }).status).toBe(0);
  });
});

describe('argument validation', () => {
  it('treats empty days as the feed window and rejects non-integers', () => {
    expect(parseDays(undefined)).toBeUndefined();
    expect(parseDays('')).toBeUndefined();
    expect(parseDays('0')).toBeUndefined();
    expect(parseDays('14')).toBe(14);
    for (const bad of ['ten', '-5', '1.5', ' 3']) expect(() => parseDays(bad)).toThrow(/invalid days/);
  });

  it('accepts only non-negative integers for limit', () => {
    expect(parseLimit('20')).toBe(20);
    expect(parseLimit('0')).toBe(0);
    expect(parseLimit(undefined)).toBe(0);
    for (const bad of ['ten', '-5', '', '1.5', ' 3']) expect(() => parseLimit(bad)).toThrow(/invalid limit/);
  });

  it('accepts only comma-separated UUIDs for ids', () => {
    const a = '123e4567-e89b-12d3-a456-426614174000';
    const b = '123E4567-E89B-12D3-A456-426614174001';
    expect(parseIds(undefined)).toBeUndefined();
    expect(parseIds('')).toBeUndefined();
    expect(parseIds(`${a},${b}`)).toEqual([a, b.toLowerCase()]);
    for (const bad of ['abc', `${a},`, `${a};${b}`, `${a},not-a-uuid`]) expect(() => parseIds(bad)).toThrow(/invalid ids/);
  });

  it('fails closed on a malformed --since', () => {
    expect(parseIsoDate('2026-11-03')).toBe('2026-11-03T00:00:00.000Z');
    expect(parseIsoDate('2026-11-03T12:00:00Z')).toBe('2026-11-03T12:00:00.000Z');
    for (const bad of ['yesterday', '', '2026-13-45', '11/03/2026']) expect(() => parseIsoDate(bad)).toThrow(/invalid --since/);
  });
});
