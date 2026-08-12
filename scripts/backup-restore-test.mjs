// Backup + restore drill for the Supabase Postgres behind Long Live.
//
// Closes the mechanical half of the BACKUPS launch gate (#680): a restore that
// is *executed and verified*, as committed code rather than a one-off manual
// run. Runbook + what this does and does not prove: docs/backup-restore.md.
//
// THE SHAPE OF THE PROBLEM (read this before changing anything):
//   - SCHEMA lives in git — `supabase/migrations/*.sql`, idempotent, applied in
//     filename order. A restore does NOT need DDL out of a backup; it applies
//     the migrations and then loads data.
//   - CONTENT lives in git — `supabase/seed/**`, and the website itself is
//     built from the generated vault, not the DB. Losing this from the DB is a
//     reseed, not a disaster.
//   - Only the `news_*` tables (and `news_source.last_polled_at`) hold state
//     that exists NOWHERE ELSE. Those, plus every generated `id`, are what a
//     restore actually has to bring back.
//
// So the backup format here is deliberately data-only, logical, and
// dependency-free: NDJSON per table + a manifest of row counts and
// order-independent content checksums. It needs no `pg_dump`/`pg_restore`
// binary, which matters — this repo's toolchain is pure `pg` over the wire and
// CI runners/dev boxes are not guaranteed to have Postgres client binaries.
//
// TWO MODES
//
//   Drill (no production credentials, what CI runs):
//     node scripts/backup-restore-test.mjs --drill --cluster <postgres-url>
//     node scripts/backup-restore-test.mjs --drill --cluster ephemeral
//   Builds a source database from this repo's own migrations + seed scripts,
//   adds synthetic runtime-only `news_*` rows (the part git cannot rebuild),
//   backs it up, restores into a second scratch database, verifies.
//
//   Real data (a human with credentials, e.g. the pre-launch drill):
//     node scripts/backup-restore-test.mjs --source "$SUPABASE_DB_URL" \
//       --target "postgres://…/scratch"
//   The source session is pinned `default_transaction_read_only=on` at the
//   server, so this physically cannot write to production.
//
// SAFETY (non-negotiable, no override flag exists on purpose)
//   - The target is refused if it is the same database as the source.
//   - The target is refused if its host looks Supabase-hosted. Restore goes to
//     a scratch database, never over a live one.
//
// Options:
//   --drill                 build the source from repo migrations + seeds
//   --cluster <url|ephemeral>  where --drill creates its two scratch databases
//   --source <url>          database to back up FROM (read-only)
//   --target <url>          scratch database to restore INTO (rewritten!)
//   --out <dir>             backup artifact root (default: .backups)
//   --keep                  keep the backup artifact + scratch databases
//   --json                  print the machine-readable report to stdout at end
import { createHash } from 'node:crypto';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { makeClient, describeConnection } from './lib/pg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

// Seed scripts, in the order docs/dev-quickstart.md documents them.
const SEED_SCRIPTS = [
  'seed-eras.mjs',
  'seed-content.mjs',
  'seed-tracks.mjs',
  'seed-releases.mjs',
  'seed-tours.mjs',
  'seed-theories.mjs',
  'seed-videos.mjs',
];

// Human-legible assertions run against BOTH databases and compared verbatim.
// These exist so the drill output means something to a person reading it, on
// top of the machine checksums. Each must survive a reseed-independent restore.
const SPOT_CHECKS = [
  {
    label: 'era "red" — row identity + jsonb theme',
    sql: `select id::text, slug, title, album, start_date::text, theme
            from public.era where slug = 'red'`,
  },
  {
    label: 'month_item — per-era counts (top 5 eras)',
    sql: `select era_slug, count(*)::int as n from public.month_item
           group by era_slug order by n desc, era_slug asc limit 5`,
  },
  {
    label: 'moment — deepest context row (FK to month_item intact)',
    sql: `select m.month_item_id::text, mi.title, length(m.context) as ctx_len
            from public.moment m join public.month_item mi on mi.id = m.month_item_id
           order by length(m.context) desc, m.month_item_id asc limit 1`,
  },
  {
    label: 'track_note — a populated dossier jsonb payload',
    sql: `select era_slug, track_title, jsonb_typeof(dossier) as dossier_type,
                 length(dossier::text) as dossier_len
            from public.track_note
           where dossier <> '{}'::jsonb
           order by length(dossier::text) desc, era_slug, track_title limit 1`,
  },
  {
    label: 'news_story — RUNTIME-ONLY state git cannot rebuild',
    sql: `select id::text, canonical_title, verification_status, category
            from public.news_story order by first_seen_at desc, id asc limit 3`,
  },
  {
    label: 'news_story_source — runtime FK chain story→raw_item survives',
    sql: `select ss.outlet_name, ss.tier, ri.title as raw_title, s.canonical_title
            from public.news_story_source ss
            join public.news_story s on s.id = ss.story_id
            left join public.news_raw_item ri on ri.id = ss.raw_item_id
           order by ss.outlet_name limit 3`,
  },
  {
    label: 'news_source.last_polled_at — the one column that drifts from git',
    sql: `select name, last_polled_at::text from public.news_source
           where last_polled_at is not null order by name limit 3`,
  },
  {
    label: 'news_llm_usage — the durable spend counter',
    sql: `select usage_date::text, call_count from public.news_llm_usage
           order by usage_date desc limit 3`,
  },
];

// --------------------------------------------------------------------------
// args
// --------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { out: '.backups' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const take = () => {
      const v = argv[++i];
      if (v === undefined) fail(`${a} needs a value`);
      return v;
    };
    if (a === '--drill') opts.drill = true;
    else if (a === '--keep') opts.keep = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--cluster') opts.cluster = take();
    else if (a === '--source') opts.source = take();
    else if (a === '--target') opts.target = take();
    else if (a === '--out') opts.out = take();
    else if (a === '--help' || a === '-h') opts.help = true;
    else fail(`unknown argument: ${a}`);
  }
  return opts;
}

function fail(msg) {
  console.error(`\nbackup-restore-test: ${msg}\n`);
  process.exit(2);
}

// --------------------------------------------------------------------------
// safety
// --------------------------------------------------------------------------
const MANAGED_HOST = /(^|\.)(supabase\.(co|com|net|in)|pooler\.supabase\.com)$/i;

// `localhost`, `127.0.0.1` and `::1` are the same server in practice; the
// source-vs-target comparison must not be fooled by spelling.
const LOOPBACK_ALIASES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const canonicalHost = (hostname) =>
  LOOPBACK_ALIASES.has(hostname.toLowerCase()) ? '127.0.0.1' : hostname.toLowerCase();

/**
 * Why is this target unsafe to overwrite? Returns a reason, or null if it is
 * fine. Pure and exported so the refusal rules are unit-tested rather than
 * trusted — this is the one function standing between a drill and production.
 */
export function checkTarget(sourceUrl, targetUrl) {
  let t;
  try {
    t = new URL(targetUrl);
  } catch {
    return '--target is not a valid Postgres URL';
  }
  if (MANAGED_HOST.test(t.hostname)) {
    return (
      `refusing to restore into ${t.hostname} — that is a managed Supabase host.\n` +
      `  A restore REWRITES the target. Point --target at a scratch database.`
    );
  }
  if (sourceUrl) {
    let s;
    try {
      s = new URL(sourceUrl);
    } catch {
      return '--source is not a valid Postgres URL';
    }
    if (
      canonicalHost(s.hostname) === canonicalHost(t.hostname) &&
      (s.port || '5432') === (t.port || '5432') &&
      s.pathname === t.pathname
    ) {
      return 'refusing to restore into the source database (--target === --source)';
    }
  }
  return null;
}

/** Exits unless `target` is safe to overwrite. No escape hatch — by design. */
export function assertSafeTarget(sourceUrl, targetUrl) {
  const reason = checkTarget(sourceUrl, targetUrl);
  if (reason) fail(reason);
  return true;
}

// --------------------------------------------------------------------------
// checksums
//
// Order-independent and streaming: each row is hashed on its own, and the
// digests are summed word-wise mod 2^32 into a 32-byte accumulator. Addition
// (not XOR) so duplicate rows do not cancel each other out. Two tables match
// iff they hold the same multiset of rows, regardless of physical order — which
// is exactly the property a restore has to have.
// --------------------------------------------------------------------------
export function newAccumulator() {
  return new Uint32Array(8);
}
export function accumulate(acc, text) {
  const d = createHash('sha256').update(text, 'utf8').digest();
  for (let i = 0; i < 8; i++) acc[i] = (acc[i] + d.readUInt32BE(i * 4)) >>> 0;
}
export function digest(acc) {
  const b = Buffer.alloc(32);
  for (let i = 0; i < 8; i++) b.writeUInt32BE(acc[i], i * 4);
  return b.toString('hex');
}
/** Convenience for tests/callers: checksum a whole multiset of row strings. */
export function checksumRows(rowTexts) {
  const acc = newAccumulator();
  for (const t of rowTexts) accumulate(acc, t);
  return digest(acc);
}

const q = (ident) => `"${String(ident).replace(/"/g, '""')}"`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function removeWithRetry(dir, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return true;
    } catch {
      await sleep(250 * (i + 1));
    }
  }
  console.warn(`  note: could not delete ${dir} (still locked) — safe to remove by hand`);
  return false;
}

// --------------------------------------------------------------------------
// introspection
// --------------------------------------------------------------------------
async function listTables(client) {
  const { rows } = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name`,
  );
  return rows.map((r) => r.table_name);
}

async function schemaFingerprint(client) {
  const { rows } = await client.query(
    `select table_name, column_name, data_type, is_nullable
       from information_schema.columns
      where table_schema = 'public'
      order by table_name, column_name`,
  );
  const text = rows.map((r) => Object.values(r).join('')).join('\n');
  return { hash: createHash('sha256').update(text).digest('hex'), columns: rows.length };
}

/**
 * Tables sorted so every table comes after the tables it references. Insert
 * order has to respect foreign keys; a plain alphabetical load fails the moment
 * `moment` lands before `month_item`. Self-references are ignored (they are
 * satisfiable within a single table load); a genuine cycle falls back to the
 * remaining order and the FK error will say so loudly.
 */
async function dependencyOrder(client, tables) {
  const { rows } = await client.query(
    `select src.relname as child, tgt.relname as parent
       from pg_constraint c
       join pg_class src on src.oid = c.conrelid
       join pg_class tgt on tgt.oid = c.confrelid
       join pg_namespace n on n.oid = src.relnamespace
      where c.contype = 'f' and n.nspname = 'public'`,
  );
  const set = new Set(tables);
  const deps = new Map(tables.map((t) => [t, new Set()]));
  for (const { child, parent } of rows) {
    if (child === parent || !set.has(child) || !set.has(parent)) continue;
    deps.get(child).add(parent);
  }
  const out = [];
  const done = new Set();
  let progress = true;
  while (out.length < tables.length && progress) {
    progress = false;
    for (const t of tables) {
      if (done.has(t)) continue;
      if ([...deps.get(t)].every((p) => done.has(p))) {
        out.push(t);
        done.add(t);
        progress = true;
      }
    }
  }
  for (const t of tables) if (!done.has(t)) out.push(t); // cycle: best effort
  return out;
}

// --------------------------------------------------------------------------
// backup
// --------------------------------------------------------------------------
const FETCH = 500;

/**
 * Stream one table out as NDJSON. `to_jsonb(t)` makes Postgres itself render
 * every column — dates, jsonb, arrays, nulls — so there is no client-side type
 * guessing on the way out and none on the way back in either.
 *
 * The CALLER owns the transaction (cursors require one). The whole backup runs
 * inside a single REPEATABLE READ snapshot — see the backup section in main().
 */
async function dumpTable(client, table, file) {
  const cur = `brt_${table.replace(/[^a-z0-9_]/gi, '')}`;
  await client.query(
    `declare ${cur} no scroll cursor for select to_jsonb(t)::text as j from public.${q(table)} t`,
  );
  const acc = newAccumulator();
  let n = 0;
  let bytes = 0;
  try {
    for (;;) {
      const { rows } = await client.query(`fetch ${FETCH} from ${cur}`);
      if (rows.length === 0) break;
      let chunk = '';
      for (const r of rows) {
        accumulate(acc, r.j);
        chunk += r.j + '\n';
      }
      appendFileSync(file, chunk, 'utf8');
      bytes += Buffer.byteLength(chunk);
      n += rows.length;
    }
  } finally {
    await client.query(`close ${cur}`).catch(() => {});
  }
  return { rows: n, bytes, checksum: digest(acc) };
}

/** Same accounting as dumpTable, but read straight from a database. The caller
 *  owns the transaction, exactly as with dumpTable. */
async function measureTable(client, table) {
  const cur = `brtv_${table.replace(/[^a-z0-9_]/gi, '')}`;
  await client.query(
    `declare ${cur} no scroll cursor for select to_jsonb(t)::text as j from public.${q(table)} t`,
  );
  const acc = newAccumulator();
  let n = 0;
  try {
    for (;;) {
      const { rows } = await client.query(`fetch ${FETCH} from ${cur}`);
      if (rows.length === 0) break;
      for (const r of rows) accumulate(acc, r.j);
      n += rows.length;
    }
  } finally {
    await client.query(`close ${cur}`).catch(() => {});
  }
  return { rows: n, checksum: digest(acc) };
}

// --------------------------------------------------------------------------
// restore
// --------------------------------------------------------------------------
function runNode(script, env, label) {
  const r = spawnSync(process.execPath, [join('scripts', script)], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    console.error(r.stdout || '');
    console.error(r.stderr || '');
    fail(`${label} failed (${script})`);
  }
  return (r.stdout || '').trim();
}

/**
 * Load NDJSON back in. `jsonb_populate_record` casts each object to the table's
 * own row type inside Postgres, so the round-trip is symmetric with the dump
 * and stays correct if a column's type changes.
 */
async function loadTable(client, table, lines) {
  const sql = `insert into public.${q(table)}
                 select r.* from jsonb_array_elements($1::jsonb) e,
                              jsonb_populate_record(null::public.${q(table)}, e) r`;
  for (let i = 0; i < lines.length; i += FETCH) {
    const batch = lines.slice(i, i + FETCH);
    await client.query(sql, [`[${batch.join(',')}]`]);
  }
}

// --------------------------------------------------------------------------
// scratch cluster helpers
// --------------------------------------------------------------------------
async function withAdmin(clusterUrl, fn) {
  const admin = makeClient(clusterUrl);
  await admin.connect();
  try {
    return await fn(admin);
  } finally {
    await admin.end();
  }
}

function dbUrl(clusterUrl, name) {
  const u = new URL(clusterUrl);
  u.pathname = `/${name}`;
  return u.toString();
}

/**
 * Kill exactly one postmaster and its children. Postgres 18 forks `io_worker`
 * helpers; SIGKILLing only the parent orphans them, and they linger on the
 * machine after the drill. Windows needs `taskkill /T` to walk the tree.
 * Always PID-scoped — never "kill every postgres.exe", which would take out a
 * developer's real server.
 */
function killTree(pid) {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
}

/** An ephemeral port the OS says is free — a fixed one collides with a
 *  leftover cluster from a previous crashed run. */
async function freePort() {
  const net = await import('node:net');
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function startEphemeralCluster() {
  let EmbeddedPostgres;
  try {
    ({ default: EmbeddedPostgres } = await import('embedded-postgres'));
  } catch {
    fail(
      '--cluster ephemeral needs the optional `embedded-postgres` package.\n' +
        '  Install it just for the drill:  npm i --no-save embedded-postgres\n' +
        '  Or point --cluster at any Postgres you already have.',
    );
  }
  const dir = join(repoRoot, '.backups', `.pgdata-${Date.now()}`);
  const port = await freePort();
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: false,
    // UTF8 or the vault's typography (— ’ é) corrupts on the way in and the
    // drill would "pass" against mangled data.
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    // Never swallow this. An earlier version passed a no-op here and a
    // port-already-in-use failure surfaced as a bare `undefined` crash.
    onError: (e) => console.error('  [embedded-postgres]', e?.message ?? e),
  });
  await pg.initialise();
  await pg.start();
  // Note the postmaster's own PID before we ever try to stop it. On Windows
  // `pg.stop()` can return while the postmaster is still alive, and a live
  // child keeps Node's event loop open — the drill printed PASS and then hung
  // forever. Knowing the exact PID lets us finish the job without a blind
  // "kill every postgres.exe", which could take out a developer's real server.
  let postmasterPid = null;
  try {
    postmasterPid =
      Number(readFileSync(join(dir, 'postmaster.pid'), 'utf8').split('\n')[0].trim()) || null;
  } catch {
    /* no pid file — fall back to whatever pg.stop() manages */
  }
  return {
    url: `postgres://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`,
    async stop() {
      // Shut the cluster down ourselves when we know its PID, and do NOT then
      // call `pg.stop()` — two Windows failure modes, both observed here:
      //   - Stopping first and killing after leaves orphans: once the
      //     postmaster exits, its forked `io_worker` children are reparented
      //     and unreachable from its PID. Three were left running on this
      //     machine before the tree kill went first.
      //   - Calling `pg.stop()` after the tree is already dead HANGS — it
      //     waits on a pg_ctl shutdown log line that will never arrive, and
      //     the drill printed PASS and then sat forever.
      // An unclean shutdown is fine: the whole cluster is deleted two lines
      // down. `pg.stop()` remains the fallback when there was no pid file.
      if (postmasterPid) {
        killTree(postmasterPid);
        await sleep(500);
      } else {
        await pg.stop().catch(() => {});
      }
      // Windows keeps handles on the data directory for a moment after the
      // postmaster exits; rmSync races it and throws EPERM. Retry, then give
      // up quietly — a leftover throwaway cluster under a gitignored .backups/
      // is not worth failing an otherwise-passing drill over.
      await removeWithRetry(dir);
    },
  };
}

// --------------------------------------------------------------------------
// the drill fixture — the part git CANNOT rebuild
// --------------------------------------------------------------------------
//
// The `news_*` tables are the ONLY state in this database that git cannot
// rebuild (see the header). The seeds leave them empty, so a drill against
// seeds alone would prove nothing about the data that actually matters. These
// rows stand in for a poll cycle: two stories, the raw items behind them, the
// story→source audit trail, the daily LLM spend counter, and a moved
// `news_source.last_polled_at` — covering every runtime write the worker makes
// (apps/worker/src/pipeline/run-cycle.ts).
const FIXTURE_SQL = `
insert into public.news_story
  (canonical_title, summary, category, importance, source_count,
   verification_status, corroboration, first_seen_at, classified_at)
values
  ('Drill story A — runtime-only row', 'Synthetic story proving news_* survives a restore.',
   'music', 7, 2, 'corroborated', '[{"outlet":"Drill Wire","tier":"established"}]'::jsonb,
   now() - interval '2 hours', now() - interval '110 minutes'),
  ('Drill story B — runtime-only row, unclassified', 'Second synthetic story, different stage.',
   null, null, 1, 'single_source', '[]'::jsonb, now() - interval '1 hour', null);

insert into public.news_raw_item (source_id, external_id, url, title, snippet, published_at, raw_payload, story_id)
select s.id,
       'drill-' || st.canonical_title,
       'https://example.invalid/drill/' || row_number() over (order by st.canonical_title),
       'Raw item for ' || st.canonical_title,
       'Synthetic raw item.',
       now() - interval '3 hours',
       jsonb_build_object('drill', true),
       st.id
  from public.news_story st
 cross join lateral (select id from public.news_source order by name limit 1) s
 where st.canonical_title like 'Drill story%';

insert into public.news_story_source (story_id, raw_item_id, outlet_name, url, tier)
select ri.story_id, ri.id, 'Drill Wire', ri.url, 'established'
  from public.news_raw_item ri
 where ri.external_id like 'drill-%';

insert into public.news_llm_usage (usage_date, call_count)
values (current_date, 17)
on conflict (usage_date) do update set call_count = excluded.call_count;

update public.news_source set last_polled_at = now() - interval '30 minutes'
 where id = (select id from public.news_source order by name limit 1);
`;

async function buildFixtureRuntimeState(client) {
  await client.query(FIXTURE_SQL);
  const { rows } = await client.query(
    `select (select count(*) from public.news_story)        as stories,
            (select count(*) from public.news_raw_item)     as raw_items,
            (select count(*) from public.news_story_source) as story_sources,
            (select count(*) from public.news_llm_usage)    as llm_usage`,
  );
  return rows[0];
}

// --------------------------------------------------------------------------
// main
// --------------------------------------------------------------------------
const USAGE = `
Backup + restore drill (launch gate BACKUPS, #680). See docs/backup-restore.md.

  node scripts/backup-restore-test.mjs --drill --cluster ephemeral
  node scripts/backup-restore-test.mjs --drill --cluster postgres://postgres:postgres@localhost:5432/postgres
  node scripts/backup-restore-test.mjs --source "$SUPABASE_DB_URL" --target postgres://…/scratch

  --drill              build the source database from repo migrations + seeds
  --cluster <url|ephemeral>   where --drill creates its scratch databases
  --source <url>       database to back up FROM (opened read-only)
  --target <url>       scratch database to restore INTO — REWRITTEN
  --out <dir>          backup artifact root (default .backups)
  --keep               keep artifacts and scratch databases
  --json               print the JSON report to stdout
`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }
  if (!opts.drill && (!opts.source || !opts.target)) {
    console.log(USAGE);
    fail('need either --drill, or both --source and --target');
  }

  const started = Date.now();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = join(repoRoot, opts.out, stamp);
  const dataDir = join(outDir, 'data');
  mkdirSync(dataDir, { recursive: true });

  const timings = {};
  const time = async (name, fn) => {
    const t0 = Date.now();
    const v = await fn();
    timings[name] = Date.now() - t0;
    return v;
  };

  let cluster = null;
  let scratch = null;
  let sourceUrl = opts.source;
  let targetUrl = opts.target;

  try {
    // ---- 0. provision -----------------------------------------------------
    if (opts.drill) {
      console.log('== 0. provision =========================================');
      let clusterUrl =
        opts.cluster ?? 'postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable';
      if (clusterUrl === 'ephemeral') {
        process.stdout.write('booting an ephemeral Postgres ... ');
        cluster = await time('provision', startEphemeralCluster);
        clusterUrl = cluster.url;
        console.log('ok');
      }
      // Refuse a managed Supabase cluster BEFORE provisioning anything on it.
      // The drill creates scratch databases and runs migrations against
      // --cluster; none of that is destructive, but none of it belongs on the
      // real project either, and the target refusal below would only fire
      // after the fact.
      let clusterHost = '';
      try {
        clusterHost = new URL(clusterUrl).hostname;
      } catch {
        fail('--cluster is not a valid Postgres URL');
      }
      if (MANAGED_HOST.test(clusterHost)) {
        fail(
          `--cluster points at ${clusterHost} — a managed Supabase host.\n` +
            `  The drill provisions scratch databases on the cluster. Point --cluster at a local or throwaway Postgres.`,
        );
      }
      const suffix = String(Date.now()).slice(-9);
      scratch = { clusterUrl, source: `brt_source_${suffix}`, target: `brt_target_${suffix}` };
      await withAdmin(clusterUrl, async (admin) => {
        for (const name of [scratch.source, scratch.target]) {
          await admin.query(`create database ${q(name)}`);
          console.log(`created scratch database ${name}`);
        }
      });
      sourceUrl = dbUrl(clusterUrl, scratch.source);
      targetUrl = dbUrl(clusterUrl, scratch.target);

      console.log('\nbuilding the source from repo migrations + seeds:');
      await time('fixture', async () => {
        const env = { SUPABASE_DB_URL: sourceUrl };
        runNode('migrate.mjs', env, 'migrate');
        console.log('  migrations applied');
        for (const s of SEED_SCRIPTS) {
          runNode(s, env, 'seed');
          console.log(`  ${s}`);
        }
        const c = makeClient(sourceUrl);
        await c.connect();
        try {
          const r = await buildFixtureRuntimeState(c);
          console.log(
            `  synthetic runtime-only news_* state: ${r.stories} stories, ${r.raw_items} raw items, ` +
              `${r.story_sources} story sources, ${r.llm_usage} usage row(s)`,
          );
        } finally {
          await c.end();
        }
      });
      console.log('');
    }

    assertSafeTarget(sourceUrl, targetUrl);
    console.log(
      `source : ${describeConnection(sourceUrl)}${opts.drill ? '' : '  (READ-ONLY session)'}`,
    );
    console.log(`target : ${describeConnection(targetUrl)}  (will be rewritten)`);
    console.log(`artifact: ${relative(repoRoot, outDir)}\n`);

    // ---- 1. backup --------------------------------------------------------
    console.log('== 1. backup ============================================');
    const src = makeClient(sourceUrl, { readOnly: !opts.drill });
    await src.connect();
    let manifest;
    try {
      // ONE snapshot for the whole backup: schema fingerprint, every table
      // dump, and the source spot checks all see the same instant. Without
      // this, each table was dumped in its own transaction — against a live
      // source (the worker writes 6×/day) a row landing between two dumps
      // could produce an artifact whose FK chains do not restore, and the
      // spot checks could drift from the dumped bytes. READ ONLY is belt and
      // braces on top of the session pin above.
      await src.query('begin transaction isolation level repeatable read, read only');
      const version = (await src.query('select version()')).rows[0].version;
      const tables = await listTables(src);
      const order = await dependencyOrder(src, tables);
      const schema = await schemaFingerprint(src);
      manifest = {
        generatedAt: new Date().toISOString(),
        postgresVersion: version.split(',')[0],
        source: describeConnection(sourceUrl),
        schemaFingerprint: schema.hash,
        schemaColumns: schema.columns,
        loadOrder: order,
        tables: {},
      };
      await time('backup', async () => {
        for (const t of order) {
          const file = join(dataDir, `${t}.ndjson`);
          writeFileSync(file, '');
          const r = await dumpTable(src, t, file);
          manifest.tables[t] = r;
          console.log(
            `  ${t.padEnd(20)} ${String(r.rows).padStart(7)} rows  ${r.checksum.slice(0, 16)}…`,
          );
        }
      });
      writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      const totalRows = Object.values(manifest.tables).reduce((a, b) => a + b.rows, 0);
      const totalBytes = Object.values(manifest.tables).reduce((a, b) => a + b.bytes, 0);
      console.log(
        `  ${String(order.length)} tables · ${totalRows} rows · ${(totalBytes / 1e6).toFixed(2)} MB · ${timings.backup} ms`,
      );
      manifest.spotChecks = await runSpotChecks(src);
      await src.query('commit').catch(() => {});
    } finally {
      await src.end();
    }

    // ---- 2. restore -------------------------------------------------------
    console.log('\n== 2. restore ===========================================');
    console.log('  schema comes from git (supabase/migrations), data from the backup');
    await time('restore', async () => {
      runNode('migrate.mjs', { SUPABASE_DB_URL: targetUrl }, 'migrate (target)');
      console.log('  migrations applied to target');
      const tgt = makeClient(targetUrl);
      await tgt.connect();
      try {
        const tables = manifest.loadOrder;
        await tgt.query(
          `truncate table ${tables.map((t) => `public.${q(t)}`).join(', ')} restart identity cascade`,
        );
        console.log('  target truncated');
        for (const t of tables) {
          const raw = readFileSync(join(dataDir, `${t}.ndjson`), 'utf8');
          const lines = raw.split('\n').filter(Boolean);
          await loadTable(tgt, t, lines);
          console.log(`  ${t.padEnd(20)} ${String(lines.length).padStart(7)} rows loaded`);
        }
      } finally {
        await tgt.end();
      }
    });
    console.log(`  restore took ${timings.restore} ms`);

    // ---- 3. verify --------------------------------------------------------
    console.log('\n== 3. verify ============================================');
    const failures = [];
    const tgt = makeClient(targetUrl);
    await tgt.connect();
    let report;
    try {
      // Mirror of the backup snapshot: one transaction for every verify read
      // (cursors need one anyway), so the fingerprint, the per-table
      // checksums and the spot checks all describe the same instant.
      await tgt.query('begin transaction isolation level repeatable read, read only');
      const schema = await schemaFingerprint(tgt);
      const schemaOk = schema.hash === manifest.schemaFingerprint;
      if (!schemaOk) failures.push('schema fingerprint differs between source and target');
      console.log(
        `  schema fingerprint  ${schemaOk ? 'MATCH' : 'MISMATCH'}  (${schema.columns} columns, ${schema.hash.slice(0, 16)}…)`,
      );

      const perTable = {};
      await time('verify', async () => {
        for (const t of manifest.loadOrder) {
          const want = manifest.tables[t];
          const got = await measureTable(tgt, t);
          const ok = got.rows === want.rows && got.checksum === want.checksum;
          perTable[t] = {
            expected: want.rows,
            actual: got.rows,
            checksumMatch: got.checksum === want.checksum,
          };
          if (!ok)
            failures.push(
              `${t}: expected ${want.rows} rows/${want.checksum.slice(0, 12)}, got ${got.rows}/${got.checksum.slice(0, 12)}`,
            );
          console.log(
            `  ${t.padEnd(20)} ${String(got.rows).padStart(7)} rows  ${ok ? 'OK  checksum match' : 'FAIL'}`,
          );
        }
      });

      console.log('\n  spot checks (source vs restored, compared verbatim):');
      const after = await runSpotChecks(tgt);
      await tgt.query('commit').catch(() => {});
      const spot = [];
      for (const [i, check] of SPOT_CHECKS.entries()) {
        const a = manifest.spotChecks[i];
        const b = after[i];
        let why = null;
        if (a.error) why = `query failed on the source: ${a.error}`;
        else if (b.error) why = `query failed on the restored copy: ${b.error}`;
        else if (a.json !== b.json) why = 'source and restored rows differ';
        else if (opts.drill && b.rows === 0)
          why = 'returned no rows (the drill fixture should populate this)';
        const ok = why === null;
        if (!ok) failures.push(`spot check "${check.label}": ${why}`);
        spot.push({ label: check.label, ok, rows: b.rows, why });
        console.log(`    [${ok ? 'OK  ' : 'FAIL'}] ${check.label}  (${b.rows} row(s))`);
        if (why) console.log(`           ${why}`);
        else if (b.rows > 0) console.log(`           ${truncate(b.json, 160)}`);
      }

      report = {
        gate: 'BACKUPS (#680)',
        mode: opts.drill ? 'drill (fixture source built from repo)' : 'live source',
        startedAt: new Date(started).toISOString(),
        postgresVersion: manifest.postgresVersion,
        source: manifest.source,
        target: describeConnection(targetUrl),
        artifact: relative(repoRoot, outDir),
        timingsMs: { ...timings, total: Date.now() - started },
        schemaFingerprintMatch: schemaOk,
        tables: perTable,
        spotChecks: spot,
        totalRows: Object.values(manifest.tables).reduce((a, b) => a + b.rows, 0),
        failures,
        passed: failures.length === 0,
      };
      writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
      // Also outside the timestamped artifact, which is deleted unless --keep,
      // so CI has a stable path to upload.
      writeFileSync(join(repoRoot, opts.out, 'last-report.json'), JSON.stringify(report, null, 2));
    } finally {
      await tgt.end();
    }

    // ---- 4. verdict -------------------------------------------------------
    console.log('\n== verdict ==============================================');
    console.log(`  tables      ${Object.keys(report.tables).length}`);
    console.log(`  rows        ${report.totalRows}`);
    console.log(`  backup      ${timings.backup} ms`);
    console.log(`  restore     ${timings.restore} ms`);
    console.log(`  verify      ${timings.verify} ms`);
    console.log(`  total       ${report.timingsMs.total} ms`);
    console.log(`  report      ${relative(repoRoot, join(outDir, 'report.json'))}`);
    if (report.passed) {
      console.log('\n  PASS — every table restored with matching row count and content checksum.');
    } else {
      console.log(`\n  FAIL — ${failures.length} problem(s):`);
      for (const f of failures) console.log(`    - ${f}`);
    }
    if (opts.json) console.log('\n' + JSON.stringify(report, null, 2));
    return report.passed ? 0 : 1;
  } finally {
    if (scratch && !opts.keep) {
      await withAdmin(scratch.clusterUrl, async (admin) => {
        for (const name of [scratch.source, scratch.target]) {
          await admin.query(`drop database if exists ${q(name)} with (force)`).catch(() => {});
        }
      }).catch(() => {});
    }
    if (cluster && !opts.keep) await cluster.stop();
    if (!opts.keep) await removeWithRetry(outDir);
  }
}

/**
 * A spot check that ERRORS is a failure, never a pass. The first cut of this
 * script compared the two error strings, found them equal, and printed OK —
 * a check referencing a column that does not exist "passed" on both sides.
 * Errors and (in drill mode) empty results are surfaced explicitly.
 */
async function runSpotChecks(client) {
  // Both call sites run inside a snapshot transaction, where a failing query
  // poisons everything after it ("current transaction is aborted"). Each check
  // gets a savepoint so one broken query stays ONE failed check.
  const out = [];
  for (const c of SPOT_CHECKS) {
    try {
      await client.query('savepoint spot_check');
      const { rows } = await client.query(c.sql);
      await client.query('release savepoint spot_check');
      out.push({ rows: rows.length, json: JSON.stringify(rows), error: null });
    } catch (err) {
      await client.query('rollback to savepoint spot_check').catch(() => {});
      out.push({ rows: 0, json: null, error: err.message });
    }
  }
  return out;
}

const truncate = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

// Run only when invoked directly — the unit tests import this module for
// checkTarget/checksumRows and must not kick off a drill.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  let code;
  try {
    code = await main();
  } catch (err) {
    // A restore that blows up mid-flight (an FK violation from a truncated
    // backup, a dead connection) is a FAILED DRILL, not a stack trace. Say so
    // in the same voice as a checksum mismatch so CI output reads the same way.
    console.error('\n== verdict ==============================================');
    console.error(`\n  FAIL — the drill did not complete: ${err?.message ?? err}`);
    if (process.env.BRT_DEBUG) console.error(err);
    else console.error('  (set BRT_DEBUG=1 for the full stack)');
    code = 1;
  }
  // Exit explicitly. Everything this script owns is closed by the time main()
  // returns, but the optional embedded cluster is an external process and a
  // stray handle must not turn a finished drill into a hung CI job.
  process.exit(code);
}
