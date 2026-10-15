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

  it('adds nullable cache-token columns re-apply-safely', () => {
    for (const column of [
      'cache_creation_input_tokens',
      'cache_read_input_tokens',
    ]) {
      expect(sql).toMatch(
        new RegExp(`add column if not exists ${column} integer`, 'i'),
      );
      expect(sql).not.toMatch(new RegExp(`${column} integer\\s+not null`, 'i'));
    }
  });

  it('does not change data or grants', () => {
    expect(sql).not.toMatch(/\b(?:insert|update|delete|grant|revoke)\b/i);
  });
});
