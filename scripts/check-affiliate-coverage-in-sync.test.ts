import { describe, expect, it } from 'vitest';
import { isCoverageInSync } from './check-affiliate-coverage-in-sync.mjs';

describe('affiliate coverage freshness gate', () => {
  it('accepts regenerated output and rejects deliberate drift', () => {
    const generated = '<!-- GENERATED -->\n# Affiliate coverage\n';
    expect(isCoverageInSync(generated, generated)).toBe(true);
    expect(isCoverageInSync(generated, `${generated}\nmanual drift\n`)).toBe(false);
  });
});
