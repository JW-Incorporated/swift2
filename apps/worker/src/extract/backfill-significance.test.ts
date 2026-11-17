import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { BACKFILL_DAILY_CAP, BACKFILL_PER_RUN_CAP, BACKFILL_SIGNIFICANCE_SCOPE } from './backfill-budget';
import { loadSignificanceSelection } from './backfill-significance-load';
import { runBackfill } from './backfill-run';
import type { SignificanceDeps } from './backfill-types';
import type { SignificanceVerdict } from './significance-client';
import type { SignificanceInput } from './significance-prompt';
import type { ExtractUsageStore } from './usage-store';

const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString();
const SUMMARY = 'A surprise release landed overnight and the fandom is already dissecting it track by track. The tracklist spans eleven songs, and the early read is that it leans toward the stripped-back sound of her folklore years.';
const DETAIL = [
  'Taylor posted the announcement on Friday night with a short handwritten note and a cover shot in warm amber light.',
  'Within minutes, fan accounts had mapped the eleven titles against earlier clues scattered across her recent social posts.',
  'Pre-save links opened for streaming platforms in the United States, Britain and Australia before midnight Eastern time.',
  'Critics who heard advance copies described acoustic guitars, brushed drums and a closing ballad written at her piano.',
  'That palette recalls the quiet cabin recordings of 2020, though collaborators this time include a new producer from Nashville.',
  'Merch followed quickly, with a vinyl variant and a lyric booklet listed for shipping in December.',
  'Ticket holders for the upcoming shows should watch for setlist changes, since two songs were reportedly rehearsed already.',
  'Nothing about live plans is confirmed, and representatives have not commented on the rollout schedule yet.',
].join(' ');
const FACTS = [{ id: 'f1', claim: 'Taylor announced a release', attribution: 'People', confidence: 'reported' as const }];
const SOURCES = [{ name: 'People', url: 'https://people.com/a', tier: 'established' }];

function row(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id, headline: `Headline ${id}`, summary: SUMMARY, detail: DETAIL, image_url: 'https://www.billboard.com/ok.jpg',
    sources: SOURCES, era_id: 'tloas', observed_on: new Date().toISOString().slice(0, 10), category: 'release', tags: [],
    status: 'reported', source_tier: 'established', symbols: [], entities: [], redline_ok: true, writing_score: 3,
    promoted_to: null, merged_into: null, retracted_at: null, facts: FACTS, expires_at: FUTURE, significance_verdict: null,
    quality_hold_reason: null,
    ...overrides,
  };
}

interface Call { table: string; op: 'insert' | 'update'; values: Record<string, unknown>; guards: string[]; id?: unknown }

function fakeDb(items: Record<string, unknown>[], opts: { verdictError?: boolean } = {}) {
  const calls: Call[] = [];
  const from = (table: string) => {
    let filtered = items;
    let pending: Call | undefined;
    let single = false;
    const b: Record<string, unknown> = {};
    b.select = () => b;
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
    b.in = (c: string, vs: unknown[]) => { filtered = filtered.filter((r) => vs.includes(r[c])); return b; };
    b.gt = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) > v); return b; };
    b.gte = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) >= v); return b; };
    b.order = () => b;
    b.limit = () => b;
    b.maybeSingle = () => { single = true; return b; };
    b.single = () => b;
    b.update = (values: Record<string, unknown>) => { pending = { table, op: 'update', values, guards: [] }; return b; };
    b.insert = (values: Record<string, unknown>) => {
      calls.push({ table, op: 'insert', values, guards: [] });
      return { select: () => ({ single: async () => ({ data: { id: 1 }, error: null }) }) };
    };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending) {
        if (opts.verdictError && 'significance_verdict' in pending.values) return resolve({ error: { message: 'boom' } });
        calls.push(pending);
        for (const r of filtered) Object.assign(r, pending.values);
        return resolve({ data: filtered.map((r) => ({ id: r.id })), error: null });
      }
      return resolve({ data: single ? (filtered[0] ? { ...filtered[0] } : null) : filtered, error: null });
    };
    return b;
  };
  return { db: { from } as unknown as SupabaseClient, calls, items };
}

const ok = (tier: 1 | 2 | 3, reason = `tier ${tier}`): SignificanceVerdict => ({ status: 'ok', tier, reason, model: 'claude-opus-5-5' });
const store = {} as ExtractUsageStore;
const reportDir = () => mkdtempSync(join(tmpdir(), 'backfill-significance-'));
const run = (db: SupabaseClient, judge: SignificanceDeps['judge'], extra: Record<string, unknown> = {}) =>
  runBackfill(db, { dryRun: false, mode: 'significance', limit: 100, reportDir: reportDir(), significance: { judge, store }, ...extra });
const verdictWrites = (calls: Call[]) => calls.filter((c) => c.table === 'current_item' && 'significance_verdict' in c.values);

describe('loadSignificanceSelection', () => {
  it('selects live rows with or without facts and skips rows that already hold a verdict', async () => {
    const { db } = fakeDb([
      row('ok'),
      row('no-facts', { facts: null }),
      row('judged', { significance_verdict: { tier: 2 } }),
      row('merged', { merged_into: 'x' }),
      row('retracted', { retracted_at: '2026-01-01' }),
      row('promoted', { promoted_to: 'm' }),
      row('retired', { redline_ok: false }),
      row('expired', { expires_at: '2020-01-01T00:00:00Z' }),
    ]);
    const { candidates } = await loadSignificanceSelection(db);
    expect(candidates.map((c) => c.id).sort()).toEqual(['no-facts', 'ok']);
  });

  it('honours ids as given, including an already-judged row, and applies the limit', async () => {
    const { db } = fakeDb([row('a', { significance_verdict: { tier: 2 } }), row('b'), row('c')]);
    expect((await loadSignificanceSelection(db, 0, new Date(), undefined, ['a'])).candidates.map((c) => c.id)).toEqual(['a']);
    expect((await loadSignificanceSelection(db, 1)).candidates).toHaveLength(1);
  });

  it('reports rows the read gate hides instead of judging them', async () => {
    const { db } = fakeDb([row('noimg', { image_url: null }), row('fine')]);
    const { candidates, unservable } = await loadSignificanceSelection(db);
    expect(candidates.map((c) => c.id)).toEqual(['fine']);
    expect(unservable).toHaveLength(1);
  });
});

describe('significance backfill', () => {
  it('writes a verdict for every judged row and retires only tier 3, keeping 1 and 2', async () => {
    const { db, calls, items } = fakeDb([row('t1'), row('t2'), row('t3')]);
    const tiers: Record<string, 1 | 2 | 3> = { 'Headline t1': 1, 'Headline t2': 2, 'Headline t3': 3 };
    const judge = vi.fn(async (_s: unknown, input: { headline: string }) => ok(tiers[input.headline]!));
    const result = await run(db, judge );
    expect(verdictWrites(calls)).toHaveLength(3);
    expect(verdictWrites(calls)[0]!.values.significance_verdict).toMatchObject({ tier: expect.any(Number), model: 'claude-opus-5-5', at: expect.any(String) });
    const t3 = items.find((i) => i.id === 't3')!;
    expect(t3).toMatchObject({ redline_ok: false, quality_hold_reason: 'retired_not_notable' });
    expect(items.filter((i) => i.redline_ok === true).map((i) => i.id)).toEqual(['t1', 't2']);
    expect(result.significance).toMatchObject({ judged: 3, tier1: 1, tier2: 1, tier3: 1, wouldRetire: 1, retired: 1, deferred: 0 });
  });

  it('snapshots a tier-3 row with its facts and score before hiding it', async () => {
    const { db, calls } = fakeDb([row('t3')]);
    await run(db, async () => ok(3));
    const snapshot = calls.find((c) => c.table === 'current_item_copy_snapshot')!;
    expect(snapshot.values).toMatchObject({ current_item_id: 't3', summary: SUMMARY, facts: FACTS, writing_score: 3, reason: 'retire_not_notable' });
    const order = calls.map((c) => `${c.table}:${c.op}`);
    expect(order).toEqual(['current_item_copy_snapshot:insert', 'current_item:update', 'current_item:update']);
    const hide = calls[1]!;
    expect(hide.values).toEqual({ redline_ok: false, quality_hold_reason: 'retired_not_notable' });
    expect(hide.guards).toEqual(['merged_into', 'retracted_at', 'promoted_to']);
  });

  it('retires a factless live row too, judging it on its headline', async () => {
    const { db, items } = fakeDb([row('old', { facts: null })]);
    const judge = vi.fn(async (_s: unknown, input: SignificanceInput) => { expect(input.facts).toEqual(['Headline old']); return ok(3); });
    await run(db, judge as SignificanceDeps['judge']);
    expect(items[0]).toMatchObject({ quality_hold_reason: 'retired_not_notable' });
  });

  it('retires a layer-1 rule hit without calling the judge, and stores a rules verdict', async () => {
    const { db, calls, items } = fakeDb([row('rule', { headline: '10 best Taylor Swift outfits ranked: top 10 looks' })]);
    const judge = vi.fn(async () => ok(1));
    const result = await run(db, judge as SignificanceDeps['judge']);
    expect(judge).not.toHaveBeenCalled();
    expect(verdictWrites(calls)[0]!.values.significance_verdict).toMatchObject({ tier: 3, reason: 'rule:listicle', model: 'rules' });
    expect(items[0]).toMatchObject({ quality_hold_reason: 'retired_not_notable' });
    expect(result.significance).toMatchObject({ ruleHeld: 1, tier3: 1, retired: 1 });
  });

  it('passes distinct-host heat to the judge', async () => {
    const sources = [
      { name: 'People', url: 'https://people.com/a', tier: 'established' },
      { name: 'People', url: 'https://people.com/b', tier: 'established' },
      { name: 'Billboard', url: 'https://www.billboard.com/c', tier: 'established' },
    ];
    const { db } = fakeDb([row('heat', { sources })]);
    const judge = vi.fn(async (_s: unknown, input: SignificanceInput) => {
      expect(input).toMatchObject({ heat: 2, sources: ['People', 'Billboard'] });
      return ok(2);
    });
    await run(db, judge as SignificanceDeps['judge']);
    expect(judge).toHaveBeenCalledOnce();
  });

  it('keeps a deferred row, writes nothing for it and reports it', async () => {
    const { db, calls, items } = fakeDb([row('d')]);
    const result = await run(db, async () => ({ status: 'deferred', reason: 'invalid_tier' }));
    expect(calls).toEqual([]);
    expect(items[0]).toMatchObject({ redline_ok: true });
    expect(result.significance).toMatchObject({ judged: 0, deferred: 1, retired: 0, stoppedEarly: false });
    expect(result.significance!.outcomes).toEqual({ deferred: 1 });
  });

  it('stops on an exhausted budget, keeps the rest untouched and reports what remains', async () => {
    const { db, calls } = fakeDb([row('a'), row('b'), row('c')]);
    const judge = vi.fn()
      .mockResolvedValueOnce(ok(2))
      .mockResolvedValueOnce({ status: 'deferred', reason: 'budget_exhausted' });
    const result = await run(db, judge);
    expect(judge).toHaveBeenCalledTimes(2);
    expect(verdictWrites(calls)).toHaveLength(1);
    expect(result.significance).toMatchObject({ judged: 1, deferred: 1, stoppedEarly: true, remaining: 1 });
  });

  it('writes nothing on a dry run but reports the would-retire decision for every row', async () => {
    const { db, calls } = fakeDb([row('t2'), row('t3')]);
    const dir = reportDir();
    const result = await run(db, async (_s, input) => ok(input.headline.endsWith('t3') ? 3 : 2), { dryRun: true, reportDir: dir });
    expect(calls).toEqual([]);
    expect(result.significance).toMatchObject({ judged: 2, wouldRetire: 1, retired: 0 });
    const lines = readFileSync(join(dir, 'significance-report.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.id === 't3')).toMatchObject({ headline: 'Headline t3', outlet: 'People', by: 'judge', tier: 3, decision: 'retire', outcome: 'would_retire' });
    expect(lines.find((l) => l.id === 't2')).toMatchObject({ tier: 2, decision: 'keep', outcome: 'keep' });
    const md = readFileSync(join(dir, 'significance-report.md'), 'utf8');
    expect(md).toContain('DRY RUN');
    expect(md).toContain('Would retire: 1');
  });

  it('reports a verdict write failure after a landed retire; the row stays hidden', async () => {
    const { db, items } = fakeDb([row('t3')], { verdictError: true });
    const result = await run(db, async () => ok(3));
    expect(items[0]).toMatchObject({ redline_ok: false, quality_hold_reason: 'retired_not_notable' });
    expect(result.significance).toMatchObject({ retired: 1, skippedWriteFailures: 1 });
    expect(result.errors[0]).toContain('verdict not written');
  });

  it('skips a row that changed before it was retired', async () => {
    const { db, items } = fakeDb([row('t3')]);
    const result = await run(db, async () => { Object.assign(items[0]!, { retracted_at: '2026-11-08' }); return ok(3); });
    expect(result.significance).toMatchObject({ retired: 0, skippedWriteFailures: 1 });
    expect(items[0]).toMatchObject({ redline_ok: true });
    expect(items[0]!.significance_verdict).toBeNull();
  });

  it('requires ids or a limit of 1-100 for a live run, but not for a dry run', async () => {
    const { db } = fakeDb([row('a')]);
    const base = { dryRun: false, mode: 'significance' as const, reportDir: reportDir(), significance: { judge: async () => ok(2), store } };
    await expect(runBackfill(db, base)).rejects.toThrow(/needs ids or a limit/);
    await expect(runBackfill(db, { ...base, limit: 0 })).rejects.toThrow(/needs ids or a limit/);
    await expect(runBackfill(db, { ...base, limit: 101 })).rejects.toThrow(/needs ids or a limit/);
    await expect(runBackfill(db, { ...base, limit: 100 })).resolves.toBeDefined();
    await expect(runBackfill(db, { ...base, ids: ['a'] })).resolves.toBeDefined();
    await expect(runBackfill(db, { ...base, dryRun: true })).resolves.toBeDefined();
  });

  it('never judges or retires a row with a NULL headline', async () => {
    const { db, calls, items } = fakeDb([row('nullhead', { headline: null }), row('emptyhead', { headline: '' })]);
    const judge = vi.fn(async () => ok(3));
    const result = await run(db, judge);
    expect(judge).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
    expect(items.every((i) => i.redline_ok === true)).toBe(true);
    expect(result.significance).toMatchObject({ eligible: 0, skippedUnservable: 2 });
  });

  it('rejects both retire flags', async () => {
    const { db } = fakeDb([row('a')]);
    await expect(run(db, async () => ok(3), { retireBelowFloor: true })).rejects.toThrow(/retires only not_notable/);
    await expect(run(db, async () => ok(3), { retireUnwritable: true })).rejects.toThrow(/retires only not_notable/);
  });

  it('uses its own budget scope with the backfill caps', () => {
    expect(BACKFILL_SIGNIFICANCE_SCOPE).toBe('backfill-significance');
    expect([BACKFILL_PER_RUN_CAP, BACKFILL_DAILY_CAP]).toEqual([150, 300]);
  });
});
