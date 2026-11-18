#!/usr/bin/env node
// Corpus-dependent tests for content-only PRs (#6865).
//
// ci.yml's `build-content` job skips the full vitest suite, so a seed change
// that broke a test asserting on the real corpus used to pass its own PR and
// turn `main` red (#6850, 2026-11-13). This runs only the tests that can see
// the corpus, discovered on every run rather than kept in a hand list:
//
//   1. every generated content module (`*.generated.ts`, written by
//      `npm run sync:content` from supabase/seed/**);
//   2. every non-test source module that reads supabase/seed/** or
//      apps/web/public/content/** through fs;
//   3. every test file that names one of those paths itself.
//
// Those roots go to `vitest related`, which adds every test that imports a
// root directly or transitively. Run `npm run sync:content` first.
//
//   node scripts/test-corpus.mjs           run the tests
//   node scripts/test-corpus.mjs --roots   print the discovered roots only
//   node scripts/test-corpus.mjs -- <args> extra vitest args (e.g. --reporter)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN_DIRS = ['apps', 'packages', 'scripts'];
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.expo',
  '.turbo',
  'dist',
  'dist-ios',
  'dist-android',
  'build',
  'coverage',
  'public',
  'ios',
  'android',
  // scripts/parity/fixture: frozen copies of generated modules; content PRs
  // cannot change them, so tests importing them are not corpus-dependent.
  'fixture',
]);
const SOURCE_FILE = /\.(?:ts|tsx|mts|mjs|js|cjs)$/;
const TEST_FILE = /\.test\.tsx?$/;
const GENERATED_FILE = /\.generated\.ts$/;
const CORPUS_PATH =
  /supabase\/seed|['"]supabase['"]\s*,\s*['"]seed['"]|public\/content|['"]public['"]\s*,\s*['"]content['"]/;
const FS_READ = /\b(?:readFileSync|readdirSync|readFile|readdir|globSync|glob)\s*\(/;

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), out);
    } else if (SOURCE_FILE.test(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

export function discoverRoots(root = ROOT) {
  const files = SCAN_DIRS.filter((d) => existsSync(join(root, d))).flatMap((d) =>
    walk(join(root, d), []),
  );
  const roots = [];
  for (const file of files) {
    const rel = relative(root, file).split('\\').join('/');
    if (GENERATED_FILE.test(rel)) {
      roots.push(rel);
      continue;
    }
    const text = readFileSync(file, 'utf8');
    if (!CORPUS_PATH.test(text)) continue;
    if (TEST_FILE.test(rel) || FS_READ.test(text)) roots.push(rel);
  }
  return roots.sort();
}

function main(argv) {
  const sep = argv.indexOf('--');
  const own = sep === -1 ? argv : argv.slice(0, sep);
  const extra = sep === -1 ? [] : argv.slice(sep + 1);
  const roots = discoverRoots();
  if (!roots.some((r) => GENERATED_FILE.test(r))) {
    console.error('test-corpus: no *.generated.ts found; run `npm run sync:content` first.');
    return 1;
  }
  if (own.includes('--roots')) {
    console.log(roots.join('\n'));
    return 0;
  }
  console.log(`test-corpus: ${roots.length} corpus roots → vitest related`);
  const vitest = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
  const res = spawnSync(
    process.execPath,
    [vitest, 'related', '--run', '--passWithNoTests', ...extra, ...roots],
    { cwd: ROOT, stdio: 'inherit' },
  );
  return res.status ?? 1;
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2));
}
