import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runBackfill } from './backfill-run';
import type { ForceDeps } from './backfill-types';
import type { checkSameEvent } from './dedupe-gate-llm';
import type { ExtractUsageStore } from './usage-store';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const FUTURE = new Date(Date.now() + 30 * 86_400_000).toISOString();
const SUMMARY = 'Taylor announced a new surprise release on Friday night, and fans noticed it right away. The drop came with a short note and a tracklist that spans eleven songs in total.';
const DETAIL = Array.from({ length: 70 }, (_, i) => `word${i}`).join(' ');
const STRONG = [{ name: 'People', url: 'https://people.com/a', tier: 'established' }];
const FACT = { id: 'f1', claim: 'Taylor announced a release', attribution: 'People', confidence: 'reported' as const };
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

function row(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id, headline: `Story${id.slice(0, 1)} ${id}`, summary: SUMMARY, detail: DETAIL, image_url: 'https://www.billboard.com/ok.jpg',
    sources: STRONG, era_id: 'tloas', observed_on: daysAgo(1), category: 'release', tags: [], status: 'reported',
    source_tier: 'established', symbols: [], entities: [], redline_ok: true,
    promoted_to: null, merged_into: null, retracted_at: null, facts: null, expires_at: FUTURE,
    ...overrides,
  };
}

interface Call { table: string; op: 'insert' | 'update'; values: Record<string, unknown>; guards: string[]; id?: unknown }

function fakeDb(rows: Record<string, unknown>[]) {
  const calls: Call[] = [];
  const from = (table: string) => {
    let pending: Call | undefined;
    let filtered = rows;
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
    b.gt = () => b;
    b.gte = () => b;
    b.order = (column: string, o: { ascending?: boolean } = {}) => {
      filtered = [...filtered].sort((x, y) => (String(x[column]) < String(y[column]) ? -1 : 1) * (o.ascending === false ? -1 : 1));
      return b;
    };
    b.limit = () => b;
    b.maybeSingle = () => { single = true; return b; };
    b.single = () => b;
    b.update = (values: Record<string, unknown>) => { pending = { table, op: 'update', values, guards: [] }; return b; };
    b.insert = (values: Record<string, unknown>) => {
      calls.push({ table, op: 'insert', values, guards: [] });
      const inserted = { data: { id: calls.length }, error: null };
      return { error: null, select: () => ({ single: async () => inserted }) };
    };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending && 'backfill_attempted_at' in pending.values) return resolve({ error: null });
      if (pending) {
        calls.push(pending);
        return resolve({ data: filtered.map((r) => ({ id: r.id })), error: null });
      }
      return resolve({ data: single ? (filtered[0] ?? null) : filtered, error: null });
    };
    return b;
  };
  return { db: { from } as unknown as SupabaseClient, calls };
}

const SCORES: Record<string, number> = {};

function deps(overrides: Partial<ForceDeps> = {}): ForceDeps & { sameEvent: ReturnType<typeof vi.fn> } {
  const sameEvent = vi.fn(async (_u: unknown, subject: { headline: string }, candidates: { id: string; headline: string }[]) => {
    const match = candidates.find((c) => c.headline.split(' ')[0] === subject.headline.split(' ')[0]);
    return { sameEvent: Boolean(match), matchId: match?.id ?? null, addsNewInfo: false, newFacts: [] };
  });
  return {
    usage: {} as ExtractUsageStore,
    stores: { writer: {} as ExtractUsageStore, judge: {} as ExtractUsageStore },
    fetchArticles: vi.fn(async () => []),
    extract: vi.fn(async () => ({
      kind: 'current_item' as const, redlineFlags: [],
      currentItem: { observedOn: daysAgo(1), category: 'release', tags: [], headline: 'x', summary: 's', detail: 'd', symbols: [], entities: ['Taylor'], statusHint: 'reported', facts: [FACT] },
    })) as unknown as ForceDeps['extract'],
    compose: vi.fn(async (_db: unknown, _stores: unknown, item: { headline: string; facts: unknown[] }, _s: unknown, _e: unknown, ref: { id: string }) => {
      const score = SCORES[ref.id];
      return {
        item: { ...item, summary: LEAD, detail: BODY },
        v2: score === undefined ? { facts: item.facts, holdReason: 'writing_quality:grounding' } : { facts: item.facts, writingScore: score },
        trace: { lead: LEAD, body: BODY, citations: [{ sentence: 0, ref: 'f1' }], rewrites: 0 },
        contextIds: [], context: { items: [], text: '[c1]' },
      };
    }) as unknown as ForceDeps['compose'],
    sameEvent: sameEvent as unknown as typeof checkSameEvent,
    ...overrides,
  } as ForceDeps & { sameEvent: ReturnType<typeof vi.fn> };
}

const reportDir = () => mkdtempSync(join(tmpdir(), 'backfill-dedupe-'));
const ops = (calls: Call[]) => calls.map((c) => `${c.table}:${c.op}`);

describe('cross-row duplicates', () => {
  it('keeps the best-scored passing row, retires the rest snapshot first with merged_into', async () => {
    Object.assign(SCORES, { 'A-low': 3, 'A-high': 5, 'B-solo': 4 });
    const { db, calls } = fakeDb([row('A-low'), row('A-high'), row('B-solo')]);
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(result.force?.duplicateGroups).toHaveLength(1);
    expect(result.force?.duplicateGroups[0]?.keep).toBe('A-high');
    expect([...(result.force?.duplicateGroups[0]?.members ?? [])].sort()).toEqual(['A-high', 'A-low']);
    const retire = calls.filter((c) => c.values.quality_hold_reason === 'retired_duplicate');
    expect(retire).toHaveLength(1);
    expect(retire[0]!.values).toEqual({ redline_ok: false, quality_hold_reason: 'retired_duplicate', merged_into: 'A-high' });
    expect(retire[0]!.id).toBe('A-low');
    expect(retire[0]!.guards).toEqual(['facts', 'merged_into', 'retracted_at', 'promoted_to']);
    const snapIndex = calls.findIndex((c) => c.table === 'current_item_copy_snapshot' && c.values.current_item_id === 'A-low');
    expect(calls[snapIndex]!.values).toMatchObject({ reason: 'retire_duplicate' });
    expect(snapIndex).toBeLessThan(calls.indexOf(retire[0]!));
    const written = calls.filter((c) => c.table === 'current_item' && 'summary' in c.values).map((c) => c.id);
    expect(written.sort()).toEqual(['A-high', 'B-solo']);
    expect(result.force).toMatchObject({ duplicatesFound: 1, retiredDuplicates: 1 });
  });

  it('keeps none when no member passes and retires them all', async () => {
    delete SCORES['C-1'];
    delete SCORES['C-2'];
    const { db, calls } = fakeDb([row('C-1'), row('C-2')]);
    const result = await runBackfill(db, { dryRun: false, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(result.force?.duplicateGroups).toHaveLength(1);
    expect(result.force?.duplicateGroups[0]?.keep).toBeNull();
    const retired = calls.filter((c) => c.values.quality_hold_reason === 'retired_duplicate');
    expect(retired).toHaveLength(2);
    for (const r of retired) expect(r.values).not.toHaveProperty('merged_into');
    expect(result.force?.retiredDuplicates).toBe(2);
  });

  it('breaks a score tie by more facts, then earlier observed_on', async () => {
    Object.assign(SCORES, { 'D-new': 4, 'D-old': 4 });
    const { db } = fakeDb([row('D-new', { observed_on: daysAgo(1) }), row('D-old', { observed_on: daysAgo(2) })]);
    const result = await runBackfill(db, { dryRun: true, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(result.force?.duplicateGroups[0]?.keep).toBe('D-old');
  });

  it('only compares rows within 3 days of each other', async () => {
    Object.assign(SCORES, { 'E-near': 4, 'E-far': 4 });
    const d = deps();
    const { db } = fakeDb([row('E-near', { observed_on: daysAgo(1) }), row('E-far', { observed_on: daysAgo(6) })]);
    const result = await runBackfill(db, { dryRun: true, mode: 'force', reportDir: reportDir(), force: d });
    expect(result.force?.duplicateGroups).toEqual([]);
    expect(d.sameEvent).not.toHaveBeenCalled();
  });

  it('writes nothing on a dry run but reports the groups', async () => {
    Object.assign(SCORES, { 'F-1': 3, 'F-2': 5 });
    const { db, calls } = fakeDb([row('F-1'), row('F-2')]);
    const result = await runBackfill(db, { dryRun: true, mode: 'force', reportDir: reportDir(), force: deps() });
    expect(calls).toEqual([]);
    expect(result.force).toMatchObject({ duplicatesFound: 1, retiredDuplicates: 0, outcomes: { pass: 1, retired_duplicate: 1 } });
  });
});

describe('retire unwritable', () => {
  const noFacts = () => ({ ...deps(), extract: vi.fn(async () => ({ kind: 'current_item' as const, redlineFlags: [], currentItem: null })) as unknown as ForceDeps['extract'] });

  it('snapshots, then hides a no_facts row with a guarded update', async () => {
    const { db, calls } = fakeDb([row('Gx')]);
    const result = await runBackfill(db, { dryRun: false, mode: 'force', retireUnwritable: true, reportDir: reportDir(), force: noFacts() });
    expect(ops(calls)).toEqual(['current_item_copy_snapshot:insert', 'current_item:update']);
    expect(calls[0]!.values).toMatchObject({ current_item_id: 'Gx', reason: 'retire_unwritable' });
    expect(calls[1]!.values).toEqual({ redline_ok: false, quality_hold_reason: 'retired_unwritable' });
    expect(calls[1]!.guards).toEqual(['facts', 'merged_into', 'retracted_at', 'promoted_to']);
    expect(result.force).toMatchObject({ unwritableFound: 1, retiredUnwritable: 1, outcomes: { retired_unwritable: 1 } });
  });

  it('retires a writing_hold row too', async () => {
    delete SCORES['Hx'];
    const { db, calls } = fakeDb([row('Hx')]);
    const result = await runBackfill(db, { dryRun: false, mode: 'force', retireUnwritable: true, reportDir: reportDir(), force: deps() });
    expect(calls.at(-1)!.values).toMatchObject({ quality_hold_reason: 'retired_unwritable' });
    expect(result.force?.retiredUnwritable).toBe(1);
  });

  it('writes nothing without the flag or on a dry run, but counts them', async () => {
    for (const options of [{ dryRun: false }, { dryRun: true, retireUnwritable: true }]) {
      const { db, calls } = fakeDb([row('Gx')]);
      const result = await runBackfill(db, { mode: 'force', reportDir: reportDir(), force: noFacts(), ...options });
      expect(calls).toEqual([]);
      expect(result.force).toMatchObject({ unwritableFound: 1, retiredUnwritable: 0 });
    }
  });

  it('never retires a deferred row', async () => {
    const { db, calls } = fakeDb([row('Gx')]);
    const extract = vi.fn(async () => null) as unknown as ForceDeps['extract'];
    const result = await runBackfill(db, { dryRun: false, mode: 'force', retireUnwritable: true, reportDir: reportDir(), force: { ...deps(), extract } });
    expect(calls).toEqual([]);
    expect(result.force).toMatchObject({ deferred: true, retiredUnwritable: 0 });
  });
});
