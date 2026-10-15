import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(__dirname, '..', '..', 'supabase', 'migrations', '20261014010000_tidewatch.sql'),
  'utf8',
);

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
});
