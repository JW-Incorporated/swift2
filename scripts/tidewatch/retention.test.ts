import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  NOISE_ITEM_RETENTION_DAYS,
  parseArgs,
  runRetention,
  SHADOW_DECISION_RETENTION_DAYS,
  WATCH_ITEM_RETENTION_DAYS,
} from './retention.mjs';

interface Query {
  sql: string;
  values: unknown[];
}

interface QueryResult {
  rows?: { count: number }[];
  rowCount?: number;
}

class FakeClient {
  readonly queries: Query[] = [];
  private resultIndex = 0;

  constructor(private readonly results: QueryResult[]) {}

  async query(sql: string, values: unknown[]) {
    this.queries.push({ sql, values });
    const result = this.results[this.resultIndex];
    this.resultIndex += 1;
    if (!result) throw new Error('unexpected query');
    return { rows: [], rowCount: null, ...result };
  }
}

const NOW = new Date('2026-10-14T12:00:00.000Z');

describe('Tidewatch retention', () => {
  it('is a count-only dry run by default, including 30-day noise items', async () => {
    const client = new FakeClient([
      { rows: [{ count: 4 }] },
      { rows: [{ count: 12 }] },
      { rows: [{ count: 7 }] },
    ]);
    const log = vi.fn();

    const result = await runRetention(client, { now: NOW, log });

    expect(result).toMatchObject({
      noiseItems: 4,
      watchItems: 12,
      shadowDecisions: 7,
      dryRun: true,
    });
    expect(result.noiseItemCutoff).toBe('2026-09-14T12:00:00.000Z');
    expect(result.itemCutoff).toBe('2026-04-17T12:00:00.000Z');
    expect(result.decisionCutoff).toBe('2025-10-14T12:00:00.000Z');
    expect(client.queries.map(({ values }) => values)).toEqual([
      [result.noiseItemCutoff],
      [result.itemCutoff, result.noiseItemCutoff],
      [result.decisionCutoff],
    ]);
    expect(client.queries[0].sql).toContain('where wd.item_id = item.id');
    expect(client.queries[0].sql).toContain('order by wd.decided_at desc, wd.id desc');
    expect(client.queries[1].sql).toContain('not (item.last_seen_at < $2 and');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dry-run would delete 4 noise'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dry-run would delete 12'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dry-run would delete 7'));
  });

  it('deletes noise items before the 180-day and shadow-decision windows with --apply', async () => {
    const client = new FakeClient([{ rowCount: 2 }, { rowCount: 3 }, { rowCount: 4 }]);

    const result = await runRetention(client, { apply: true, now: NOW, log: vi.fn() });

    expect(result).toMatchObject({
      noiseItems: 2,
      watchItems: 3,
      shadowDecisions: 4,
      dryRun: false,
    });
    expect(client.queries.map(({ values }) => values)).toEqual([
      [result.noiseItemCutoff],
      [result.itemCutoff],
      [result.decisionCutoff],
    ]);
    expect(client.queries.map(({ sql }) => sql)).toEqual([
      expect.stringContaining('delete from public.watch_item item'),
      expect.stringContaining('delete from public.watch_item where last_seen_at < $1'),
      expect.stringContaining('delete from public.watch_decision where shadow = true'),
    ]);
  });

  it('exposes the configured retention periods and requires an explicit apply flag', () => {
    expect(NOISE_ITEM_RETENTION_DAYS).toBe(30);
    expect(WATCH_ITEM_RETENTION_DAYS).toBe(180);
    expect(SHADOW_DECISION_RETENTION_DAYS).toBe(365);
    expect(parseArgs([])).toEqual({ apply: false });
    expect(parseArgs(['--dry-run'])).toEqual({ apply: false });
    expect(parseArgs(['--apply'])).toEqual({ apply: true });
    expect(() => parseArgs(['--apply', '--dry-run'])).toThrow(/mutually exclusive/);
  });
});

describe('Tidewatch migration contract', () => {
  const sql = readFileSync(
    join(__dirname, '..', '..', 'supabase', 'migrations', '20261014010000_tidewatch.sql'),
    'utf8',
  );

  it('declares duplicate item_key values invalid', () => {
    expect(sql).toMatch(/item_key\s+text\s+not null\s+unique/i);
  });

  it('uses the closed source vocabulary and rejects Facebook or overlong excerpts', () => {
    expect(sql).toMatch(
      /source\s+text\s+not null\s+check\s*\(source in \(\s*'official',\s*'news',\s*'youtube',\s*'intake',\s*'merch',\s*'reddit',\s*'facebook',\s*'theory',\s*'social',\s*'moment'\s*\)\)/i,
    );
    expect(sql).toMatch(/char_length\(excerpt\)\s*<=\s*2000/i);
    expect(sql).toMatch(/check\s*\(source\s*<>\s*'facebook'\s+or\s+excerpt\s+is\s+null\)/i);
  });

  it('enables RLS and limits table privileges to service_role', () => {
    for (const table of [
      'watch_item',
      'watch_decision',
      'watch_cursor',
      'story_timeline',
      'llm_usage',
    ]) {
      expect(sql).toMatch(
        new RegExp(`alter table public\\.${table}\\s+enable row level security`, 'i'),
      );
    }
    expect(sql).not.toMatch(/create\s+policy/i);
    expect(sql).toMatch(
      /revoke all on table public\.watch_item, public\.watch_decision, public\.watch_cursor, public\.story_timeline, public\.llm_usage from public, anon, authenticated;/i,
    );
    expect(sql).toMatch(
      /grant all on table public\.watch_item, public\.watch_decision, public\.watch_cursor, public\.story_timeline, public\.llm_usage to service_role;/i,
    );
  });
});
