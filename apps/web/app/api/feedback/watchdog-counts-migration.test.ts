import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  resolve(__dirname, '../../../../../supabase/migrations/20261004220000_watchdog_report_counts.sql'),
  'utf8',
);

// Upgrade-state model of the migration + claim function: existing rows get sources = 0
// (empty source table), new rows insert with the column default (1) for the first source.
function simulate(existing: boolean, columnDefault: number, ips: string[]) {
  const seen = new Set<string>();
  let row: { sources: number } | null = existing ? { sources: columnDefault } : null;
  for (const ip of ips) {
    const added = seen.has(ip) ? 0 : 1;
    seen.add(ip);
    row = row ? { sources: row.sources + added } : { sources: columnDefault };
  }
  return row!.sources;
}

describe('watchdog_report_counts migration', () => {
  it('adds sources with default 0 then flips the default to 1, idempotently', () => {
    expect(sql).toMatch(/add column if not exists sources integer not null default 0/);
    expect(sql).toMatch(/alter column sources set default 1/);
    expect(sql.indexOf('default 0')).toBeLessThan(sql.indexOf('set default 1'));
  });

  it('a pre-existing row does not double-count its original IP', () => {
    expect(simulate(true, 0, ['a'])).toBe(1);
    expect(simulate(true, 0, ['a', 'a'])).toBe(1);
    expect(simulate(true, 0, ['a', 'b'])).toBe(2);
  });

  it('a brand-new row counts its first source once', () => {
    expect(simulate(false, 1, ['a'])).toBe(1);
    expect(simulate(false, 1, ['a', 'a', 'b'])).toBe(2);
  });
});
