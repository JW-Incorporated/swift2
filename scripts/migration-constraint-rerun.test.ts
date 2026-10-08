import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// scripts/migrate.mjs re-applies EVERY migration in filename order on each run
// (no applied-migration tracking). A migration that drops and re-adds a CHECK
// constraint with a narrower value list than a later migration's therefore
// fails as soon as production holds a row with a newer value, and blocks every
// migration after it (db-migrate run 36907259434: engagement_lead_status_check).
// So every earlier re-creation of such a constraint must list at least the
// values of the final one.

const DIR = join(__dirname, '..', 'supabase', 'migrations');
const CONSTRAINTS = ['engagement_lead_status_check', 'engagement_lead_kind_check'];

function lists(constraint: string) {
  const found: { file: string; values: Set<string> }[] = [];
  const re = new RegExp(
    `add constraint ${constraint}\\s+check \\((?:--[^\\n]*\\n|\\s)*\\w+ in \\(([^)]*)\\)`,
    'gi',
  );
  for (const file of readdirSync(DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(join(DIR, file), 'utf8');
    for (const m of sql.matchAll(re)) {
      found.push({ file, values: new Set([...m[1].matchAll(/'([^']+)'/g)].map((v) => v[1])) });
    }
  }
  return found;
}

describe('re-applied CHECK constraints stay supersets of their final form', () => {
  for (const constraint of CONSTRAINTS) {
    it(constraint, () => {
      const all = lists(constraint);
      expect(all.length).toBeGreaterThan(0);
      const final = all[all.length - 1];
      for (const earlier of all.slice(0, -1)) {
        const missing = [...final.values].filter((v) => !earlier.values.has(v));
        expect(missing, `${earlier.file} lacks values ${final.file} allows`).toEqual([]);
      }
    });
  }

  it('the final status constraint covers every status the code writes', () => {
    const final = lists('engagement_lead_status_check').at(-1)!;
    for (const status of [
      'new',
      'drafted',
      'emailed',
      'delivered',
      'posted',
      'skipped_redline',
      'skipped_low_relevance',
      'skipped_by_founder',
    ]) {
      expect(final.values.has(status), status).toBe(true);
    }
  });
});
