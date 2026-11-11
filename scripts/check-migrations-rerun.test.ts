import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkMigrationsRerun } from './check-migrations-rerun.mjs';

const dirs: string[] = [];

function migrationDir(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'migration-rerun-'));
  dirs.push(dir);
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(dir, name), sql);
  return dir;
}

const createNewsSource = `
  create table if not exists public.news_source (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    source_type text not null,
    tier text not null,
    config jsonb not null default '{}'::jsonb,
    is_enabled boolean not null default true
  );
`;

const widestConstraint = `
  alter table public.news_source drop constraint if exists news_source_source_type_check;
  alter table public.news_source add constraint news_source_source_type_check
    check (source_type in
      ('rss', 'reddit', 'x', 'youtube', 'bluesky', 'google_news',
       'reddit_rss', 'tumblr', 'gnews', 'site_diff'));
`;

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('migration re-run check', () => {
  it('passes when re-created constraints keep the widest value list', async () => {
    const dir = migrationDir({
      '001_create.sql': createNewsSource,
      '002_widest.sql': widestConstraint,
    });

    await expect(
      checkMigrationsRerun({ migrationsDir: dir, skipList: new Map() }),
    ).resolves.toEqual({
      applied: 2,
      skipped: 0,
    });
  });

  it('reports the old migration that narrows a constraint on pass two', async () => {
    const dir = migrationDir({
      '001_create.sql': createNewsSource,
      '002_old_narrow.sql': `
        alter table public.news_source drop constraint if exists news_source_source_type_check;
        alter table public.news_source add constraint news_source_source_type_check
          check (source_type in
            ('rss', 'reddit', 'x', 'youtube', 'bluesky', 'google_news',
             'reddit_rss', 'tumblr', 'gnews'));
      `,
      '003_widest.sql': widestConstraint,
    });

    await expect(checkMigrationsRerun({ migrationsDir: dir, skipList: new Map() })).rejects.toThrow(
      /Migration 002_old_narrow\.sql failed on pass 2:.*news_source_source_type_check/s,
    );
  });

  it('rejects stale or undocumented skip-list entries', async () => {
    const dir = migrationDir({ '001_create.sql': createNewsSource });

    await expect(
      checkMigrationsRerun({
        migrationsDir: dir,
        skipList: new Map([['missing.sql', 'PGlite gap']]),
      }),
    ).rejects.toThrow('PGlite skip-list entry does not exist: missing.sql');
    await expect(
      checkMigrationsRerun({ migrationsDir: dir, skipList: new Map([['001_create.sql', '']]) }),
    ).rejects.toThrow('PGlite skip-list entry needs a reason: 001_create.sql');
  });
});
