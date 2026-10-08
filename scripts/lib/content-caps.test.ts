// Regression guard for the 2026-08-11 cap-desync incident.
//
// What happened: `moment.context` was raised 2000 -> 4000 by founder decision
// on 2026-07-22. The DB migration, validate-content.mjs and content-coverage.mjs
// all moved. scripts/content-engine/checkers/redlines.mjs kept its own
// `const FIELD_FAIL_CHARS = 2000` and so filed a P1 "oversized field" safety
// ticket for every deliberately-long marquee context. A fixer cleared the
// ticket by deleting 30,562 characters of authored depth across 31 moments
// (commit 26e9a5b / PR #1727) — content that was never in violation of
// anything. These tests exist so that cannot happen again.
//
// The teeth: (1) the cap table is checked against the actual migration SQL, so
// code and database cannot drift; (2) no consumer script is allowed to carry
// its own cap literal, so there is nothing left to desync.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — plain .mjs data module, no types
import {
  DB_CAPS,
  POLICY_CAPS,
  DUMP_CEILING_CHARS,
  QUOTE_FAIL_CHARS,
  QUOTE_WARN_CHARS,
  SHALLOW_CONTEXT_CHARS,
  dumpCapFor,
  dumpCapRationale,
  ALL_CAPS,
} from './content-caps.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const MIGRATIONS = join(ROOT, 'supabase', 'migrations');

/**
 * The caps Postgres actually enforces, read out of the migration SQL in
 * filename (= apply) order so a later `drop constraint / add constraint`
 * supersedes an earlier one — which is exactly how the 4000 raise landed.
 * Matches both inline column checks and named table constraints.
 */
function capsFromMigrations(): Record<string, number> {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const out: Record<string, number> = {};
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS, f), 'utf8');
    // `constraint <table>_<col>_len check (char_length(<expr>) <= N)`
    const re =
      /constraint\s+(\w+?)_len\s+check\s*\(\s*char_length\s*\(\s*(?:coalesce\s*\(\s*)?(\w+)/gi;
    for (const m of sql.matchAll(re)) {
      const constraintBase = m[1]; // e.g. moment_context, month_item_snippet
      const col = m[2];
      // The N sits after this match; grab the rest of the statement.
      const tail = sql.slice(m.index! + m[0].length, m.index! + m[0].length + 200);
      const n = /<=\s*(\d+)/.exec(tail);
      if (!n) continue;
      // table = constraint base with the trailing column name removed
      const table = constraintBase.replace(new RegExp(`_${col}$`), '');
      out[`${table}.${col}`] = Number(n[1]);
    }
  }
  return out;
}

describe('content caps: code vs. database', () => {
  const fromSql = capsFromMigrations();

  it('parses the migration SQL at all (guards the parser itself)', () => {
    // If a future migration style stops matching, this catches it loudly
    // instead of silently making the parity test vacuous.
    expect(Object.keys(fromSql).length).toBeGreaterThanOrEqual(Object.keys(DB_CAPS).length);
    expect(fromSql['moment.context']).toBeDefined();
  });

  it('every DB_CAPS entry equals the value the last migration set', () => {
    for (const [key, value] of Object.entries(DB_CAPS)) {
      expect(
        fromSql[key],
        `DB_CAPS['${key}'] = ${value} but the migrations say ${fromSql[key]}. ` +
          `Move both, or the seed passes CI and then fails at insert.`,
      ).toBe(value);
    }
  });

  it('moment.context is 4000 — the founder decision of 2026-07-22', () => {
    // Named explicitly so anyone lowering it has to delete this test and
    // read why it exists. See
    // supabase/migrations/20260722120000_moment_context_4000.sql.
    expect(DB_CAPS['moment.context']).toBe(4000);
    expect(fromSql['moment.context']).toBe(4000);
  });
});

describe('content caps: anti-dump ceiling vs. DB caps', () => {
  it("every anti-dump override equals that field's DB cap", () => {
    // The override exists ONLY to track a DB cap that is deliberately above
    // the 2000 default. If the two ever disagree, either Karen files false
    // P1s (override too low — the original bug) or she green-lights rows the
    // database will reject (override too high).
    for (const [key, override] of Object.entries(
      ALL_CAPS.DUMP_CEILING_OVERRIDES as Record<string, number>,
    )) {
      expect(
        DB_CAPS[key as keyof typeof DB_CAPS],
        `anti-dump override for '${key}' is ${override} but DB_CAPS says ` +
          `${DB_CAPS[key as keyof typeof DB_CAPS]}`,
      ).toBe(override);
    }
  });

  it('every DB CHECK has a mirror in validate-content.mjs', () => {
    // The anti-dump ceiling is a SEPARATE policy (a copyright/paste heuristic)
    // and is deliberately allowed to sit above a field's DB cap — snippet's
    // ceiling is 2000 while its column is 400. That is only safe because
    // validate-content.mjs enforces the DB cap itself. So: assert it does, for
    // every column. This is the check that would have caught the
    // track_note.note gap (DB CHECK <= 400, mirrored by nothing until
    // 2026-08-11), where an over-long note passed every local gate and would
    // have failed at insert against the live project.
    const src = readFileSync(join(ROOT, 'scripts', 'validate-content.mjs'), 'utf8');
    for (const key of Object.keys(DB_CAPS)) {
      expect(src, `no DB_CAPS['${key}'] check in validate-content.mjs`).toContain(
        `DB_CAPS['${key}']`,
      );
    }
  });

  it('resolves moment.context to 4000 by every spelling a caller uses', () => {
    // redlines.mjs passes the corpus field name; content-coverage.mjs passes
    // the dotted label. Both must land on the same number — they did not, and
    // that was the bug.
    expect(dumpCapFor('moment', 'context')).toBe(4000);
    expect(dumpCapFor('moment', 'moment.context')).toBe(4000);
    expect(dumpCapRationale('moment', 'context')).toMatch(/founder decision/i);
  });

  it('leaves every other field at the 2000 anti-dump default', () => {
    expect(DUMP_CEILING_CHARS).toBe(2000);
    for (const [type, field] of [
      ['moment', 'snippet'],
      ['moment', 'title'],
      ['moment', 'photos[0].caption'],
      ['moment', 'rumors[2].claim'],
      ['track', 'note'],
      ['theory', 'evidence'],
      ['video', 'symbolism'],
      ['tour', 'note'],
      ['release', 'note'],
    ] as const) {
      expect(dumpCapFor(type, field), `${type}.${field}`).toBe(DUMP_CEILING_CHARS);
    }
  });
});

describe('content caps: nothing re-types a cap number', () => {
  // Every consumer must import from content-caps.mjs and hold zero cap
  // literals of its own. This is the check that would have caught the
  // original desync the day it was introduced.
  const CONSUMERS = [
    'scripts/validate-content.mjs',
    'scripts/content-coverage.mjs',
    'scripts/content-engine/checkers/redlines.mjs',
  ];
  const CAP_NUMBERS = new Set([
    ...Object.values(DB_CAPS as Record<string, number>),
    ...Object.values(POLICY_CAPS as Record<string, number>),
    DUMP_CEILING_CHARS,
    QUOTE_FAIL_CHARS,
    QUOTE_WARN_CHARS,
    SHALLOW_CONTEXT_CHARS,
  ]);

  for (const rel of CONSUMERS) {
    it(`${rel} imports the caps module`, () => {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src).toMatch(/from '(?:\.{1,2}\/)+lib\/content-caps\.mjs'/);
    });

    it(`${rel} declares no cap constant of its own`, () => {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      const offenders: string[] = [];
      src.split('\n').forEach((line, i) => {
        const code = line
          .replace(/\/\/.*$/, '') // line comments
          .replace(/^\s*\*.*$/, '') // block-comment bodies
          .replace(/\.slice\([^)]*\)/g, '') // display truncation, not a cap
          .replace(/\/(?:[^/\\\n]|\\.)+\/[gimsuy]*/g, ''); // regex literals
        if (!code.trim()) return;
        // A cap literal is a bare number used in a length comparison or
        // assigned to a *_CHARS / *_CAP constant.
        const patterns = [
          // `text.length > 2000`
          /\.length\s*[<>]=?\s*(\d+)/g,
          // any comparison against a cap-sized number
          /[<>]=?\s*(\d{3,4})\b/g,
          // `const FIELD_FAIL_CHARS = 2000`, `const fieldCap = 2000`,
          // `let maxLen = 400` — case-insensitive, which is what the original
          // `FIELD_FAIL_CHARS` would have tripped.
          /\b\w*(?:cap|chars|len|limit|max)\w*\s*=\s*(\d+)/gi,
          // Catch-all: ANY bare occurrence of a cap-valued integer in code.
          // Display truncation (`.slice(0, 300)`) and regex literals are
          // stripped above, so what is left can only be a policy number.
          /\b(\d{3,4})\b/g,
        ];
        for (const re of patterns) {
          for (const m of code.matchAll(re)) {
            if (CAP_NUMBERS.has(Number(m[1]))) {
              offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
            }
          }
        }
      });
      expect(
        offenders,
        `Cap literal(s) re-typed instead of imported from ` +
          `scripts/lib/content-caps.mjs:\n${offenders.join('\n')}`,
      ).toEqual([]);
    });
  }
});
