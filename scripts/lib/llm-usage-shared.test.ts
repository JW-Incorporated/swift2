import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getLoggedClaudeCaller } from './llm-usage.mjs';

describe('getLoggedClaudeCaller', () => {
  it('returns one shared caller per process', () => {
    expect(getLoggedClaudeCaller({})).toBe(getLoggedClaudeCaller({}));
    expect(typeof getLoggedClaudeCaller({})).toBe('function');
  });

  it.each([
    'scripts/community/draft-replies.mjs',
    'scripts/merch-engine/merch-claude.mjs',
    'scripts/merch-engine/fanmade-curation.mjs',
    'scripts/social/photo-qc.mjs',
  ])('%s defaults to the logged caller, never the bare one', (file) => {
    const src = readFileSync(file, 'utf8');
    expect(src).toContain('getLoggedClaudeCaller()');
    expect(src).not.toMatch(/import \{ callClaude \}/);
  });
});
