import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { termsRecheckTitle } from './terms-recheck.mjs';

describe('quarterly terms re-check', () => {
  it('uses a deterministic calendar-quarter title', () => {
    expect(termsRecheckTitle(new Date('2026-01-01T00:00:00Z'))).toBe('Merch: quarterly affiliate terms re-check — 2026-Q1');
    expect(termsRecheckTitle(new Date('2026-04-01T00:00:00Z'))).toBe('Merch: quarterly affiliate terms re-check — 2026-Q2');
    expect(termsRecheckTitle(new Date('2026-12-31T23:59:59Z'))).toBe('Merch: quarterly affiliate terms re-check — 2026-Q4');
  });

  it('searches every issue state before creating this quarter’s ticket', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-terms-recheck.yml'), 'utf8');

    expect(workflow).toContain('--state all');
  });
});
