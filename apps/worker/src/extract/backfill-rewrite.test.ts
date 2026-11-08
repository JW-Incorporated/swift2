import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { factsHash, loadRewriteSelection, REWRITE_SINCE } from './backfill-rewrite-load';
import { guardedRewrite } from './backfill-rewrite-write';
import { runBackfill } from './backfill-run';
import type { ForceDeps } from './backfill-types';
import type { ExtractUsageStore } from './usage-store';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString();

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

const OLD_SUMMARY = LEAD.replace('landed overnight', 'landed Friday');
const OLD_DETAIL = BODY.replace('on Friday night', 'on Friday evening');

function row(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id, headline: `Headline ${id}`, summary: OLD_SUMMARY, detail: OLD_DETAIL, image_url: 'https://www.billboard.com/ok.jpg',
    sources: [{ name: 'People', url: 'https://people.com/a', tier: 'established' }],
    era_id: 'tloas', observed_on: daysAgo(1), category: 'release', tags: [], status: 'reported',
    source_tier: 'established', symbols: [], entities: [], redline_ok: true, writing_score: 3,
    promoted_to: null, merged_into: null, retracted_at: null, facts: FACTS, expires_at: FUTURE,
    ...overrides,
  };
}

interface Insert { table: string; values: Record<string, unknown> }

function fakeDb(items: Record<string, unknown>[], snapshots: Record<string, unknown>[] = []) {
  const inserts: Insert[] = [];
  const updates: { id: unknown; values: Record<string, unknown> }[] = [];
  const from = (table: string) => {
    const source = table === 'current_item' ? items : snapshots;
    let filtered = source;
    let pending: Record<string, unknown> | undefined;
    let single = false;
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.is = (c: string, v: unknown) => { filtered = filtered.filter((r) => (r[c] ?? null) === v); return b; };
    b.not = (c: string, _op: string, v: unknown) => { filtered = filtered.filter((r) => (r[c] ?? null) !== v); return b; };
    b.eq = (c: string, v: unknown) => { filtered = filtered.filter((r) => (c === 'facts' ? JSON.stringify(r[c]) === v : r[c] === v)); return b; };
    b.in = (c: string, vs: unknown[]) => { filtered = filtered.filter((r) => vs.includes(r[c])); return b; };
    b.gte = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) >= v); return b; };
    b.gt = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) > v); return b; };
    b.order = () => b;
    b.limit = () => b;
    b.maybeSingle = () => { single = true; return b; };
    b.update = (values: Record<string, unknown>) => { pending = values; return b; };
    b.insert = async (values: Record<string, unknown>) => { inserts.push({ table, values }); return { error: null }; };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending) {
        if (!('backfill_attempted_at' in pending)) for (const r of filtered) { updates.push({ id: r.id, values: pending }); Object.assign(r, pending); }
        return resolve({ data: filtered.map((r) => ({ id: r.id })), error: null });
      }
      return resolve({ data: single ? (filtered[0] ? { ...filtered[0] } : null) : filtered, error: null });
    };
    return b;
  };
  return { db: { from } as unknown as SupabaseClient, inserts, updates, items, snapshots };
}

function okCompose(onCall?: () => void): ForceDeps['compose'] {
  return vi.fn(async (_db: unknown, _stores: unknown, item: { facts: typeof FACTS }) => {
    onCall?.();
    return {
      item: { ...item, summary: LEAD, detail: BODY },
      v2: { facts: item.facts, writingScore: 4 },
      trace: { lead: LEAD, body: BODY, citations: [{ sentence: 0, ref: 'f1' }], rewrites: 0 },
      contextIds: [],
      context: { items: [], text: '[c1] era context' },
    };
  }) as unknown as ForceDeps['compose'];
}

const stores = { writer: {} as ExtractUsageStore, judge: {} as ExtractUsageStore };
const reportDir = () => mkdtempSync(join(tmpdir(), 'backfill-rewrite-'));
const run = (db: SupabaseClient, force: ForceDeps, extra: Record<string, unknown> = {}) =>
  runBackfill(db, { dryRun: false, mode: 'rewrite', reportDir: reportDir(), force: { stores, ...force }, ...extra });

describe('loadRewriteSelection', () => {
  it('selects only live rows that carry facts', async () => {
    const { db } = fakeDb([
      row('ok'),
      row('no-facts', { facts: null }),
      row('empty-facts', { facts: [] }),
      row('merged', { merged_into: 'x' }),
      row('retracted', { retracted_at: '2026-01-01' }),
      row('promoted', { promoted_to: 'm' }),
      row('retired', { redline_ok: false }),
      row('expired', { expires_at: '2020-01-01T00:00:00Z' }),
    ]);
    const { candidates } = await loadRewriteSelection(db);
    expect(candidates.map((c) => c.id)).toEqual(['ok']);
  });

  it('honours limit, days and ids, and skips rows already rewritten unless targeted by id', async () => {
    const items = [row('a'), row('b', { observed_on: daysAgo(10) }), row('c'), row('done')];
    const { db } = fakeDb(items, [{ current_item_id: 'done', reason: 'backfill_rewrite', created_at: '2026-11-09T00:00:00Z' }]);
    expect((await loadRewriteSelection(db)).candidates.map((c) => c.id).sort()).toEqual(['a', 'b', 'c']);
    expect((await loadRewriteSelection(db, 1)).candidates).toHaveLength(1);
    expect((await loadRewriteSelection(db, 0, new Date(), 3)).candidates.map((c) => c.id).sort()).toEqual(['a', 'c']);
    expect((await loadRewriteSelection(db, 0, new Date(), undefined, ['done', 'b'])).candidates.map((c) => c.id).sort()).toEqual(['b', 'done']);
  });

  it('counts only snapshots created since the writer-version marker as already rewritten', async () => {
    const items = [row('old'), row('new')];
    const snaps = [
      { current_item_id: 'old', reason: 'backfill_rewrite', created_at: '2026-11-01T00:00:00Z' },
      { current_item_id: 'new', reason: 'backfill_rewrite', created_at: '2026-11-09T00:00:00Z' },
    ];
    const { db } = fakeDb(items, snaps);
    expect((await loadRewriteSelection(db)).candidates.map((c) => c.id)).toEqual(['old']);
    expect((await loadRewriteSelection(db, 0, new Date(), undefined, undefined, '2026-11-10T00:00:00Z')).candidates.map((c) => c.id).sort()).toEqual(['new', 'old']);
    expect(REWRITE_SINCE).toBe('2026-11-08T00:00:00.000Z');
  });

  it('reports rows failing the read-time quality gate as unservable read_gate_failed', async () => {
    const { db } = fakeDb([row('ok'), row('thin', { summary: 'Too short.', detail: 'Too short.' })]);
    const sel = await loadRewriteSelection(db);
    expect(sel.candidates.map((c) => c.id)).toEqual(['ok']);
    expect(sel.unservable).toEqual([{ id: 'thin', reason: 'read_gate_failed' }]);
  });
});

describe('guardedRewrite', () => {
  const write = { summary: LEAD, detail: BODY, writingScore: 4 };

  it('snapshots old copy, facts and score, then updates only copy and score', async () => {
    const { db, inserts, updates } = fakeDb([row('a')]);
    const out = await guardedRewrite(db, 'a', factsHash(FACTS), write);
    expect(out.outcome).toBe('pass');
    expect(inserts).toEqual([{ table: 'current_item_copy_snapshot', values: {
      current_item_id: 'a', headline: 'Headline a', summary: OLD_SUMMARY, detail: OLD_DETAIL, facts: FACTS, writing_score: 3, reason: 'backfill_rewrite',
    } }]);
    expect(updates).toEqual([{ id: 'a', values: { summary: LEAD, detail: BODY, writing_score: 4 } }]);
  });

  it('skips with concurrent_change when the facts hash moved since load', async () => {
    const { db, inserts, updates } = fakeDb([row('a', { facts: [{ ...FACTS[0], claim: 'edited meanwhile' }] })]);
    const out = await guardedRewrite(db, 'a', factsHash(FACTS), write);
    expect(out.outcome).toBe('concurrent_change');
    expect(inserts).toEqual([]);
    expect(updates).toEqual([]);
  });

  it('treats a facts edit landing between the snapshot and the update as concurrent_change', async () => {
    const f = fakeDb([row('a')]);
    const realFrom = (f.db as unknown as { from: (t: string) => Record<string, unknown> }).from;
    const wrapped = {
      from: (table: string) => {
        const b = realFrom(table);
        if (table === 'current_item_copy_snapshot') {
          const ins = b.insert as (v: Record<string, unknown>) => Promise<unknown>;
          b.insert = async (v: Record<string, unknown>) => { const r = await ins(v); f.items[0]!.facts = [{ ...FACTS[0], claim: 'edited after snapshot' }]; return r; };
        }
        return b;
      },
    } as unknown as SupabaseClient;
    const out = await guardedRewrite(wrapped, 'a', factsHash(FACTS), write);
    expect(out.outcome).toBe('concurrent_change');
    expect(f.items[0]).toMatchObject({ summary: OLD_SUMMARY, detail: OLD_DETAIL, writing_score: 3 });
  });

  it('skips a row merged or retracted since load', async () => {
    const { db, updates } = fakeDb([row('a', { merged_into: 'z' })]);
    expect((await guardedRewrite(db, 'a', factsHash(FACTS), write)).outcome).toBe('skipped_changed');
    expect(updates).toEqual([]);
  });
});

describe('runBackfill rewrite mode', () => {
  it('rewrites a live v2 row, reusing its facts with no pass A', async () => {
    const f = fakeDb([row('a')]);
    const extract = vi.fn();
    const result = await run(f.db, { compose: okCompose(), extract: extract as unknown as ForceDeps['extract'] });
    expect(extract).not.toHaveBeenCalled();
    expect(result).toMatchObject({ considered: 1, rewritten: 1, wroteBack: 1 });
    expect(f.inserts[0]?.values).toMatchObject({ facts: FACTS, writing_score: 3, reason: 'backfill_rewrite' });
    expect(f.items[0]).toMatchObject({ summary: LEAD, detail: BODY, writing_score: 4, facts: FACTS });
  });

  it('reports a concurrent facts change and leaves the row alone', async () => {
    const f = fakeDb([row('a')]);
    const compose = okCompose(() => { f.items[0]!.facts = [{ ...FACTS[0], claim: 'other writer' }]; });
    const result = await run(f.db, { compose });
    expect(result.wroteBack).toBe(0);
    expect(result.force?.outcomes).toEqual({ concurrent_change: 1 });
    expect(f.items[0]).toMatchObject({ summary: OLD_SUMMARY, detail: OLD_DETAIL });
    expect(f.inserts).toEqual([]);
  });

  it('keeps the old copy and never retires when the writer holds or the gate fails', async () => {
    const f = fakeDb([row('hold'), row('thin')]);
    const compose = vi.fn(async (_db: unknown, _s: unknown, item: { headline: string; facts: typeof FACTS }) => item.headline.endsWith('hold')
      ? { item, v2: { facts: item.facts, holdReason: 'judge_below_bar' }, trace: { lead: LEAD, body: BODY, gateReasons: ['x'], rewrites: 1 }, contextIds: [], context: { items: [], text: '' } }
      : { item: { ...item, summary: 'too short', detail: 'too short' }, v2: { facts: item.facts, writingScore: 4 }, trace: { lead: 'too short', body: 'too short', rewrites: 0 }, contextIds: [], context: { items: [], text: '' } }) as unknown as ForceDeps['compose'];
    const result = await run(f.db, { compose });
    expect(result.wroteBack).toBe(0);
    const outcomes = Object.keys(result.force?.outcomes ?? {});
    expect(outcomes).toContain('rewrite_failed:judge_below_bar');
    expect(outcomes.some((o) => o.startsWith('rewrite_failed:quality:'))).toBe(true);
    expect(f.inserts).toEqual([]);
    expect(f.updates.filter((u) => 'redline_ok' in u.values || 'quality_hold_reason' in u.values)).toEqual([]);
    for (const item of f.items) expect(item).toMatchObject({ summary: OLD_SUMMARY, detail: OLD_DETAIL, redline_ok: true, writing_score: 3 });
  });

  it('rejects the retire flags with a clear error', async () => {
    const f = fakeDb([row('a')]);
    await expect(run(f.db, { compose: okCompose() }, { retireBelowFloor: true })).rejects.toThrow(/never retires/);
    await expect(run(f.db, { compose: okCompose() }, { retireUnwritable: true })).rejects.toThrow(/never retires/);
    expect(f.updates).toEqual([]);
  });

  it('writes nothing on a dry run but reports old versus new', async () => {
    const f = fakeDb([row('a')]);
    const dir = reportDir();
    const result = await run(f.db, { compose: okCompose() }, { dryRun: true, reportDir: dir });
    expect(result).toMatchObject({ rewritten: 1, wroteBack: 0 });
    expect(f.inserts).toEqual([]);
    expect(f.updates).toEqual([]);
    const md = readFileSync(join(dir, 'backfill-report.md'), 'utf8');
    expect(md).toContain(`Old summary: ${OLD_SUMMARY}`);
    expect(md).toContain(`New lead: ${LEAD}`);
    expect(readFileSync(join(dir, 'backfill-report.jsonl'), 'utf8')).toContain('"outcome":"pass"');
  });
});
