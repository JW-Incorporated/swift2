// One place that decides how this repo talks to Postgres.
//
// Every db script used to hardcode `ssl: { rejectUnauthorized: false }`, which
// is right for Supabase (managed cert we don't pin) but makes it IMPOSSIBLE to
// point the same script at a local/scratch Postgres — node-postgres asks for
// SSL, a plain local server refuses, and the connection dies. That blocked the
// one thing the BACKUPS launch gate needs (#680): running migrate + seeds
// against a throwaway database to rehearse a restore.
//
// Rule: SSL off for loopback hosts or an explicit `sslmode=disable`; SSL on
// (unpinned) for everything else. Remote/Supabase behaviour is byte-identical
// to the old inline option.
import pg from 'pg';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

/** Is this connection string pointed at a local, non-TLS Postgres? */
export function isLocalConnection(connectionString) {
  if (!connectionString) return false;
  if (/[?&]sslmode=disable\b/i.test(connectionString)) return true;
  try {
    const host = new URL(connectionString).hostname;
    return LOOPBACK.has(host);
  } catch {
    return false;
  }
}

/** SSL options for a connection string, or `false` to disable TLS entirely. */
export function sslFor(connectionString) {
  return isLocalConnection(connectionString) ? false : { rejectUnauthorized: false };
}

/**
 * A `pg.Client` configured for this repo.
 *
 * @param {string} connectionString
 * @param {{ readOnly?: boolean } & import('pg').ClientConfig} [extra]
 *   `readOnly: true` pins the SESSION to read-only at the server, so a bug in
 *   calling code physically cannot write. Used when reading production.
 */
export function makeClient(connectionString, extra = {}) {
  const { readOnly, ...rest } = extra;
  return new pg.Client({
    connectionString,
    ssl: sslFor(connectionString),
    ...(readOnly ? { options: '-c default_transaction_read_only=on' } : {}),
    ...rest,
  });
}

/** Host/db of a connection string, for logging — never includes credentials. */
export function describeConnection(connectionString) {
  try {
    const u = new URL(connectionString);
    return `${u.hostname}:${u.port || 5432}${u.pathname}`;
  } catch {
    return '<unparseable connection string>';
  }
}

export default { makeClient, sslFor, isLocalConnection, describeConnection };
