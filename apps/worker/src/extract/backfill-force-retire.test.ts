import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
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

interface Call { table: string; op: 'insert' | 'update'; values: Record<string, unknown>; guards: string[] }

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
    b.eq = (c: string, v: unknown) => { filtered = filtered.filter((r) => r[c] === v); return b; };
    b.gt = () => b;
    b.order = () => b;
    b.limit = () => b;
    b.maybeSingle = () => { single = true; return b; };
    b.update = (values: Record<string, unknown>) => { pending = { table, op: 'update', values, guards: [] }; return b; };
    b.insert = async (values: Record<string, unknown>) => { calls.push({ table, op: 'insert', values, guards: [] }); return { error: null }; };
    b.then = (resolve: (v: unknown) => void) => {
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
