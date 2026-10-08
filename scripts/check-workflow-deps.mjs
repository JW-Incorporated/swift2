// Guards .github/workflows/*.yml against the "forgot to install deps" trap.
//
// WHY. The local composite action .github/actions/setup-repo defaults
// `npm-ci` to 'false'. A job that then runs `node scripts/x.mjs` / `npx tsx
// ...` where x imports an npm package (@supabase/supabase-js) or a workspace
// package (@swift2/*) dies with ERR_MODULE_NOT_FOUND — on a scheduled
// workflow that is red every run until someone notices. It happened twice in
// one day (#5219 merch-awin-sync, #5224 appearance-discovery), so per
// CLAUDE.md rule 8 it is now a deterministic check.
//
// RULE. For every job step that runs a repo node/tsx script (directly or via
// `npm run <script>`), the script and its relative imports (transitively)
// are scanned. If any import is a non-builtin bare specifier, the job must
// install deps (setup-repo `npm-ci: 'true'`, or an `npm ci`/`npm install`
// step). If any import resolves to a gitignored `*.generated.*` file, the job
// must also run `npm run sync:content`. Scripts that only use `node:`
// builtins and relative files keep the fast no-install path.
//
// ALLOWLIST: `workflow-file.yml:jobId` -> reason, for edge cases.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { runMain } from './lib/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const ALLOWLIST = {};

const GEN_RE = /\.generated(\.|$)/;
const BUILTINS = new Set(builtinModules);
const EXTS = ['', '.mjs', '.js', '.ts', '.tsx', '.cjs', '/index.mjs', '/index.js', '/index.ts'];
const SCRIPT_RE = /(?:^|[\s;&|(])(?:node|tsx|npx(?:\s+--?\S+)*\s+tsx)\s+([^\n;&|]*)/g;
const SCRIPT_FILE_RE = /^(?:\.\/)?[\w./-]+\.(?:m?js|cjs|ts)$/;
const NPM_RUN_RE = /(?:^|[\s;&|(])npm\s+run\s+(?:--silent\s+)?([\w:.-]+)/g;
const INSTALL_RE = /(?:^|[\s;&|(])npm\s+(?:ci|install|i)(?:\s|$)/;
const SYNC_RE = /npm\s+run\s+sync:content\b/;
const IMPORT_RE =
  /(?:\bimport\s+(?:[\w*${}\s,]+\s+from\s+)?|\bexport\s+(?:[\w*${}\s,]+\s+)?from\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"\n]+)['"]/g;

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

export function jobInstallsDeps(job) {
  let installs = false;
  let syncs = false;
  for (const step of job.steps ?? []) {
    const uses = String(step.uses ?? '');
    if (uses.includes('.github/actions/setup-repo') && String(step.with?.['npm-ci']) === 'true') {
      installs = true;
    }
    const run = String(step.run ?? '');
    if (INSTALL_RE.test(run)) installs = true;
    if (SYNC_RE.test(run)) syncs = true;
  }
  return { installs, syncs };
}

/** Repo script paths a step's `run` text executes (resolving `npm run`). */
export function scriptsRunBy(run, pkgScripts, seen = new Set()) {
  const out = new Set();
  for (const m of run.matchAll(SCRIPT_RE)) {
    const file = m[1].split(/\s+/).find((t) => SCRIPT_FILE_RE.test(t) && /^(?:\.\/)?\w/.test(t));
    if (file && !file.endsWith('.json')) out.add(file.replace(/^\.\//, ''));
  }
  for (const m of run.matchAll(NPM_RUN_RE)) {
    const name = m[1];
    if (seen.has(name) || !pkgScripts[name]) continue;
    seen.add(name);
    for (const s of scriptsRunBy(pkgScripts[name], pkgScripts, seen)) out.add(s);
  }
  return out;
}

/**
 * Walk a script's relative-import graph. Returns the bare packages it needs
 * and any gitignored generated files it imports.
 */
export function scanImports(entry, { root = ROOT, tracked = null, read = defaultRead } = {}) {
  const packages = new Set();
  const generated = new Set();
  const visited = new Set();
  const queue = [entry];
  while (queue.length) {
    const rel = queue.pop();
    if (visited.has(rel)) continue;
    visited.add(rel);
    const src = read(rel, root);
    if (src == null) continue;
    for (const m of stripComments(src).matchAll(IMPORT_RE)) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        const base = join(dirname(rel), spec).split('\\').join('/');
        const hit = EXTS.map((e) => base + e).find((c) => read(c, root) != null);
        if (hit) queue.push(hit);
        else if (GEN_RE.test(spec)) generated.add(base);
        else if (tracked && GEN_RE.test(base)) generated.add(base);
        continue;
      }
      if (spec.startsWith('node:')) continue;
      if (BUILTINS.has(spec.split('/')[0])) continue;
      packages.add(spec);
    }
  }
  for (const f of visited) {
    if (GEN_RE.test(f) && tracked && !tracked.has(f)) generated.add(f);
  }
  return { packages: [...packages], generated: [...generated] };
}

function defaultRead(rel, root) {
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

export function checkWorkflow(file, doc, pkgScripts, opts = {}) {
  const problems = [];
  for (const [jobId, job] of Object.entries(doc?.jobs ?? {})) {
    if (ALLOWLIST[`${file}:${jobId}`]) continue;
    const { installs, syncs } = jobInstallsDeps(job);
    const needs = new Set();
    const needsGen = new Set();
    for (const step of job.steps ?? []) {
      if (!step.run) continue;
      for (const script of scriptsRunBy(String(step.run), pkgScripts)) {
        const { packages, generated } = scanImports(script, opts);
        if (packages.length) needs.add(`${script} -> ${packages.slice(0, 3).join(', ')}`);
        if (generated.length) needsGen.add(`${script} -> ${generated.slice(0, 2).join(', ')}`);
      }
    }
    if (needs.size && !installs) {
      problems.push(
        `${file}:${jobId} runs scripts importing npm packages but never installs deps ` +
          `(set setup-repo \`npm-ci: 'true'\` + \`npm-ci-args: '--ignore-scripts'\`): ${[...needs].join('; ')}`,
      );
    }
    if (needsGen.size && !syncs) {
      problems.push(
        `${file}:${jobId} imports gitignored generated modules but never runs ` +
          `\`npm run sync:content\`: ${[...needsGen].join('; ')}`,
      );
    }
  }
  return problems;
}

function trackedFiles() {
  try {
    const out = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    return new Set(out.split('\n').filter(Boolean));
  } catch {
    return null;
  }
}

async function main() {
  const pkgScripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts ?? {};
  const dir = join(ROOT, '.github', 'workflows');
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
  const tracked = trackedFiles();
  const problems = [];
  for (const f of files) {
    const doc = parse(readFileSync(join(dir, f), 'utf8'));
    problems.push(...checkWorkflow(f, doc, pkgScripts, { tracked }));
  }
  if (problems.length) {
    console.error(`\n✗ ${problems.length} workflow dependency problem(s):\n`);
    for (const p of problems) console.error(`  • ${p}`);
    console.error(
      '\nsetup-repo defaults npm-ci to false; a job running a script that imports an npm\n' +
        'or workspace package must install deps (#5219, #5224). Builtin-only scripts are exempt.\n',
    );
    return 1;
  }
  console.log(`✓ ${files.length} workflow file(s): every job that needs deps installs them.`);
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-workflow-deps.mjs')
) {
  runMain(main, { name: 'check-workflow-deps' });
}
