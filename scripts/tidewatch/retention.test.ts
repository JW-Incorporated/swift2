import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  parseArgs,
  runRetention,
  SHADOW_DECISION_RETENTION_DAYS,
  WATCH_ITEM_RETENTION_DAYS,
} from './retention.mjs';

interface Operation {
  table: string;
  kind: 'select' | 'delete' | null;
  options: Record<string, unknown> | undefined;
  filters: [string, string, unknown][];
}

class FakeQuery {
  constructor(
    private readonly operation: Operation,
    private readonly counts: Record<string, number>,
  ) {}

  select(_columns: string, options?: Record<string, unknown>) {
    this.operation.kind = 'select';
    this.operation.options = options;
    return this;
  }

  delete(options?: Record<string, unknown>) {
    this.operation.kind = 'delete';
    this.operation.options = options;
    return this;
  }

  eq(column: string, value: unknown) {
    this.operation.filters.push(['eq', column, value]);
    return this;
  }

  lt(column: string, value: unknown) {
    this.operation.filters.push(['lt', column, value]);
    return this;
  }

  then(resolve: (value: { count: number; error: null }) => unknown) {
    const key = `${this.operation.kind}:${this.operation.table}`;
    return Promise.resolve(resolve({ count: this.counts[key] ?? 0, error: null }));
  }
}

class FakeClient {
  readonly operations: Operation[] = [];

  constructor(private readonly counts: Record<string, number>) {}

  from(table: string) {
    const operation: Operation = { table, kind: null, options: undefined, filters: [] };
    this.operations.push(operation);
    return new FakeQuery(operation, this.counts);
  }
}

const NOW = new Date('2026-10-14T12:00:00.000Z');

describe('Tidewatch retention', () => {
  it('is a count-only dry run by default', async () => {
    const client = new FakeClient({ 'select:watch_item': 12, 'select:watch_decision': 7 });
    const log = vi.fn();

    const result = await runRetention(client, { now: NOW, log });

    expect(result).toMatchObject({ watchItems: 12, shadowDecisions: 7, dryRun: true });
    expect(result.itemCutoff).toBe('2026-04-17T12:00:00.000Z');
    expect(result.decisionCutoff).toBe('2025-10-14T12:00:00.000Z');
    expect(client.operations).toEqual([
      {
        table: 'watch_item',
        kind: 'select',
        options: { count: 'exact', head: true },
        filters: [['lt', 'last_seen_at', result.itemCutoff]],
      },
      {
        table: 'watch_decision',
        kind: 'select',
        options: { count: 'exact', head: true },
        filters: [
          ['eq', 'shadow', true],
          ['lt', 'decided_at', result.decisionCutoff],
        ],
      },
    ]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dry-run would delete 12'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dry-run would delete 7'));
  });

  it('deletes only expired items and expired shadow decisions with --apply', async () => {
    const client = new FakeClient({ 'delete:watch_item': 3, 'delete:watch_decision': 2 });

    const result = await runRetention(client, { apply: true, now: NOW, log: vi.fn() });

    expect(result).toMatchObject({ watchItems: 3, shadowDecisions: 2, dryRun: false });
    expect(client.operations.map(({ table, kind }) => [table, kind])).toEqual([
      ['watch_decision', 'delete'],
      ['watch_item', 'delete'],
    ]);
    expect(client.operations[0].filters).toContainEqual(['eq', 'shadow', true]);
    expect(client.operations[1].filters).toEqual([['lt', 'last_seen_at', result.itemCutoff]]);
  });

  it('exposes the configured retention periods and requires an explicit apply flag', () => {
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

  it('declares overlong and Facebook excerpts invalid', () => {
    expect(sql).toMatch(/char_length\(excerpt\)\s*<=\s*2000/i);
    expect(sql).toMatch(/lower\(source\)\s*!~\s*'\^\(facebook\|fb\)/i);
  });

  it('enables RLS on all five tables without anon or authenticated policies', () => {
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
  });
});
