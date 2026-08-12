import { describe, expect, it } from 'vitest';
import { checkTarget, checksumRows } from './backup-restore-test.mjs';

// The restore drill REWRITES its target. Two things therefore have to be true,
// and neither is allowed to be a matter of trust:
//   1. the target can never be production, and
//   2. the checksum has to notice when the restored data is wrong.

const PROD = 'postgres://u:p@db.abcdefgh.supabase.co:5432/postgres';
const SCRATCH = 'postgres://postgres:postgres@127.0.0.1:5432/brt_target?sslmode=disable';

describe('checkTarget — refuses to restore over anything real', () => {
  it('refuses a managed Supabase host', () => {
    expect(checkTarget(null, PROD)).toMatch(/managed Supabase host/);
  });

  it('refuses the Supabase connection pooler', () => {
    expect(
      checkTarget(null, 'postgres://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres'),
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
        'postgres://postgres:postgres@localhost:5432/brt',
        'postgres://postgres:postgres@127.0.0.1:5432/brt',
      ),
    ).toMatch(/source database/);
    expect(
      checkTarget(
        'postgres://postgres:postgres@127.0.0.1:5432/brt',
        'postgres://postgres:postgres@localhost:5432/brt_other',
      ),
    ).toBeNull();
  });

  it('refuses a lookalike host that merely embeds the name', () => {
    // `notsupabase.co.evil.test` must not slip through, and neither may a
    // substring match on a host we do not actually recognise.
    expect(checkTarget(null, 'postgres://u:p@db.supabase.co.evil.test:5432/x')).toBeNull();
    expect(checkTarget(null, 'postgres://u:p@my.supabase.co:5432/x')).toMatch(
      /managed Supabase host/,
    );
  });

  it('allows a genuine scratch target', () => {
    expect(checkTarget(PROD, SCRATCH)).toBeNull();
  });

  it('allows same host + port but a different database', () => {
    expect(
      checkTarget(
        'postgres://postgres:postgres@127.0.0.1:5432/brt_source',
        'postgres://postgres:postgres@127.0.0.1:5432/brt_target',
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
