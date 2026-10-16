import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDedupeCandidates } from '../../apps/worker/src/extract/dedupe-gate';
import { runBackfill } from '../../apps/worker/src/extract/backfill-run';
import { mergeNewFactsIntoOriginal } from '../../apps/worker/src/extract/write-knowledge';
import { main as retract } from './retract.mjs';

const MIGRATION_NAMES = [
  '20260718120000_news_init.sql',
  '20260901000000_knowledge_engine.sql',
  '20260902000000_usage_daily.sql',
  '20260909000000_notifications_devices.sql',
  '20260911000000_notifications_events.sql',
  '20261013000000_current_item_quality_hold_reason.sql',
  '20261013010000_current_item_merged_into.sql',
  '20261014010000_tidewatch.sql',
  '20261015030000_watch_decision_shadow_unique.sql',
  '20261015050000_current_item_retracted_at.sql',
];
const MIGRATIONS = MIGRATION_NAMES.map((name) => path.resolve(
  import.meta.dirname, '..', '..', 'supabase', 'migrations', name,
));
const STORY_ID = '10000000-0000-4000-8000-000000000001';
const RETRACTED_ID = '20000000-0000-4000-8000-000000000001';
const WORKER_DEBUNKED_ID = '20000000-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-15T12:00:00.000Z');
const REAPPLY_NOW = new Date('2026-10-16T12:00:00.000Z');
const SUMMARY = 'Taylor announced a new single in an official post today, confirming the title and release timing for listeners around the world. The announcement also included a release date and cover image, giving fans two concrete details from the primary source.';
const DETAIL = Array(70).fill('grounded').join(' ');

type DbResult = { data: Record<string, unknown>[] | null; error: { message: string } | null };

function identifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error(`unsafe identifier: ${value}`);
  return `"${value}"`;
}

function dbValue(value: unknown): unknown {
  return value && typeof value === 'object' ? JSON.stringify(value) : value;
}

class Query {
  private operation: 'select' | 'update' | 'insert' = 'select';
  private columns = '*';
  private values: unknown[] = [];
  private filters: string[] = [];
  private orders: string[] = [];
  private rowLimit: number | null = null;
  private payload: Record<string, unknown> = {};

  constructor(private database: PGlite, private table: string) {}

  private param(value: unknown): string {
    this.values.push(dbValue(value));
    return `$${this.values.length}`;
  }

  select(columns = '*'): this {
    this.columns = columns;
    return this;
  }

  update(payload: Record<string, unknown>): this {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  insert(payload: Record<string, unknown>): this {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push(`${identifier(column)} = ${this.param(value)}`);
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push(value === null
      ? `${identifier(column)} is null`
      : `${identifier(column)} is not distinct from ${this.param(value)}`);
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push(`${identifier(column)} > ${this.param(value)}`);
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push(`${identifier(column)} >= ${this.param(value)}`);
    return this;
  }

  like(column: string, value: unknown): this {
    this.filters.push(`${identifier(column)} like ${this.param(value)}`);
    return this;
  }

  in(column: string, values: unknown[]): this {
    const params = values.map((value) => this.param(value));
    this.filters.push(params.length ? `${identifier(column)} in (${params.join(',')})` : 'false');
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push(`${identifier(column)} ${options?.ascending === false ? 'desc' : 'asc'}`);
    return this;
  }

  limit(value: number): this {
    this.rowLimit = value;
    return this;
  }

  async maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: DbResult['error'] }> {
    const result = await this.execute();
    return { data: result.data?.[0] ?? null, error: result.error };
  }

  then<TResult1 = DbResult, TResult2 = never>(
    resolve?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(resolve, reject);
  }

  private selectedColumns(): string {
    if (this.columns === '*') return '*';
    return this.columns.split(',').map((column) => identifier(column.trim())).join(',');
  }

  private async execute(): Promise<DbResult> {
    try {
      const where = this.filters.length ? ` where ${this.filters.join(' and ')}` : '';
      const order = this.orders.length ? ` order by ${this.orders.join(',')}` : '';
      const limit = this.rowLimit === null ? '' : ` limit ${this.rowLimit}`;
      let sql: string;
      if (this.operation === 'select') {
        sql = `select ${this.selectedColumns()} from public.${identifier(this.table)}${where}${order}${limit}`;
      } else if (this.operation === 'update') {
        const set = Object.entries(this.payload)
          .map(([column, value]) => `${identifier(column)} = ${this.param(value)}`).join(',');
        sql = `update public.${identifier(this.table)} set ${set}${where} returning ${this.selectedColumns()}`;
      } else {
        const entries = Object.entries(this.payload);
        const columns = entries.map(([column]) => identifier(column)).join(',');
        const params = entries.map(([, value]) => this.param(value)).join(',');
        sql = `insert into public.${identifier(this.table)} (${columns}) values (${params}) returning ${this.selectedColumns()}`;
      }
      const result = await this.database.query<Record<string, unknown>>(sql, this.values);
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error: { message: (error as Error).message } };
    }
  }
}

function pgliteClient(database: PGlite): SupabaseClient {
  return { from: (table: string) => new Query(database, table) } as unknown as SupabaseClient;
}

let db: PGlite;
let client: SupabaseClient;

beforeEach(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for (const migration of MIGRATIONS) await db.exec(await readFile(migration, 'utf8'));
  await db.exec(await readFile(MIGRATIONS.at(-1)!, 'utf8'));
  await db.exec('grant usage on schema public to anon; grant select on public.current_item to anon;');
  await db.query('insert into public.news_story (id, canonical_title) values ($1, $2)', [STORY_ID, 'New single']);
  const insert = `insert into public.current_item
    (id, story_id, observed_on, era_id, category, headline, summary, detail, status,
     confidence, source_tier, sources, image_url, expires_at, redline_ok)
    values ($1, $2, '2026-10-15', 'tloas', 'music', $3, $4, $5, $6,
      'reputable_reporting', 'established', $7, 'https://www.people.com/photo.jpg', '2099-01-01', true)`;
  await db.query(insert, [RETRACTED_ID, STORY_ID, 'New single announced', SUMMARY, DETAIL, 'reported', JSON.stringify([
    { name: 'Billboard', url: 'https://billboard.com/first', tier: 'established' },
  ])]);
  await db.query(insert, [WORKER_DEBUNKED_ID, null, 'Fan theory disproven', SUMMARY, DETAIL, 'debunked', JSON.stringify([
    { name: 'People', url: 'https://people.com/theory', tier: 'established' },
  ])]);
  await db.query(`insert into public.knowledge_doc
    (id, kind, tier, title, text, date, recency_date, open, status, source_tier,
     sources, era_id, symbols, entities, expires_at, redline_ok, updated_at)
    values ($1, 'current_item', 'current', $2, $3, '2026-10-15', '2026-10-15', true,
      'reported', 'established', $4, 'tloas', '{}', '{}', '2099-01-01', true, $5)`, [
    `current:${RETRACTED_ID}`, 'New single announced', `${SUMMARY} ${DETAIL}`,
    JSON.stringify([{ name: 'Billboard', url: 'https://billboard.com/first', tier: 'established' }]),
    '2026-10-14T12:00:00.000Z',
  ]);
  client = pgliteClient(db);
});

afterEach(async () => {
  await db.close();
});

describe('retraction lifecycle against real migrations', () => {
  it('preserves a retraction through dedupe and backfill while worker-debunked stays visible', async () => {
    await retract(['--story-id', STORY_ID, '--mode', 'apply', '--confirm', `RETRACT-${STORY_ID}`], {
      client, now: NOW, env: {}, log: vi.fn(),
    });

    const candidates = await loadDedupeCandidates(client, 'tloas');
    expect(candidates.map((candidate) => candidate.id)).toContain(RETRACTED_ID);
    await mergeNewFactsIntoOriginal(client, RETRACTED_ID, {
      headline: 'New single announced', summary: SUMMARY, detail: DETAIL,
      sources: [{ outletName: 'Billboard', url: 'https://billboard.com/first', tier: 'established' }],
      imageUrl: 'https://www.people.com/photo.jpg',
    }, {
      duplicateSources: [{ outletName: 'Variety', url: 'https://variety.com/followup', tier: 'established' }],
    });
    await runBackfill(client, { dryRun: false, limit: 10 });

    const row = await db.query<{ status: string; redline_ok: boolean; retracted_at: string | null; sources: unknown[] }>(
      'select status, redline_ok, retracted_at, sources from public.current_item where id = $1', [RETRACTED_ID],
    );
    expect(row.rows[0]).toMatchObject({ status: 'reported', redline_ok: false });
    expect(row.rows[0]?.retracted_at).not.toBeNull();
    expect(row.rows[0]?.sources).toHaveLength(2);
    const originalRetractedAt = row.rows[0]?.retracted_at;
    const doc = await db.query<{ redline_ok: boolean }>(
      'select redline_ok from public.knowledge_doc where id = $1', [`current:${RETRACTED_ID}`],
    );
    expect(doc.rows[0]?.redline_ok).toBe(false);
    const count = await db.query<{ count: number }>('select count(*)::int as count from public.current_item where story_id = $1', [STORY_ID]);
    expect(count.rows[0]?.count).toBe(1);

    await retract(['--story-id', STORY_ID, '--mode', 'apply', '--confirm', `RETRACT-${STORY_ID}`], {
      client, now: REAPPLY_NOW, env: {}, log: vi.fn(),
    });
    const reapplied = await db.query<{ retracted_at: string | null }>(
      'select retracted_at from public.current_item where id = $1', [RETRACTED_ID],
    );
    expect(reapplied.rows[0]?.retracted_at).toStrictEqual(originalRetractedAt);

    await db.exec('set role anon');
    const visible = await db.query<{ id: string; status: string }>('select id, status from public.current_item order by id');
    await db.exec('reset role');
    expect(visible.rows).toEqual([{ id: WORKER_DEBUNKED_ID, status: 'debunked' }]);
  });
});
