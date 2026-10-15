import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';

const MIGRATION = path.resolve(import.meta.dirname, '..', '..', 'supabase', 'migrations',
  '20261014010000_tidewatch.sql');
let db: PGlite | undefined;

afterEach(async () => {
  await db?.close();
  db = undefined;
});

describe('Tidewatch classifier database selection', () => {
  it('returns only the new row after more than 500 decided rows', async () => {
    db = new PGlite();
    await db.exec('create role anon; create role authenticated; create role service_role;');
    await db.exec(await readFile(MIGRATION, 'utf8'));
    await db.exec(`
      insert into public.watch_item (item_key, source, status)
      select 'old-' || value, 'news', 'new' from generate_series(1, 501) as value;
      insert into public.watch_decision (item_id, class, confidence, decider, action)
      select id, 'noise', 1, 'code', 'shadow_only' from public.watch_item;
      insert into public.watch_item (item_key, source, status) values ('new', 'news', 'new');
    `);

    const result = await db.query<{ item_key: string }>(`
      select item.item_key
      from public.watch_item as item
      left join public.watch_decision as decision on decision.item_id = item.id
      where item.status in ('new', 'pending') and decision.item_id is null
      order by item.first_seen_at
      limit 100
    `);

    expect(result.rows).toEqual([{ item_key: 'new' }]);
  });
});
