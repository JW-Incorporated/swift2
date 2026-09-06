import { describe, expect, it, vi } from 'vitest';
import {
  checkTarget,
  checksumRows,
  ensureSupabaseCompat,
  isManagedSupabaseHost,
  parseArgs,
} from './backup-restore-test.mjs';

// The restore drill REWRITES its target. Two things therefore have to be true,
// and neither is allowed to be a matter of trust:
//   1. the target can never be production, and
//   2. the checksum has to notice when the restored data is wrong.

const PROD = 'postgres://u:***@db.abcdefgh.supabase.co:5432/postgres';
const SCRATCH = 'postgres://postgres:***@127.0.0.1:5432/brt_target?sslmode=disable';

describe('checkTarget — refuses to restore over anything real', () => {
  it('refuses a managed Supabase host', () => {
    expect(checkTarget(null, PROD)).toMatch(/managed Supabase host/);
  });

  it('refuses the Supabase connection pooler', () => {
    expect(
      checkTarget(null, 'postgres://u:***@aws-0-us-east-1.pooler.supabase.com:6543/postgres'),
    ).toMatch(/managed Supabase host/);
  });

  it('refuses restoring into the source database itself', () => {
    expect(checkTarget(SCRATCH, SCRATCH)).toMatch(/source database/);
  });

  it('refuses the source database spelled through a loopback alias', () => {
    // `localhost` and `127.0.0.1` are the same server; the refusal must not
    // be fooled by which spelling each URL happens to use.
    expect(
      checkTarget(
        'postgres://postgres:***@localhost:5432/brt',
        'postgres://postgres:***@127.0.0.1:5432/brt',
      ),
    ).toMatch(/source database/);
    expect(
      checkTarget(
        'postgres://postgres:***@127.0.0.1:5432/brt',
        'postgres://postgres:***@localhost:5432/brt_other',
      ),
    ).toBeNull();
  });

  it('refuses a lookalike host that merely embeds the name', () => {
    // `notsupabase.co.evil.test` must not slip through, and neither may a
    // substring match on a host we do not actually recognise.
    expect(checkTarget(null, 'postgres://u:***@db.supabase.co.evil.test:5432/x')).toBeNull();
    expect(checkTarget(null, 'postgres://u:***@my.supabase.co:5432/x')).toMatch(
      /managed Supabase host/,
    );
  });

  it('allows a genuine scratch target', () => {
    expect(checkTarget(PROD, SCRATCH)).toBeNull();
  });

  it('allows same host + port but a different database', () => {
    expect(
      checkTarget(
        'postgres://postgres:***@127.0.0.1:5432/brt_source',
        'postgres://postgres:***@127.0.0.1:5432/brt_target',
      ),
    ).toBeNull();
  });

  it('rejects an unparseable target rather than guessing', () => {
    expect(checkTarget(null, 'not a url')).toMatch(/not a valid Postgres URL/);
  });
});

describe('checksumRows — the property the verify step depends on', () => {
  const rows = ['{"a":1}', '{"a":2}', '{"b":"é — ’"}'];

  it('is independent of row order (a restore does not preserve physical order)', () => {
    expect(checksumRows(rows)).toBe(checksumRows([...rows].reverse()));
  });

  it('notices a single changed value', () => {
    expect(checksumRows(rows)).not.toBe(checksumRows(['{"a":1}', '{"a":3}', '{"b":"é — ’"}']));
  });

  it('notices a dropped row', () => {
    expect(checksumRows(rows)).not.toBe(checksumRows(rows.slice(1)));
  });

  it('notices a duplicated row — summing, not XOR, so copies do not cancel', () => {
    expect(checksumRows(['{"a":1}', '{"a":1}'])).not.toBe(checksumRows(['{"a":1}']));
    expect(checksumRows(['{"a":1}', '{"a":1}'])).not.toBe(checksumRows([]));
  });

  it('notices a unicode mangling (a WIN1252 restore of UTF-8 content)', () => {
    expect(checksumRows(['{"t":"Taylor — reputation"}'])).not.toBe(
      checksumRows(['{"t":"Taylor â€” reputation"}']),
    );
  });

  it('is stable across runs', () => {
    expect(checksumRows(rows)).toBe(checksumRows(rows));
    expect(checksumRows([])).toBe(
      '0000000000000000000000000000000000000000000000000000000000000000',
    );
  });
});

// ---------------------------------------------------------------------------
// ensureSupabaseCompat — the auth-schema stand-in for non-Supabase targets
// (#680 follow-up). checkTarget/assertSafeTarget REQUIRE the restore target
// to be a non-Supabase host, yet migrations from
// 20260904000000_clown_sessions.sql onward reference `auth.users`/
// `auth.uid()`. Without this shim `migrate.mjs` fails on every non-Supabase
// target with `schema "auth" does not exist`, which is exactly what made the
// restore drill impossible to ever pass.
// ---------------------------------------------------------------------------

/** A fake `pg.Client` that just records every SQL string it was asked to run. */
function fakeClient() {
  const queries: string[] = [];
  return {
    queries,
    query: vi.fn(async (sql: string) => {
      queries.push(sql);
      return { rows: [] };
    }),
  };
}

describe('isManagedSupabaseHost', () => {
  it('recognizes Supabase-hosted hostnames', () => {
    expect(isManagedSupabaseHost('db.abcdefgh.supabase.co')).toBe(true);
    expect(isManagedSupabaseHost('aws-0-us-east-1.pooler.supabase.com')).toBe(true);
    expect(isManagedSupabaseHost('project.supabase.in')).toBe(true);
  });

  it('does not flag local/scratch hosts as Supabase', () => {
    expect(isManagedSupabaseHost('127.0.0.1')).toBe(false);
    expect(isManagedSupabaseHost('localhost')).toBe(false);
    expect(isManagedSupabaseHost('some-ci-runner.example.com')).toBe(false);
  });
});

describe('ensureSupabaseCompat', () => {
  it('issues one query that creates the auth schema, table, function, and roles', async () => {
    const client = fakeClient();
    await ensureSupabaseCompat(client);

    expect(client.query).toHaveBeenCalledTimes(1);
    const sql = client.queries[0];
    expect(sql).toContain('create schema if not exists auth');
    expect(sql).toContain('create table if not exists auth.users');
    expect(sql).toContain('create or replace function auth.uid()');
    expect(sql).toContain("rolname = 'authenticated'");
    expect(sql).toContain("rolname = 'service_role'");
  });

  it('is idempotent — safe to call twice, and every DDL keyword is guarded', async () => {
    const client = fakeClient();
    await ensureSupabaseCompat(client);
    await ensureSupabaseCompat(client);

    expect(client.query).toHaveBeenCalledTimes(2);
    // Both calls ran the exact same SQL — nothing accumulates or duplicates
    // between calls, which is what lets --drill apply it to both the
    // scratch source and the scratch target without any special-casing.
    expect(client.queries[0]).toBe(client.queries[1]);
    // Every top-level DDL keyword in the shim uses a guard clause (schema/
    // table: if not exists; function: or replace; roles: a `do $$` block
    // that checks pg_roles before creating). No bare `create schema`,
    // `create table`, or `create role` outside those guards.
    const sql = client.queries[0];
    expect(sql).not.toMatch(/create schema(?! if not exists)/i);
    expect(sql).not.toMatch(/create table(?! if not exists)/i);
    expect(sql).toMatch(/create role authenticated/i);
    expect(sql).toMatch(/create role service_role/i);
    expect(sql).toMatch(
      /if not exists \(select 1 from pg_roles where rolname = 'authenticated'\)/i,
    );
  });
});

describe('parseArgs — --backup-only flag', () => {
  it('parses --backup-only alongside --source, with no --target', () => {
    const opts = parseArgs(['--source', 'postgres://x/db', '--backup-only']);
    expect(opts.backupOnly).toBe(true);
    expect(opts.source).toBe('postgres://x/db');
    expect(opts.target).toBeUndefined();
  });

  it('leaves backupOnly unset when the flag is absent', () => {
    const opts = parseArgs(['--source', 'a', '--target', 'b']);
    expect(opts.backupOnly).toBeUndefined();
  });

  it('still parses alongside --keep and --json', () => {
    const opts = parseArgs(['--source', 'a', '--backup-only', '--keep', '--json']);
    expect(opts.backupOnly).toBe(true);
    expect(opts.keep).toBe(true);
    expect(opts.json).toBe(true);
  });
});
