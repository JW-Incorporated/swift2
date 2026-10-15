import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  join(
    __dirname,
    '..',
    '..',
    'supabase',
    'migrations',
    '20261014020000_community_outcomes.sql',
  ),
  'utf8',
);

describe('community outcomes migration contract', () => {
  it('adds every existing-table column re-apply-safely', () => {
    for (const column of [
      'score',
      'num_comments',
      'reactions',
      'thread_created_at',
      'velocity',
      'rank_score',
      'last_scored_at',
      'comment_url',
    ]) {
      expect(sql).toMatch(new RegExp(`add column if not exists ${column}\\b`, 'i'));
    }
  });

  it('creates the outcome table and guards every added constraint', () => {
    expect(sql).toMatch(/create table if not exists public\.community_outcome/i);
    for (const constraint of [
      'community_outcome_post_ledger_id_fkey',
      'community_outcome_platform_check',
      'community_outcome_horizon_check',
      'community_outcome_post_horizon_key',
    ]) {
      expect(sql).toMatch(
        new RegExp(`if not exists \\([\\s\\S]*?conname = '${constraint}'[\\s\\S]*?add constraint ${constraint}`, 'i'),
      );
    }
  });

  it('cascades dependent outcomes and deduplicates each measurement horizon', () => {
    expect(sql).toMatch(
      /foreign key \(post_ledger_id\)[\s\S]*?references public\.community_post_ledger \(id\)[\s\S]*?on delete cascade/i,
    );
    expect(sql).toMatch(/unique \(post_ledger_id, horizon\)/i);
    expect(sql).toMatch(/check \(horizon in \('1h', '24h', '7d'\)\)/i);
  });

  it('keeps the table service-role only', () => {
    expect(sql).toMatch(
      /alter table public\.community_outcome enable row level security;/i,
    );
    expect(sql).not.toMatch(/create\s+policy/i);
    expect(sql).toMatch(
      /revoke all on table public\.community_outcome from public, anon, authenticated;/i,
    );
    expect(sql).toMatch(
      /grant all on table public\.community_outcome to service_role;/i,
    );
  });

  it('adds no fields for Facebook member names or verbatim content', () => {
    expect(sql).not.toMatch(
      /\b(?:member_name|author|title|body|content|context|excerpt|quote)\s+text\b/i,
    );
  });

  it('is additive and contains no destructive schema changes', () => {
    expect(sql).not.toMatch(/\bdrop\b|\brename\b|alter\s+column[\s\S]*?\btype\b/i);
  });
});
