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
    '20261015010000_llm_usage_subscription.sql',
  ),
  'utf8',
);

describe('LLM usage subscription migration contract', () => {
  it('replaces the provider constraint re-apply-safely under its existing name', () => {
    expect(sql).toMatch(
      /drop constraint if exists llm_usage_provider_check;/i,
    );
    expect(sql).toMatch(
      /add constraint llm_usage_provider_check\s+check \(provider in \('jev', 'claude', 'claude-subscription'\)\);/i,
    );
  });

  it('adds a nullable cache-creation column re-apply-safely, no duplicate cache-read column', () => {
    const column = 'cache_creation_input_tokens';
    expect(sql).toMatch(
      new RegExp(`add column if not exists ${column} integer`, 'i'),
    );
    expect(sql).not.toMatch(new RegExp(`${column} integer\\s+not null`, 'i'));
    expect(sql).not.toMatch(/cache_read_input_tokens/i);
  });

  it('guards cache_creation_input_tokens with a named, re-apply-safe >= 0 check', () => {
    expect(sql).toMatch(
      /drop constraint if exists llm_usage_cache_creation_input_tokens_check;/i,
    );
    expect(sql).toMatch(
      /add constraint llm_usage_cache_creation_input_tokens_check\s+check \(cache_creation_input_tokens is null or cache_creation_input_tokens >= 0\);/i,
    );
  });

  it('does not change data or grants', () => {
    expect(sql).not.toMatch(/\b(?:insert|update|delete|grant|revoke)\b/i);
  });
});
