import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadForceCandidates } from './backfill-force-load';
import { runBackfill } from './backfill-run';
import type { ForceDeps } from './backfill-types';
import type { ExtractUsageStore } from './usage-store';

const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString();
const SUMMARY = 'Taylor announced a new surprise release on Friday night, and fans noticed it right away. The drop came with a short note and a tracklist that spans eleven songs in total.';
const DETAIL = Array.from({ length: 70 }, (_, i) => `word${i}`).join(' ');
const FACTS = [{ id: 'f1', claim: 'Taylor announced a release', attribution: 'A Blog', confidence: 'rumor' as const }];
const WEAK = [{ name: 'A Blog', url: 'https://blog.example.com/a', tier: 'unverified' }];

function row(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id, headline: `Headline ${id}`, summary: SUMMARY, detail: DETAIL, image_url: 'https://www.billboard.com/ok.jpg',
    sources: WEAK, era_id: 'tloas', observed_on: new Date().toISOString().slice(0, 10), category: 'release', tags: [],
    status: 'rumor', source_tier: 'unverified', symbols: [], entities: [], redline_ok: true,
    promoted_to: null, merged_into: null, retracted_at: null, facts: null, expires_at: FUTURE,
    ...overrides,
  };
}

interface Call { table: string; op: 'insert' | 'update' | 'delete'; values: Record<string, unknown>; guards: string[]; id?: unknown }

function fakeDb(rows: Record<string, unknown>[], opts: { missingMarker?: boolean; onInsert?: () => void } = {}) {
  const calls: Call[] = [];
  const marks: { id: unknown; at: unknown }[] = [];
  const orders: { column: string; ascending?: boolean; nullsFirst?: boolean }[] = [];
  let snapshotId = 0;
  const from = (table: string) => {
    let pending: Call | undefined;
    let filtered = rows;
    let single = false;
    let withMarker = false;
    const b: Record<string, unknown> = {};
    b.select = (cols?: string) => {
      if (typeof cols === 'string' && !pending) withMarker = cols.includes('backfill_attempted_at');
      return b;
    };
    b.is = (c: string, v: unknown) => {
      if (pending) pending.guards.push(c);
      filtered = filtered.filter((r) => (r[c] ?? null) === v);
      return b;
    };
    b.eq = (c: string, v: unknown) => {
      if (pending && c === 'id') pending.id = v;
      filtered = filtered.filter((r) => r[c] === v);
      return b;
    };
    b.gt = () => b;
    b.gte = () => b;
    const specs: { column: string; ascending?: boolean; nullsFirst?: boolean }[] = [];
    b.order = (column: string, o: { ascending?: boolean; nullsFirst?: boolean } = {}) => {
      orders.push({ column, ...o });
      specs.push({ column, ...o });
      return b;
    };
    const sorted = () => [...filtered].sort((x, y) => {
      for (const o of specs) {
        const xv = x[o.column] ?? null;
        const yv = y[o.column] ?? null;
        if (xv === yv) continue;
        if (xv === null) return o.nullsFirst ? -1 : 1;
        if (yv === null) return o.nullsFirst ? 1 : -1;
        return (String(xv) < String(yv) ? -1 : 1) * (o.ascending === false ? -1 : 1);
      }
      return 0;
    });
    b.limit = () => b;
    b.maybeSingle = () => { single = true; return b; };
    b.single = () => b;
    b.update = (values: Record<string, unknown>) => { pending = { table, op: 'update', values, guards: [] }; return b; };
    b.delete = () => { pending = { table, op: 'delete', values: {}, guards: [] }; return b; };
    b.insert = (values: Record<string, unknown>) => {
      calls.push({ table, op: 'insert', values, guards: [] });
      snapshotId++;
      opts.onInsert?.();
      pending = undefined;
      const inserted = { data: { id: snapshotId }, error: null };
      return { select: () => ({ single: async () => inserted }) };
    };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending && 'backfill_attempted_at' in pending.values) {
        if (opts.missingMarker) return resolve({ error: { code: '42703', message: 'column backfill_attempted_at does not exist' } });
        marks.push({ id: pending.id, at: pending.values.backfill_attempted_at });
        return resolve({ error: null });
      }
      if (pending) {
        calls.push(pending);
        return resolve({ data: filtered.map((r) => ({ id: r.id })), error: null });
      }
      if (opts.missingMarker && withMarker) return resolve({ data: null, error: { code: '42703', message: 'column does not exist' } });
      const ordered = sorted();
      return resolve({ data: single ? (ordered[0] ?? null) : ordered, error: null });
    };
    return b;
  };
  return { db: { from } as unknown as SupabaseClient, calls, marks, orders };
}

function deps(compose?: ForceDeps['compose']): ForceDeps {
  return {
    usage: {} as ExtractUsageStore,
    stores: { writer: {} as ExtractUsageStore, judge: {} as ExtractUsageStore },
    fetchArticles: vi.fn(async () => []),
    extract: vi.fn(async () => ({
      kind: 'current_item' as const, redlineFlags: [],
      currentItem: {
        observedOn: '2026-11-03', category: 'release', tags: [], headline: 'x', summary: 's', detail: 'd',
        symbols: [], entities: ['Taylor'], statusHint: 'rumor', facts: FACTS,
      },
    })) as unknown as ForceDeps['extract'],
    ...(compose ? { compose } : {}),
  };
}

const reportDir = () => mkdtempSync(join(tmpdir(), 'backfill-retire-'));

describe('retire below floor', () => {
  it('snapshots, then hides a below-floor row with a guarded update, and counts it', async () => {
    const { db, calls } = fakeDb([row('weak')]);
    const result = await runBackfill(db, { dryRun: false, mode: 'force', retireBelowFloor: true, reportDir: reportDir(), force: deps() });
    expect(calls.map((c) => `${c.table}:${c.op}`)).toEqual(['current_item_copy_snapshot:insert', 'current_item:update']);
    expect(calls[0]!.values).toMatchObject({ current_item_id: 'weak', summary: SUMMARY, reason: 'retire_below_floor' });
    expect(calls[1]!.values).toEqual({ redline_ok: false, quality_hold_reason: 'retired_below_floor' });
    expect(calls[1]!.guards).toEqual(['facts', 'merged_into', 'retracted_at', 'promoted_to']);
    expect(result.force).toMatchObject({ retired: 1, held: 1, outcomes: { retired_below_floor: 1 } });
  });

  it('writes nothing without the flag or on a dry run', async () => {
    for (const options of [{ dryRun: false }, { dryRun: true, retireBelowFloor: true }]) {
      const { db, calls } = fakeDb([row('weak')]);
      const result = await runBackfill(db, { mode: 'force', reportDir: reportDir(), force: deps(), ...options });
      expect(calls).toEqual([]);
      expect(result.force).toMatchObject({ retired: 0, outcomes: { below_tier_floor: 1 } });
    }
  });

  it('skips a row that changed before the retirement and snapshots nothing', async () => {
    const rows = [row('weak')];
    const { db, calls } = fakeDb(rows);
    const extract = vi.fn(async () => {
      Object.assign(rows[0]!, { retracted_at: '2026-11-03' });
      return (deps().extract as unknown as () => Promise<unknown>)();
    }) as unknown as ForceDeps['extract'];
    const result = await runBackfill(db, { dryRun: false, mode: 'force', retireBelowFloor: true, reportDir: reportDir(), force: { ...deps(), extract } });
    expect(calls).toEqual([]);
    expect(result.force?.outcomes).toEqual({ skipped_changed: 1 });
    expect(result.force?.retired).toBe(0);
  });
});

describe('retire snapshot cleanup', () => {
  it('deletes the orphan retire snapshot by id when the guarded update matches nothing', async () => {
    const rows = [row('weak')];
    const { db, calls } = fakeDb(rows, { onInsert: () => { rows[0]!.facts = FACTS; } });
    const result = await runBackfill(db, { dryRun: false, mode: 'force', retireBelowFloor: true, reportDir: reportDir(), force: deps() });
    expect(calls.map((c) => `${c.table}:${c.op}`)).toEqual([
      'current_item_copy_snapshot:insert', 'current_item:update', 'current_item_copy_snapshot:delete',
    ]);
    expect(calls[2]).toMatchObject({ id: 1 });
    expect(result.force?.outcomes).toEqual({ skipped_changed: 1 });
    expect(result.force?.retired).toBe(0);
  });
});

describe('attempt marker and ordering', () => {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const older = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);

  it('orders never-attempted first, then least recently attempted, then newest observed_on, and skips rows attempted in the last 20h', async () => {
    const { db, orders } = fakeDb([
      row('fresh-old', { observed_on: older }),
      row('fresh-new', { observed_on: today }),
      row('stale', { backfill_attempted_at: hoursAgo(30) }),
      row('staler', { backfill_attempted_at: hoursAgo(50) }),
      row('recent', { backfill_attempted_at: hoursAgo(5) }),
    ]);
    const picked = await loadForceCandidates(db);
    expect(picked.map((r) => r.id)).toEqual(['fresh-new', 'fresh-old', 'staler', 'stale']);
    expect(orders).toEqual([
      { column: 'backfill_attempted_at', ascending: true, nullsFirst: true },
      { column: 'observed_on', ascending: false },
    ]);
  });

  it('honours the limit after ordering', async () => {
    const { db } = fakeDb([row('a', { backfill_attempted_at: hoursAgo(30) }), row('b'), row('c', { observed_on: older })]);
    expect((await loadForceCandidates(db, 2)).map((r) => r.id)).toEqual(['b', 'c']);
  });

  it('falls back to the old query only on 42703', async () => {
    const { db } = fakeDb([row('a'), row('b')], { missingMarker: true });
    expect((await loadForceCandidates(db)).map((r) => r.id)).toEqual(['a', 'b']);
    const failing = { from: () => ({ select: () => ({ is: () => ({ is: () => ({ is: () => ({ is: () => ({ eq: () => ({ gt: () => ({ order: () => ({ order: () => ({ limit: async () => ({ data: null, error: { code: '57014', message: 'timeout' } }) }) }) }) }) }) }) }) }) }) }) } as unknown as SupabaseClient;
    await expect(loadForceCandidates(failing)).rejects.toThrow('timeout');
  });

  it('stamps every attempted row on a live run whatever the outcome, and nothing on a dry run', async () => {
    const strong = [{ name: 'People', url: 'https://people.com/a', tier: 'established' }];
    const live = fakeDb([row('weak'), row('thrown', { sources: strong })]);
    const extract = vi.fn(async (_u: unknown, input: { items: { title: string }[] }) => {
      if (input.items[0]!.title === 'Headline thrown') throw new Error('boom');
      return (deps().extract as unknown as () => Promise<unknown>)();
    }) as unknown as ForceDeps['extract'];
    const result = await runBackfill(live.db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: { ...deps(), extract } });
    expect(live.marks.map((m) => m.id).sort()).toEqual(['thrown', 'weak']);
    expect(result.errors.join(' ')).toContain('boom');
    const dry = fakeDb([row('weak')]);
    await runBackfill(dry.db, { dryRun: true, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(dry.marks).toEqual([]);
    expect(dry.orders[0]).toMatchObject({ column: 'backfill_attempted_at' });
  });

  it('does not stamp a row whose attempt was only a budget deferral, and tolerates a missing column', async () => {
    const deferred = fakeDb([row('a')]);
    const extract = vi.fn(async () => null) as unknown as ForceDeps['extract'];
    await runBackfill(deferred.db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: { ...deps(), extract } });
    expect(deferred.marks).toEqual([]);
    const missing = fakeDb([row('weak')], { missingMarker: true });
    const result = await runBackfill(missing.db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(result.errors).toEqual([]);
    expect(result.force?.processed).toBe(1);
  });
});

describe('report for an invalid draft', () => {
  it('keeps the last attempt lead, body, paragraphs and validation reasons', async () => {
    const strong = [{ name: 'People', url: 'https://people.com/a', tier: 'established' }];
    const { db } = fakeDb([row('inv', { sources: strong, source_tier: 'established', status: 'reported' })]);
    const paragraphs = [{ sentences: [{ text: 'Short lead sentence here.', refs: ['f1'] }] }];
    const compose = vi.fn(async (_d: unknown, _s: unknown, item: { facts: unknown }) => ({
      item, v2: { facts: item.facts, holdReason: 'writing_quality:invalid_draft' },
      trace: { lead: 'Too short', body: 'Short lead sentence here.', paragraphs, citations: [{ sentence: 0, ref: 'f1' }], gateReasons: ['lead is 9 characters; the minimum is 200'], rewrites: 1 },
      contextIds: [], context: { items: [], text: '' },
    })) as unknown as ForceDeps['compose'];
    const dir = reportDir();
    await runBackfill(db, { dryRun: true, mode: 'force', reportDir: dir, force: deps(compose) });
    const line = JSON.parse(readFileSync(join(dir, 'backfill-report.jsonl'), 'utf8').trim());
    expect(line).toMatchObject({
      outcome: 'writing_hold', holdReason: 'writing_quality:invalid_draft', newLead: 'Too short',
      newBody: 'Short lead sentence here.', paragraphs, gateReasons: ['lead is 9 characters; the minimum is 200'],
    });
    expect(readFileSync(join(dir, 'backfill-report.md'), 'utf8')).toContain('Gate reasons: lead is 9 characters');
  });
});
