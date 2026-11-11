import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  recomputeVerificationWithStore,
  recordStorySourcesWithStore,
  type ExistingSourceRow,
  type RawItemRow,
  type StorySourceStore,
} from './story-source-store';
import type { StorySourceRow } from './story-sources';

const MIGRATIONS = [
  '20260718120000_news_init.sql',
  '20260720000500_news_raw_item_publisher.sql',
  '20260823020000_news_raw_item_resolved_tier.sql',
  '20260915000000_news_story_source_unique.sql',
].map((name) => path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  'supabase',
  'migrations',
  name,
));

const SOURCE_ID = '10000000-0000-4000-8000-000000000001';
const STORY_ID = '20000000-0000-4000-8000-000000000001';
const RAW_A = '30000000-0000-4000-8000-000000000001';
const RAW_B = '30000000-0000-4000-8000-000000000002';
const STORED_ID = '40000000-0000-4000-8000-000000000001';

let db: PGlite;
let store: StorySourceStore;

function pgliteStore(database: PGlite): StorySourceStore {
  return {
    async loadRawItems(ids) {
      const wanted = new Set(ids);
      const result = await database.query<{
        id: string;
        external_id: string;
        url: string;
        title: string;
        snippet: string;
        author: string | null;
        publisher: string | null;
        publisher_url: string | null;
        resolved_tier: RawItemRow['resolved_tier'];
        source_name: string;
        source_tier: RawItemRow['news_source']['tier'];
        source_type: string;
      }>(`
        select raw.id, raw.external_id, raw.url, raw.title, raw.snippet, raw.author,
               raw.publisher, raw.publisher_url, raw.resolved_tier,
               source.name as source_name, source.tier as source_tier, source.source_type
        from public.news_raw_item raw
        join public.news_source source on source.id = raw.source_id
      `);
      return result.rows.filter((row) => wanted.has(row.id)).map((row) => ({
        id: row.id,
        external_id: row.external_id,
        url: row.url,
        title: row.title,
        snippet: row.snippet,
        author: row.author,
        publisher: row.publisher,
        publisher_url: row.publisher_url,
        resolved_tier: row.resolved_tier,
        news_source: {
          name: row.source_name,
          tier: row.source_tier,
          source_type: row.source_type,
        },
      }));
    },
    async loadExisting(storyIds) {
      const wanted = new Set(storyIds);
      const result = await database.query<ExistingSourceRow>(`
        select id, story_id, raw_item_id, outlet_name, url, tier
        from public.news_story_source
      `);
      return result.rows.filter((row) => wanted.has(row.story_id));
    },
    async upsertSources(rows) {
      const values = rows.flatMap((row) => [
        row.story_id,
        row.raw_item_id,
        row.outlet_name,
        row.url,
        row.tier,
      ]);
      const placeholders = rows.map((_, index) => {
        const offset = index * 5;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      }).join(', ');
      await database.query(`
        insert into public.news_story_source
          (story_id, raw_item_id, outlet_name, url, tier)
        values ${placeholders}
        on conflict (story_id, outlet_name) do update set
          raw_item_id = excluded.raw_item_id,
          url = excluded.url,
          tier = excluded.tier
      `, values);
    },
    async deleteSources(ids) {
      for (const id of ids) {
        await database.query('delete from public.news_story_source where id = $1', [id]);
      }
    },
    async updateStory(id, update) {
      await database.query(`
        update public.news_story
        set verification_status = $2, verified_at = $3, source_count = $4
        where id = $1
      `, [id, update.verification_status, update.verified_at, update.source_count]);
    },
  };
}

async function insertRaw(
  id: string,
  externalId: string,
  title: string,
  url: string,
  publisherUrl: string,
  tier: StorySourceRow['tier'],
): Promise<void> {
  await db.query(`
    insert into public.news_raw_item
      (id, source_id, external_id, url, title, story_id, publisher, publisher_url, resolved_tier)
    values ($1, $2, $3, $4, $5, $6, 'Shared Display', $7, $8)
  `, [id, SOURCE_ID, externalId, url, title, STORY_ID, publisherUrl, tier]);
}

async function finalSources(): Promise<ExistingSourceRow[]> {
  const result = await db.query<ExistingSourceRow>(`
    select id, story_id, raw_item_id, outlet_name, url, tier
    from public.news_story_source
    order by outlet_name
  `);
  return result.rows;
}

beforeEach(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const migration of MIGRATIONS) await db.exec(await readFile(migration, 'utf8'));
  await db.query(`
    insert into public.news_source (id, name, source_type, tier)
    values ($1, 'Test feed', 'rss', 'fan')
  `, [SOURCE_ID]);
  await db.query(`
    insert into public.news_story (id, canonical_title)
    values ($1, 'Test story')
  `, [STORY_ID]);
  store = pgliteStore(db);
});

afterEach(async () => {
  await db.close();
});

describe('story-source writes against real migrations', () => {
  it('case 6: collapses two hosts sharing one display-name conflict key before upsert', async () => {
    await insertRaw(
      RAW_A,
      'fan-article',
      'First article',
      'https://first-blog.example/a',
      'https://first-blog.example',
      'fan',
    );
    await insertRaw(
      RAW_B,
      'established-article',
      'Second article',
      'https://second-blog.example/b',
      'https://second-blog.example',
      'established',
    );
    const errors: string[] = [];

    await recordStorySourcesWithStore(store, [
      { storyId: STORY_ID, rawItem: { id: RAW_A } },
      { storyId: STORY_ID, rawItem: { id: RAW_B } },
    ], errors);

    expect(errors).toEqual([]);
    expect(await finalSources()).toEqual([
      expect.objectContaining({
        raw_item_id: RAW_B,
        outlet_name: 'Shared Display',
        tier: 'established',
        url: 'https://second-blog.example/b',
      }),
    ]);
  });

  it('case 7: keeps an upserted row when its old id was a superseded delete candidate', async () => {
    await insertRaw(
      RAW_A,
      'old-copy',
      'Same syndicated article',
      'https://old-host.example/a',
      'https://old-host.example',
      'fan',
    );
    await insertRaw(
      RAW_B,
      'better-copy',
      'Same syndicated article',
      'https://new-host.example/b',
      'https://new-host.example',
      'established',
    );
    await db.query(`
      insert into public.news_story_source
        (id, story_id, raw_item_id, outlet_name, url, tier)
      values ($1, $2, $3, 'Shared Display', 'https://old-host.example/a', 'fan')
    `, [STORED_ID, STORY_ID, RAW_A]);
    const errors: string[] = [];

    await recordStorySourcesWithStore(
      store,
      [{ storyId: STORY_ID, rawItem: { id: RAW_B } }],
      errors,
    );

    expect(errors).toEqual([]);
    expect(await finalSources()).toEqual([
      expect.objectContaining({ id: STORED_ID, raw_item_id: RAW_B, tier: 'established' }),
    ]);
  });

  it('case 8: recomputes status from the source rows actually written', async () => {
    await insertRaw(
      RAW_A,
      'first',
      'First distinct article',
      'https://first-host.example/a',
      'https://first-host.example',
      'established',
    );
    await insertRaw(
      RAW_B,
      'second',
      'Second distinct article',
      'https://second-host.example/b',
      'https://second-host.example',
      'established',
    );
    const errors: string[] = [];
    const attachments = [
      { storyId: STORY_ID, rawItem: { id: RAW_A } },
      { storyId: STORY_ID, rawItem: { id: RAW_B } },
    ];

    await recordStorySourcesWithStore(store, attachments, errors);
    await recomputeVerificationWithStore(store, [STORY_ID], errors);
    const story = await db.query<{ source_count: number; verification_status: string }>(`
      select source_count, verification_status from public.news_story where id = $1
    `, [STORY_ID]);

    expect(errors).toEqual([]);
    expect(story.rows).toEqual([{ source_count: 1, verification_status: 'single_source' }]);
  });
});
