// Proves every `node <file>` a GitHub workflow runs actually LOADS under plain
// node (P0-23).
//
// WHY. Workflows run plain `node` (Node 24: strips TS types but does NOT
// resolve extensionless imports or TS path re-exports). vitest resolves
// everything, so a PR can pass the whole suite and still break production:
// #5968 broke the hourly Tidewatch sweep (route.mjs -> @swift2/core
// extensionless re-exports); #5973 nearly broke Kevin radar / ops precheck /
// recall (client.ts imported './usage').
//
// RULE. For each workflow `run:` command invoking `node [--flags] <file>`
// (node -e, npx, npm, tsx are skipped; `${{ }}` paths are skipped and listed):
//  - LOAD check: spawn `node --input-type=module -e "await import(<url>)"` in
//    a minimal, secret-free env (HOME/USERPROFILE -> an empty temp dir so no
//    gh/git credentials are readable, DOTENV_CONFIG_PATH -> nonexistent file)
//    with a per-entry timeout. Many entries run main() on import, so a runtime
//    failure (missing env, no network) is a PASS; only module-load errors in
//    stderr fail. A timeout is killed and counts as PASS (the module loaded).
//  - STATIC-ONLY entries are NEVER spawned (importing them may post, delete,
//    email or message for real). Instead their static import graph is walked:
//    relative specifiers must exist with an explicit extension, workspace
//    packages must resolve to a real file. An entry is static-only when it
//    sits under STATIC_ONLY_PREFIXES, is in STATIC_ONLY_FILES, or when it or
//    anything in its static import graph mentions an external send API
//    (SEND_RE: X, Instagram, Facebook, Discord, Resend/email). When unsure,
//    add it here.

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { builtinModules } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, posix as pathPosix, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { runMain } from './lib/cli.mjs';
import { isMain } from './lib/is-main.mjs';

const SELF_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Everything under these (repo-relative, posix) is static-only. */
export const STATIC_ONLY_PREFIXES = ['scripts/social/', 'scripts/community/', 'scripts/marjorie/'];
/** Individually listed static-only entries (live side effects on import). */
export const STATIC_ONLY_FILES = [
  'scripts/social/post-queue.mjs',
  'scripts/social/delete-media.mjs',
  'scripts/notifications-kill.mjs',
  'scripts/ops/clock-dispatch.mjs',
  'scripts/watchdog/push-dispatch-heartbeat.mjs',
  'scripts/content-engine/run.mjs',
  'scripts/ops/issue-sweeper.mjs',
];
/**
 * Known load failures: entry -> { reason, issue }. A listed entry that fails
 * prints "known failure (#N)" and does not fail CI; one that now passes prints
 * a notice to remove it. Any other failure exits 1.
 */
export const KNOWN_FAILURES = {};
const SEND_RE =
  /discord(?:app)?\.com|api\.resend\.com|resend\.com\/emails|\bnew\s+Resend\b|from\s+['"]resend['"]|nodemailer|graph\.facebook\.com|graph\.instagram\.com|api\.(?:twitter|x)\.com|upload\.twitter\.com|twitter-api-v2|sendmail/i;
const LOAD_ERR_RE =
  /ERR_MODULE_NOT_FOUND|ERR_UNKNOWN_FILE_EXTENSION|ERR_IMPORT_ATTRIBUTE_MISSING|ERR_UNSUPPORTED_DIR_IMPORT|ERR_PACKAGE_PATH_NOT_EXPORTED|\bSyntaxError\b/;
const NODE_RE =
  /(?:^|[\s;&|(])node\s+((?:-\S+\s+)*)(?:\$\{?GITHUB_WORKSPACE\}?\/)?([^\s;&|"'()]+\.(?:m?js|cjs))([^;&|\n<>)]*)/g;
const TYPE_IMPORT_RE = /\b(?:import|export)\s+type\s+[^;'"]*?\bfrom\s*['"][^'"\n]+['"]/g;
const NAMED_FROM_RE = /\b(?:import|export)\s*\{([^}]*)\}\s*from\s*['"][^'"\n]+['"]/g;
const allTypeQualified = (list) => {
  const parts = list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 && parts.every((p) => /^type\s/.test(p));
};
const stripTypeOnly = (src) =>
  src
    .replace(TYPE_IMPORT_RE, '')
    .replace(NAMED_FROM_RE, (m, list) => (allTypeQualified(list) ? '' : m));
const IMPORT_RE =
  /(?:\bimport\s+(?:[\w*${}\s,]+\s+from\s+)?|\bexport\s+(?:[\w*${}\s,]+\s+)?from\s+|\bimport\s*\(\s*)['"]([^'"\n]+)['"]/g;
const BUILTINS = new Set(builtinModules);
const posix = (p) => p.split(sep).join('/');

/** Entries a run-script invokes with plain node, plus unresolvable ones. */
export function collectEntries(root) {
  const dir = join(root, '.github', 'workflows');
  const invocations = new Map();
  const skipped = [];
  if (!existsSync(dir)) return { entries: [], invocations: [], skipped };
  for (const f of readdirSync(dir)
    .filter((x) => /\.ya?ml$/.test(x))
    .sort()) {
    const doc = parse(readFileSync(join(dir, f), 'utf8'));
    for (const job of Object.values(doc?.jobs ?? {})) {
      for (const step of job?.steps ?? []) {
        const wd = String(
          step?.['working-directory'] ??
            job?.defaults?.run?.['working-directory'] ??
            doc?.defaults?.run?.['working-directory'] ??
            '',
        );
        for (const m of String(step?.run ?? '')
          .replace(/\\\r?\n/g, ' ')
          .replace(/\$\{\{[^}]*\}\}/g, '$EXPR')
          .matchAll(NODE_RE)) {
          if (/(?:^|\s)(?:-e|-p|--eval|--print)\s/.test(m[1])) continue;
          const rel = m[2].replace(/^\.\//, '');
          const file = wd ? pathPosix.normalize(`${wd}/${rel}`) : rel;
          if (/\$|^\.\./.test(file)) skipped.push(`${f}: ${file}`);
          else {
            const args = m[3]
              .trim()
              .split(/\s+/)
              .filter((a) => a && !/^\d$/.test(a))
              .map((a) => a.replace(/^(['"])(.*)\1$/, '$2'));
            const key = `${file}\0${args.join('\0')}`;
            if (!invocations.has(key)) invocations.set(key, { entry: file, args, workflow: f });
          }
        }
      }
    }
  }
  const list = [...invocations.values()].sort(
    (a, b) => a.entry.localeCompare(b.entry) || a.args.join(' ').localeCompare(b.args.join(' ')),
  );
  return { entries: [...new Set(list.map((i) => i.entry))], invocations: list, skipped };
}

function resolveWorkspace(root, spec) {
  const m = spec.match(/^(@[^/]+\/[^/]+|[^/@][^/]*)(\/.*)?$/);
  if (!m) return null;
  const pkgDir = join(root, 'node_modules', m[1]);
  const pj = join(pkgDir, 'package.json');
  if (!existsSync(pj)) return null;
  const pkg = JSON.parse(readFileSync(pj, 'utf8'));
  const sub = m[2] ? `.${m[2]}` : '.';
  const pick = (t) =>
    typeof t === 'string'
      ? t
      : t && typeof t === 'object'
        ? pick(t.import ?? t.node ?? t.default)
        : null;
  let target;
  if (pkg.exports) {
    const ex =
      typeof pkg.exports === 'string' || pkg.exports.import || pkg.exports.default
        ? { '.': pkg.exports }
        : pkg.exports;
    target = pick(ex[sub]);
  } else target = sub === '.' ? (pkg.main ?? 'index.js') : sub.slice(2);
  return target ? join(pkgDir, target) : undefined;
}

/**
 * Walk a file's static import graph. Returns { problems, files }. Bare npm
 * packages and builtins are accepted when present; relative specifiers need an
 * explicit extension and an existing file.
 */
export function walkStatic(root, entryRel) {
  const problems = [];
  const files = new Set();
  const stack = [join(root, entryRel)];
  while (stack.length) {
    const file = stack.pop();
    if (files.has(file)) continue;
    files.add(file);
    if (!existsSync(file) || !statSync(file).isFile()) {
      problems.push(`${relative(root, file)}: file not found`);
      continue;
    }
    if (!/\.(?:m?js|cjs|ts)$/.test(file)) continue;
    const src = stripTypeOnly(
      readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, ''),
    );
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1];
      const where = relative(root, file);
      if (spec.startsWith('node:') || BUILTINS.has(spec)) continue;
      if (spec.startsWith('.') || spec.startsWith('/')) {
        const target = resolve(dirname(file), spec);
        if (!/\.(?:m?js|cjs|ts|json)$/.test(spec))
          problems.push(`${where}: extensionless import '${spec}'`);
        else if (!existsSync(target)) problems.push(`${where}: '${spec}' does not exist`);
        else stack.push(target);
        continue;
      }
      const ws = resolveWorkspace(root, spec);
      if (ws === null) {
        if (!existsSync(join(root, 'node_modules', spec.split('/')[0])))
          problems.push(`${where}: package '${spec}' not installed`);
      } else if (ws === undefined || !existsSync(ws))
        problems.push(`${where}: '${spec}' does not resolve to a file`);
      else if (!posix(realpathSync(ws)).includes('/node_modules/')) stack.push(realpathSync(ws));
    }
  }
  return { problems, files };
}

export function isStaticOnly(root, entryRel, extra = []) {
  const e = posix(entryRel);
  if (STATIC_ONLY_FILES.includes(e) || extra.includes(e)) return 'listed';
  if (STATIC_ONLY_PREFIXES.some((p) => e.startsWith(p))) return 'prefix';
  const { files } = walkStatic(root, e);
  for (const f of files) {
    if (
      existsSync(f) &&
      statSync(f).isFile() &&
      /\.(?:m?js|cjs|ts)$/.test(f) &&
      SEND_RE.test(readFileSync(f, 'utf8'))
    ) {
      return `send-api:${posix(relative(root, f))}`;
    }
  }
  return null;
}

function loadCheck(root, entryRel, { timeoutMs, home, args = [] }) {
  return new Promise((done) => {
    const filePath = join(root, entryRel);
    const url = pathToFileURL(filePath).href;
    const env = {
      __ARGS: JSON.stringify([filePath, ...args]),
      PATH: process.env.PATH ?? '',
      HOME: home,
      USERPROFILE: home,
      CI: 'true',
      DOTENV_CONFIG_PATH: join(home, 'no-such.env'),
    };
    if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
    const child = spawn(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `process.argv.push(...JSON.parse(process.env.__ARGS)); await import(${JSON.stringify(url)})`,
      ],
      { cwd: root, env, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true },
    );
    let err = '';
    let timedOut = false;
    child.stderr.on('data', (d) => (err = (err + d).slice(-20000)));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.on('close', () => {
      clearTimeout(timer);
      const hit = LOAD_ERR_RE.test(err.replace(/SyntaxError: [^\n]*JSON[^\n]*/g, ''));
      done({
        ok: !hit,
        timedOut,
        detail: hit
          ? err
              .split('\n')
              .find((l) => /^\w*Error\b/.test(l))
              ?.trim()
              .slice(0, 240)
          : '',
      });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      done({ ok: false, timedOut, detail: String(e) });
    });
  });
}

export async function checkEntries({
  root = SELF_ROOT,
  timeoutMs = 20000,
  concurrency = 6,
  dryRun = false,
  extraStaticOnly = [],
  knownFailures = KNOWN_FAILURES,
} = {}) {
  const { invocations, skipped } = collectEntries(root);
  const home = mkdtempSync(join(tmpdir(), 'wf-entries-'));
  const results = [];
  const queue = [];
  const staticSeen = new Set();
  for (const { entry, args } of invocations) {
    const why = isStaticOnly(root, entry, extraStaticOnly);
    if (why) {
      if (staticSeen.has(entry)) continue;
      staticSeen.add(entry);
      const { problems } = walkStatic(root, entry);
      results.push({
        entry,
        mode: 'static',
        why,
        ok: problems.length === 0,
        detail: problems.join('; '),
      });
    } else if (dryRun)
      results.push({ entry, args, mode: 'load (dry-run, not spawned)', ok: true, detail: '' });
    else queue.push({ entry, args });
  }
  let i = 0;
  const worker = async () => {
    while (i < queue.length) {
      const { entry, args } = queue[i++];
      const r = await loadCheck(root, entry, { timeoutMs, home, args });
      results.push({
        entry,
        args,
        mode: 'load',
        ok: r.ok,
        timedOut: r.timedOut,
        detail: r.timedOut ? 'timeout (loaded)' : r.detail,
      });
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  results.sort((a, b) => a.entry.localeCompare(b.entry) || a.args.join(' ').localeCompare(b.args.join(' ')));
  const byEntry = new Map();
  for (const r of results) byEntry.set(r.entry, (byEntry.get(r.entry) ?? true) && r.ok);
  for (const r of results) {
    const known = knownFailures[r.entry];
    if (!known) continue;
    if (!r.ok) r.known = known;
    else if (byEntry.get(r.entry)) r.nowPasses = known;
  }
  return { results, skipped, failed: results.filter((r) => !r.ok && !r.known) };
}

async function main() {
  const dryRun = process.argv.includes('--list');
  const { results, skipped, failed } = await checkEntries({ dryRun });
  for (const r of results) {
    const tag = r.ok ? 'PASS' : r.known ? 'KNOWN' : 'FAIL';
    const argv = r.args?.length ? ` ${r.args.join(' ')}` : '';
    console.log(
      `${tag}  ${r.mode.padEnd(7)} ${r.entry}${argv}${r.why ? `  [${r.why}]` : ''}${r.detail ? `  -- ${r.detail}` : ''}`,
    );
    if (r.timedOut && r.ok) console.log(`NOTE  timeout counted as PASS: ${r.entry}${argv}`);
    if (r.known)
      console.log(`NOTE  ${r.entry}: known failure (#${r.known.issue}) -- ${r.known.reason}`);
    if (r.nowPasses)
      console.log(`NOTE  ${r.entry}: now passes, remove from KNOWN_FAILURES (#${r.nowPasses.issue})`);
  }
  for (const s of skipped) console.log(`SKIP  unresolvable  ${s}`);
  console.log(
    `\n${results.length} entries, ${results.filter((r) => r.mode === 'static').length} static-only, ${skipped.length} skipped, ${failed.length} failed`,
  );
  return failed.length ? 1 : 0;
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'check-workflow-entries' });
