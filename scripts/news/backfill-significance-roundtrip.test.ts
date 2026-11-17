import type { SupabaseClient } from '@supabase/supabase-js';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBackfill } from '../../apps/worker/src/extract/backfill-run';
import type { ExtractUsageStore } from '../../apps/worker/src/extract/usage-store';
import { RETIRED_REASONS } from '../../apps/worker/src/extract/backfill-retire';
import { RETIRED_HOLD_REASONS, clearRetired } from './restore-copy-snapshot.mjs';

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

function fakeDb(items: Record<string, unknown>[], snapshots: Record<string, unknown>[]) {
  const from = (table: string) => {
    let filtered = table === 'current_item' ? items : snapshots;
    let pending: Record<string, unknown> | undefined;
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.is = (c: string, v: unknown) => { filtered = filtered.filter((r) => (r[c] ?? null) === v); return b; };
    b.eq = (c: string, v: unknown) => { filtered = filtered.filter((r) => r[c] === v); return b; };
    b.in = (c: string, vs: unknown[]) => { filtered = filtered.filter((r) => vs.includes(r[c])); return b; };
    b.or = (filter: string) => {
      const excluded = /not\.in\.\(([^)]*)\)/.exec(filter)![1]!.split(',');
      filtered = filtered.filter((r) => !excluded.includes(String(r.quality_hold_reason)));
      return b;
    };
    b.gt = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) > v); return b; };
    b.gte = (c: string, v: string) => { filtered = filtered.filter((r) => String(r[c]) >= v); return b; };
    b.order = () => b;
    b.limit = () => b;
    b.maybeSingle = () => { b.single_ = true; return b; };
    b.single = () => b;
    b.update = (values: Record<string, unknown>) => { pending = values; return b; };
    b.insert = (values: Record<string, unknown>) => {
      snapshots.push({ ...values, snapshot_at: new Date().toISOString() });
      return { select: () => ({ single: async () => ({ data: { id: snapshots.length }, error: null }) }) };
    };
    b.then = (resolve: (v: unknown) => void) => {
      if (pending) {
        for (const r of filtered) Object.assign(r, pending);
        return resolve({ data: filtered.map((r) => ({ id: r.id })), error: null });
      }
      return resolve({ data: b.single_ ? (filtered[0] ? { ...filtered[0] } : null) : filtered, error: null });
    };
    return b;
  };
  return { from } as unknown as SupabaseClient;
}

describe('retired_not_notable round trip', () => {
  it('a tier-3 retirement is undone by clearRetired and the row is live again with its copy intact', async () => {
    const item: Record<string, unknown> = {
      id: 'nn', headline: 'Celebrity weighs in on Taylor', summary: SUMMARY, detail: DETAIL, image_url: 'https://www.billboard.com/ok.jpg',
      sources: [{ name: 'People', url: 'https://people.com/a', tier: 'established' }], era_id: 'tloas',
      observed_on: new Date().toISOString().slice(0, 10), category: 'release', tags: [], status: 'reported', source_tier: 'established',
      symbols: [], entities: [], redline_ok: true, writing_score: 3, promoted_to: null, merged_into: null, retracted_at: null,
      facts: [{ id: 'f1', claim: 'A claim', attribution: 'People', confidence: 'reported' }],
      expires_at: new Date(Date.now() + 86_400_000).toISOString(), significance_verdict: null, quality_hold_reason: null,
    };
    const snapshots: Record<string, unknown>[] = [];
    const db = fakeDb([item], snapshots);
    const store = {} as ExtractUsageStore;
    await runBackfill(db, {
      dryRun: false, mode: 'significance', limit: 100, reportDir: mkdtempSync(join(tmpdir(), 'sig-roundtrip-')),
      significance: { store, judge: async () => ({ status: 'ok', tier: 3, reason: 'noise', model: 'claude-opus-5-5' }) },
    });
    expect(item).toMatchObject({ redline_ok: false, quality_hold_reason: 'retired_not_notable' });
    expect(snapshots[0]).toMatchObject({ reason: 'retire_not_notable', current_item_id: 'nn' });

    const result = await clearRetired(db, { dryRun: false });
    expect(result).toMatchObject({ found: 1, restored: 1, errors: [] });
    expect(item).toMatchObject({ redline_ok: true, quality_hold_reason: null, summary: SUMMARY, detail: DETAIL });
    expect(item.significance_verdict).toMatchObject({ tier: 3 });
  });

  it('a default floors run never loads or revives a retired_not_notable row', async () => {
    const retired: Record<string, unknown> = {
      id: 'nn', headline: 'Noise', summary: SUMMARY, detail: DETAIL, image_url: null, sources: [], redline_ok: false,
      quality_hold_reason: 'retired_not_notable', promoted_to: null, merged_into: null, retracted_at: null,
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    };
    const db = fakeDb([retired], []);
    await runBackfill(db, { dryRun: false });
    expect(retired).toMatchObject({ redline_ok: false, quality_hold_reason: 'retired_not_notable' });
  });

  it('keeps the clear-retired reason list in step with the worker RETIRED_REASONS', () => {
    expect([...RETIRED_HOLD_REASONS].sort()).toEqual([...RETIRED_REASONS].sort());
  });
});
