import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(__dirname, '..', '..', 'supabase', 'migrations', '20261014010000_tidewatch.sql'),
  'utf8',
);
const uniquenessSql = readFileSync(
  join(__dirname, '..', '..', 'supabase', 'migrations', '20261015030000_watch_decision_shadow_unique.sql'),
  'utf8',
);
let db: PGlite | undefined;

async function createDatabase() {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role;');
  await db.exec(sql);
  return db;
}

afterEach(async () => {
  await db?.close();
  db = undefined;
});

describe('Tidewatch migration contract', () => {
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

  it('fails on duplicate shadow links and otherwise enforces idempotency without modifying data', () => {
    expect(uniquenessSql).not.toMatch(/\b(update|delete)\s+public\.watch_decision\b/i);
    expect(uniquenessSql).toMatch(/having count\(\*\) > 1[\s\S]*raise exception/i);
    expect(uniquenessSql).toMatch(/create unique index if not exists watch_decision_shadow_item_unique_idx[\s\S]*where shadow is true and item_id is not null/i);
    expect(uniquenessSql).toMatch(/on conflict \(item_id\) where shadow is true and item_id is not null[\s\S]*do nothing/i);
    expect(uniquenessSql).toMatch(/grant execute on function public\.insert_shadow_watch_decisions\(jsonb\)[\s\S]*to service_role/i);
  });

  it('creates the unique index and makes the insert function conflict-safe', async () => {
    const database = await createDatabase();

    await database.exec(uniquenessSql);
    await database.exec(uniquenessSql);

    await database.exec(`
      insert into public.watch_item (id, item_key, source, status)
      values ('10000000-0000-4000-8000-000000000000', 'unique', 'news', 'new');
    `);
    const decisionRows = JSON.stringify([{
      item_id: '10000000-0000-4000-8000-000000000000',
      class: 'noise',
      confidence: 1,
      decider: 'code',
      answers: { kept: true },
      action: 'shadow_only',
    }]).replaceAll("'", "''");
    const first = await database.query(`
      select id from public.insert_shadow_watch_decisions('${decisionRows}'::jsonb)
    `);
    const second = await database.query(`
      select id from public.insert_shadow_watch_decisions('${decisionRows}'::jsonb)
    `);

    const result = await database.query<{ indexname: string }>(`
      select indexname from pg_indexes
      where schemaname = 'public'
        and indexname = 'watch_decision_shadow_item_unique_idx'
    `);
    expect(result.rows).toEqual([{ indexname: 'watch_decision_shadow_item_unique_idx' }]);
    expect(first.rows).toHaveLength(1);
    expect(second.rows).toHaveLength(0);
  });

  it('raises on duplicates without changing rows or creating the function', async () => {
    const database = await createDatabase();
    await database.exec(`
      insert into public.watch_item (id, item_key, source, status)
      values ('10000000-0000-4000-8000-000000000000', 'duplicate', 'news', 'new');
      insert into public.watch_decision
        (id, item_id, class, confidence, decider, answers, action)
      values
        ('20000000-0000-4000-8000-000000000000', '10000000-0000-4000-8000-000000000000', 'noise', 1, 'code', '{"kept": 1}', 'shadow_only'),
        ('30000000-0000-4000-8000-000000000000', '10000000-0000-4000-8000-000000000000', 'noise', 1, 'code', '{"kept": 2}', 'shadow_only');
    `);

    const before = await database.query('select id, item_id, answers from public.watch_decision order by id');
    await expect(database.exec(uniquenessSql)).rejects.toThrow(
      /1 duplicate shadow item_id value\(s\).*Remove or relink.*rerun db:migrate/i,
    );
    const after = await database.query('select id, item_id, answers from public.watch_decision order by id');
    const indexes = await database.query<{ indexname: string }>(`
      select indexname from pg_indexes
      where schemaname = 'public'
        and indexname = 'watch_decision_shadow_item_unique_idx'
    `);
    const functions = await database.query(`
      select proname from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname = 'insert_shadow_watch_decisions'
    `);

    expect(after.rows).toEqual(before.rows);
    expect(indexes.rows).toEqual([]);
    expect(functions.rows).toEqual([]);
  });
});
