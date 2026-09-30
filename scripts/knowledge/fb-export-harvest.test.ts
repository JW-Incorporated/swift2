import { describe, expect, it } from 'vitest';
import { firstOwnTimestamp } from './fb-export-harvest.mjs';

describe('Facebook virtualized feed harvest', () => {
  it('uses the first readable top-level timestamp value', () => {
    expect(firstOwnTimestamp(['Fan Name', '2 h', '6 weeks'])).toBe('2 h');
    expect(firstOwnTimestamp(['October 13', '3 h'], new Date('2026-09-30T12:00:00-07:00'))).toBe(
      '3 h',
    );
  });
});
