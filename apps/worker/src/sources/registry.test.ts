import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAdapter, PRIMARY_SOURCES } from './registry';

const MIGRATION = readFileSync(
  'supabase/migrations/20261015000000_news_sources_primary.sql',
  'utf8',
);
const ENABLE_MIGRATION = readFileSync(
  'supabase/migrations/20261015020000_news_fast_lane_enable.sql',
  'utf8',
);

describe('primary source registry', () => {
  it('contains the six keyless fast-lane sources and no GNews calls', () => {
    expect(PRIMARY_SOURCES.map((source) => source.name)).toEqual([
      'Taylor Swift — official YouTube channel',
      'Taylor Swift — official site',
      'Taylor Swift — official store',
      'Google News — "Taylor Swift" fast lane',
      'Republic Records — press feed',
      'Universal Music Group — press feed',
    ]);
    expect(PRIMARY_SOURCES.map((source) => source.sourceType)).not.toContain('gnews');
  });

  it('has an adapter for every primary source and leaves GDELT unregistered', () => {
    for (const source of PRIMARY_SOURCES) expect(getAdapter(source.sourceType)).toBeDefined();
    expect(getAdapter('gdelt')).toBeUndefined();
  });

  it('uses newest-first Google News and established, Taylor-filtered label feeds', () => {
    const google = PRIMARY_SOURCES.find((source) => source.sourceType === 'google_news');
    expect(google?.name).toContain('fast lane');
    expect(google?.url).toContain('scoring=n');

    const labels = PRIMARY_SOURCES.filter((source) => source.name.includes('press feed'));
    expect(labels).toHaveLength(2);
    expect(labels.every((source) => source.tier === 'established')).toBe(true);
    expect(labels.every((source) => source.requiredMention === 'Taylor Swift')).toBe(true);
  });

  it('seeds a distinct fast source and never resets an explicit primary setting', () => {
    expect(MIGRATION).toContain('Google News — "Taylor Swift" fast lane');
    expect(MIGRATION).toContain('&scoring=n');
    expect(MIGRATION).toMatch(
      /Google News — "Taylor Swift" fast lane'[\s\S]*?"newestFirst":true}', false\)/,
    );
    expect(MIGRATION).toContain("and not (config ? 'primary')");
    expect(MIGRATION).toMatch(/Republic Records[^\n]+rss[^\n]+established/);
    expect(MIGRATION).toMatch(/Universal Music Group[^\n]+rss[^\n]+established/);
    expect(MIGRATION.match(/requiredMention/g)).toHaveLength(2);
  });

  it('enables the fast source behind a normal-cycle exclusion flag', () => {
    expect(ENABLE_MIGRATION).toContain('set is_enabled = true');
    expect(ENABLE_MIGRATION).toContain('"primaryOnly":true');
    expect(ENABLE_MIGRATION).toContain("where name = 'Google News — \"Taylor Swift\" fast lane'");
    expect(ENABLE_MIGRATION).not.toContain('insert into public.news_source');
  });
});
