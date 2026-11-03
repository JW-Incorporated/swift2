import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadForceCandidates, type ForceCandidateRow } from './backfill-force';
import { sanitizeReason } from './backfill-report';
import { runBackfill } from './backfill-run';
import type { ForceDeps } from './backfill-types';
import type { ExtractUsageStore } from './usage-store';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString();

const OLD_SUMMARY = 'Taylor announced a new surprise release on Friday night, and fans noticed it right away. The drop came with a short note and a tracklist that spans eleven songs in total.';
const OLD_DETAIL = Array.from({ length: 70 }, (_, i) => `word${i}`).join(' ');

function row(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id, headline: `Headline ${id}`, summary: OLD_SUMMARY, detail: OLD_DETAIL, image_url: 'https://www.billboard.com/ok.jpg',
    sources: [{ name: 'People', url: 'https://people.com/a', tier: 'established' }],
    era_id: 'tloas', observed_on: daysAgo(1), category: 'release', tags: [], status: 'reported',
    source_tier: 'established', symbols: [], entities: [], redline_ok: true,
    promoted_to: null, merged_into: null, retracted_at: null, facts: null, expires_at: FUTURE,
    ...overrides,
  };
}

interface Call { table: string; op: 'insert' | 'update'; values: Record<string, unknown>; id?: unknown; guards?: string[] }

function fakeDb(rows: Record<string, unknown>[], opts: { snapshotError?: boolean; onInsert?: () => void; missingMarker?: boolean } = {}) {
  const calls: Call[] = [];
  const marks: { id: unknown; at: unknown }[] = [];
  const orders: { column: string; ascending?: boolean; nullsFirst?: boolean }[] = [];
  const selects: string[] = [];
  const from = (table: string) => {
    let pending: Call | undefined;
    let filtered = rows;
    let single = false;
    let withMarker = false;
    const b: Record<string, unknown> = {};
    b.select = (cols?: string) => {
      if (typeof cols === 'string' && !pending) {
        selects.push(cols);
        withMarker = cols.includes('backfill_attempted_at');
      }
      return b;
    };
    b.is = (c: string, v: unknown) => {
      if (pending) pending.guards = [...(pending.guards ?? []), c];
      filtered = filtered.filter((r) => (r[c] ?? null) === v);
      return b;
    };
    b.eq = (c: string, v: unknown) => {
      if (pending && c === 'id') pending.id = v;
      filtered = filtered.filter((r) => r[c] === v);
      return b;
    };
    b.gt = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) > v); return b; };
    b.gte = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) >= v); return b; };
    b.order = (column: string, o: { ascending?: boolean; nullsFirst?: boolean } = {}) => {
      orders.push({ column, ...o });
      filtered = [...filtered].sort((x, y) => {
        const xv = x[column] ?? null;
        const yv = y[column] ?? null;
        if (xv === yv) return 0;
        if (xv === null) return o.nullsFirst ? -1 : 1;
        if (yv === null) return o.nullsFirst ? 1 : -1;
        return (String(xv) < String(yv) ? -1 : 1) * (o.ascending === false ? -1 : 1);
      });
      return b;
    };
    b.limit = () => b;
    b.maybeSingle = () => { single = true; return b; };
    b.update = (values: Record<string, unknown>) => { pending = { table, op: 'update', values }; return b; };
    b.insert = async (values: Record<string, unknown>) => {
      calls.push({ table, op: 'insert', values });
      opts.onInsert?.();
      return { error: opts.snapshotError ? { message: 'insert denied' } : null };
    };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending && 'backfill_attempted_at' in pending.values) {
        if (opts.missingMarker) return resolve({ error: { code: '42703', message: 'column backfill_attempted_at does not exist' } });
        marks.push({ id: pending.id, at: pending.values.backfill_attempted_at });
        return resolve({ data: null, error: null });
      }
      if (pending) {
        calls.push(pending);
        return resolve({ data: filtered.map((r) => ({ id: r.id })), error: null });
      }
      if (opts.missingMarker && withMarker) {
        return resolve({ data: null, error: { code: '42703', message: 'column does not exist' } });
      }
      return resolve({ data: single ? (filtered[0] ?? null) : filtered, error: null });
    };
    return b;
  };
  return { db: { from } as unknown as SupabaseClient, calls, marks, orders, selects };
}

const FACTS = [{ id: 'f1', claim: 'Taylor announced a release', attribution: 'People', confidence: 'reported' as const }];
const LEAD = 'A surprise release landed overnight and the fandom is already dissecting it track by track. The tracklist spans eleven songs, and the early read is that it leans toward the stripped-back sound of her folklore years.';
const BODY = [
    'Taylor posted the announcement on Friday night with a short handwritten note and a cover shot in warm amber light.',
    'Within minutes, fan accounts had mapped the eleven titles against earlier clues scattered across her recent social posts.',
    'Pre-save links opened for streaming platforms in the United States, Britain and Australia before midnight Eastern time.',
    'Critics who heard advance copies described acoustic guitars, brushed drums and a closing ballad written at her piano.',
    'That palette recalls the quiet cabin recordings of 2020, though collaborators this time include a new producer from Nashville.',
    'Merch followed quickly, with a vinyl variant and a lyric booklet listed for shipping in December.',
    'Ticket holders for the upcoming shows should watch for setlist changes, since two songs were reportedly rehearsed already.',
    'Nothing about live plans is confirmed, and representatives have not commented on the rollout schedule yet.',
  ].join(' ');

function deps(overrides: Partial<ForceDeps> = {}): ForceDeps {
  return {
    usage: {} as ExtractUsageStore,
    stores: { writer: {} as ExtractUsageStore, judge: {} as ExtractUsageStore },
    fetchArticles: vi.fn(async () => []),
    extract: vi.fn(async () => ({
      kind: 'current_item' as const, redlineFlags: [],
      currentItem: {
        observedOn: daysAgo(1), category: 'release', tags: [], headline: 'x', summary: 's', detail: 'd',
        symbols: [], entities: ['Taylor'], statusHint: 'reported', facts: FACTS,
      },
    })) as unknown as ForceDeps['extract'],
    compose: vi.fn(async (_db: unknown, _stores: unknown, item: { summary: string; detail: string; facts: typeof FACTS }) => ({
      item: { ...item, summary: LEAD, detail: BODY },
      v2: { facts: item.facts, writingScore: 4 },
      trace: { lead: LEAD, body: BODY, citations: [{ sentence: 0, ref: 'f1' }], rewrites: 0 },
      contextIds: [],
      context: { items: [], text: '[c1] era context' },
    })) as unknown as ForceDeps['compose'],
    ...overrides,
  };
}

const reportDir = () => mkdtempSync(join(tmpdir(), 'backfill-force-'));

describe('loadForceCandidates', () => {
  it('picks only the rows the live feed shows that have no facts, with no observed_on window by default', async () => {
    const { db } = fakeDb([
      row('ok'),
      row('has-facts', { facts: FACTS }),
      row('old', { observed_on: daysAgo(40) }),
      row('merged', { merged_into: 'x' }),
      row('retracted', { retracted_at: '2026-01-01' }),
      row('promoted', { promoted_to: 'm' }),
      row('hidden', { redline_ok: false }),
      row('expired', { expires_at: '2020-01-01T00:00:00Z' }),
      row('thin', { summary: 'Too short.' }),
    ]);
    const picked = await loadForceCandidates(db);
    expect(picked.map((r: ForceCandidateRow) => r.id)).toEqual(['ok', 'old']);
  });

  it('narrows to the days override when one is given', async () => {
    const { db } = fakeDb([row('ok'), row('old', { observed_on: daysAgo(40) })]);
    const picked = await loadForceCandidates(db, 0, new Date(), 10);
    expect(picked.map((r: ForceCandidateRow) => r.id)).toEqual(['ok']);
  });
});

describe('force backfill', () => {
  it('snapshots before updating and writes the new copy on a pass', async () => {
    const { db, calls } = fakeDb([row('a')]);
    const dir = reportDir();
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: dir, force: deps() });
    expect(calls.map((c) => `${c.table}:${c.op}`)).toEqual(['current_item_copy_snapshot:insert', 'current_item:update']);
    expect(calls[0]!.values).toMatchObject({ current_item_id: 'a', summary: OLD_SUMMARY, detail: OLD_DETAIL, reason: 'backfill_v2' });
    expect(calls[1]!.values).toMatchObject({ summary: LEAD, detail: BODY, facts: FACTS, writing_score: 4 });
    expect(result.force).toMatchObject({ processed: 1, passed: 1, held: 0 });
    expect(result.wroteBack).toBe(1);
  });

  it('skips the row when the snapshot insert fails', async () => {
    const { db, calls } = fakeDb([row('a')], { snapshotError: true });
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(calls.filter((c) => c.op === 'update')).toHaveLength(0);
    expect(result.force?.skippedWriteFailures).toBe(1);
    expect(result.wroteBack).toBe(0);
    expect(result.errors[0]).toContain('snapshot_failed');
  });

  it('writes no DB rows on a dry run but produces the three files', async () => {
    const { db, calls } = fakeDb([row('a')]);
    const dir = reportDir();
    const result = await runBackfill(db, { dryRun: true, mode: 'force', reportDir: dir, force: deps() });
    expect(calls).toEqual([]);
    expect(result.force?.passed).toBe(1);
    const report = JSON.parse(readFileSync(join(dir, 'backfill-report.jsonl'), 'utf8').trim());
    expect(report).toMatchObject({ id: 'a', outcome: 'pass', newLead: LEAD, oldSummary: OLD_SUMMARY });
    expect(readFileSync(join(dir, 'backfill-report.md'), 'utf8')).toContain('Old summary');
    const kit = JSON.parse(readFileSync(join(dir, 'writer-eval-kit.jsonl'), 'utf8').trim());
    expect(kit).toMatchObject({ headline: 'Headline a', contextText: '[c1] era context', sonnetDraft: { lead: LEAD } });
    expect(kit.userMessage).toContain('HEADLINE: Headline a');
    expect(kit.kitId).toMatch(/^[0-9a-f]{12}$/);
  });

  it('leaves the copy untouched on a writing hold and a tier-floor hold', async () => {
    const weak = [{ name: 'A Blog', url: 'https://blog.example.com/a', tier: 'unverified' }];
    const { db, calls } = fakeDb([row('held'), row('weak', { sources: weak })]);
    const compose = vi.fn(async (_d: unknown, _s: unknown, item: { facts: unknown }) => ({
      item, v2: { facts: item.facts, holdReason: 'writing_quality:voice' },
      trace: { lead: LEAD, body: BODY, citations: [], gateReasons: ['x'], rewrites: 1 }, contextIds: [], context: { items: [], text: '' },
    })) as unknown as ForceDeps['compose'];
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps({ compose }) });
    expect(calls).toEqual([]);
    expect(result.force?.outcomes).toEqual({ writing_hold: 1, below_tier_floor: 1 });
    expect(result.force?.held).toBe(2);
  });

  it('stops gracefully on a deferral and reports what remains', async () => {
    const { db, calls } = fakeDb([row('a'), row('b'), row('c')]);
    let n = 0;
    const base = deps();
    const compose = vi.fn(async (...args: unknown[]) => {
      if (++n === 2) {
        const item = args[2] as { facts: unknown };
        return { item, v2: { facts: item.facts, holdReason: 'writer_deferred' }, trace: { rewrites: 0 }, contextIds: [], context: { items: [], text: '' } };
      }
      return (base.compose as (...a: unknown[]) => unknown)(...args);
    }) as unknown as ForceDeps['compose'];
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps({ compose }) });
    expect(result.force).toMatchObject({ processed: 1, passed: 1, deferred: true, remaining: 2 });
    expect(calls.filter((c) => c.op === 'update')).toHaveLength(1);
  });

  it('skips a row whose state changed before the write and snapshots nothing', async () => {
    for (const change of [{ facts: FACTS }, { merged_into: 'x' }, { retracted_at: '2026-11-03' }, { promoted_to: 'm' }]) {
      const rows = [row('a')];
      const { db, calls } = fakeDb(rows);
      const base = deps();
      const compose = vi.fn(async (...args: unknown[]) => {
        Object.assign(rows[0]!, change);
        return (base.compose as (...a: unknown[]) => unknown)(...args);
      }) as unknown as ForceDeps['compose'];
      const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps({ compose }) });
      expect(calls).toEqual([]);
      expect(result.force?.outcomes).toEqual({ skipped_changed: 1 });
    }
  });

  it('snapshots the re-read copy and guards the update', async () => {
    const rows = [row('a')];
    const { db, calls } = fakeDb(rows);
    const base = deps();
    const compose = vi.fn(async (...args: unknown[]) => {
      rows[0]!.summary = 'EDITED SUMMARY';
      return (base.compose as (...a: unknown[]) => unknown)(...args);
    }) as unknown as ForceDeps['compose'];
    await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps({ compose }) });
    expect(calls[0]!.values).toMatchObject({ summary: 'EDITED SUMMARY' });
    expect(calls[1]!.guards).toEqual(['facts', 'merged_into', 'retracted_at', 'promoted_to']);
  });

  it('reports skipped_changed when the guarded update matches zero rows', async () => {
    const rows = [row('a')];
    const { db, calls } = fakeDb(rows, { onInsert: () => { rows[0]!.facts = FACTS; } });
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(calls.map((c) => c.op)).toEqual(['insert', 'update']);
    expect(result.force?.outcomes).toEqual({ skipped_changed: 1 });
    expect(result.wroteBack).toBe(0);
  });

  it('withholds a draft that fails the redline in the report and kit', async () => {
    const { db } = fakeDb([row('a')]);
    const dir = reportDir();
    const compose = vi.fn(async (_d: unknown, _s: unknown, item: { facts: unknown }) => ({
      item, v2: { facts: item.facts, holdReason: 'writing_quality:voice' },
      trace: { lead: 'Rumors say is she pregnant today', body: BODY, citations: [], rewrites: 1 }, contextIds: [], context: { items: [], text: '' },
    })) as unknown as ForceDeps['compose'];
    await runBackfill(db, { dryRun: true, mode: 'force', reportDir: dir, force: deps({ compose }) });
    const report = readFileSync(join(dir, 'backfill-report.jsonl'), 'utf8');
    const kit = readFileSync(join(dir, 'writer-eval-kit.jsonl'), 'utf8');
    expect(report).toContain('[withheld: redline]');
    expect(kit).toContain('[withheld: redline]');
    expect(report + kit).not.toContain('pregnant');
  });

  it('sanitizes and truncates hold reasons in the public report', async () => {
    const secret = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc sk-abcdef123456789 https://x.example.com/p?token=1 ' + 'a'.repeat(40);
    expect(sanitizeReason(secret)).not.toMatch(/eyJ|sk-abc|token=1|a{32}/);
    expect(sanitizeReason('x'.repeat(500))).toHaveLength(200);
    const { db } = fakeDb([row('a')]);
    const dir = reportDir();
    const compose = vi.fn(async (_d: unknown, _s: unknown, item: { facts: unknown }) => ({
      item, v2: { facts: item.facts, holdReason: 'writing_quality:' + secret + 'y'.repeat(300) },
      trace: { rewrites: 1 }, contextIds: [], context: { items: [], text: '' },
    })) as unknown as ForceDeps['compose'];
    await runBackfill(db, { dryRun: true, mode: 'force', reportDir: dir, force: deps({ compose }) });
    const line = JSON.parse(readFileSync(join(dir, 'backfill-report.jsonl'), 'utf8').trim());
    expect(line.holdReason.length).toBeLessThanOrEqual(200);
    expect(line.holdReason).not.toMatch(/eyJ|sk-abc|token=1/);
  });
});
