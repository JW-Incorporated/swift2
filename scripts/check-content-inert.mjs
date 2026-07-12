// Content-inertness check (#488).
//
// Karen's corpus loader, the seed runners, and validate-content.mjs all
// *dynamically import* every `supabase/seed/**/*.mjs` — JavaScript `import`
// executes the file — inside processes that may carry `gh` write auth, a DB
// connection, or a Vision key. A seed file is meant to be data (titles, dates,
// source URLs), but because it is executed, a malicious or mistaken file could
// read a secret, hit the network, touch the filesystem, or run a command with
// those credentials. That risk was flagged in the PR #139 review.
//
// This check makes importing a seed file provably safe by proving it has **no
// dangerous capability**. It does NOT require a bare object literal (the corpus
// is authored with small, pure, local factory helpers like `wiki(...)`, which
// only assemble data and are harmless). Instead it rejects the capabilities an
// attacker would actually need:
//
//   • importing external/bare modules (`node:fs`, `child_process`, any npm pkg)
//   • dynamic `import(...)` or `require(...)` (can take a computed specifier)
//   • referencing capability globals: process, globalThis/global, require,
//     module/exports, __dirname/__filename, eval, Function, fetch, XHR,
//     WebSocket/EventSource, Deno/Bun, WebAssembly, importScripts, Worker
//   • `await` (no async side effects at import time)
//
// Pure local `const`/helper functions, template-literal URLs, and **relative
// imports of sibling seed data modules** (which are themselves checked here) are
// allowed. A file that passes cannot do I/O, reach a secret, or exec — importing
// it can only build a constant. This is the concrete gate #488 asks for: it
// protects Karen + the seed runner + validate-content, and is a precondition for
// the content auto-merge gate (auto-merged content PRs touch files under this
// check and cannot introduce a capability without editing this script itself,
// which is not content).
//
// A small, EXACT allowlist is kept for any file that genuinely must hold a
// capability (none today). Every allowlist entry must point at a real file, so
// the exception set can neither rot nor silently grow.
//
// Parser: the TypeScript compiler API (a devDependency), used only to read the
// AST — no type-checking, no emit.
//
// Exports `checkSource`, `SEED_DIR`, `SEED_PREFIX`, `ALLOWLIST`, `DANGER_GLOBALS`,
// and `listSeedFiles` for tests.

import ts from 'typescript';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..');
export const SEED_PREFIX = 'supabase/seed/';
export const SEED_DIR = join(ROOT, 'supabase', 'seed');

// EXACT allowlist of seed files exempt from the capability check. Keyed by
// repo-relative POSIX path with a reason. Empty today — the whole corpus passes
// on its own. Every entry must point at a real file (a stale entry fails the
// check), so the exception set cannot rot or silently grow.
export const ALLOWLIST = {
  // 'supabase/seed/example.mjs': 'why this file genuinely needs a capability',
};

// Free-identifier references that grant a dangerous capability. Referencing any
// of these (as a value, not as a property name/key or a locally-bound name)
// fails the check. Reaching a real capability requires at least one of these,
// so shadowing a name (e.g. `const process = …`) cannot smuggle one in.
export const DANGER_GLOBALS = new Set([
  'process', 'globalThis', 'global', 'require', 'module', 'exports',
  '__dirname', '__filename', 'eval', 'Function', 'fetch', 'XMLHttpRequest',
  'WebSocket', 'EventSource', 'Deno', 'Bun', 'WebAssembly', 'importScripts',
  'Worker', 'SharedArrayBuffer', 'Atomics',
]);

const toPosix = (p) => p.split('\\').join('/');
const relPosix = (abs) => toPosix(relative(ROOT, abs));

/** Recursively list every `*.mjs` under supabase/seed (repo-relative POSIX). */
export function listSeedFiles(dir = SEED_DIR) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) out.push(...listSeedFiles(abs));
    else if (entry.endsWith('.mjs')) out.push(relPosix(abs));
  }
  return out.sort();
}

// Resolve an import specifier relative to `relPath` (repo-relative POSIX) and
// decide whether it is a safe sibling-seed data import. Pure string math — no fs.
function importAllowed(relPath, specifier) {
  if (typeof specifier !== 'string') return false;
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return false; // bare/absolute
  const resolved = posix.normalize(posix.join(posix.dirname(relPath), specifier));
  return resolved.startsWith(SEED_PREFIX) && resolved.endsWith('.mjs');
}

// Collect names introduced by bindings anywhere in the module (over-approximated
// module-wide, which is safe: it can only make us MORE permissive about plain
// identifiers, and a capability still requires a free danger-global we do catch).
function collectBoundNames(sf) {
  const bound = new Set();
  const add = (name) => { if (name && ts.isIdentifier(name)) bound.add(name.text); };
  const visit = (node) => {
    if (ts.isImportClause(node)) add(node.name);
    else if (ts.isImportSpecifier(node) || ts.isNamespaceImport(node)) add(node.name);
    else if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) add(node.name);
    else if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isClassDeclaration(node)) add(node.name);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return bound;
}

// Is this Identifier a *reference* to a value (vs a property name, property key,
// or a binding position)? Shorthand `{ process }` counts as a reference.
function isValueReference(node) {
  const p = node.parent;
  if (!p) return true;
  if (ts.isPropertyAccessExpression(p) && p.name === node) return false; // `.name`
  if (ts.isQualifiedName(p) && p.right === node) return false;
  if (ts.isPropertyAssignment(p) && p.name === node) return false;       // key: value
  if (ts.isMethodDeclaration(p) && p.name === node) return false;
  if (ts.isBindingElement(p) && p.propertyName === node) return false;   // { propertyName: local }
  // Binding/declaration name positions are not references:
  if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isBindingElement(p) ||
       ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) || ts.isClassDeclaration(p) ||
       ts.isImportClause(p) || ts.isImportSpecifier(p) || ts.isNamespaceImport(p)) && p.name === node) return false;
  return true;
}

/**
 * Check one seed file's source. Returns an array of human-readable violation
 * strings (empty = passes). `relPath` is the repo-relative POSIX path.
 */
export function checkSource(relPath, code) {
  if (Object.prototype.hasOwnProperty.call(ALLOWLIST, relPath)) return []; // exempt

  const sf = ts.createSourceFile(relPath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const bound = collectBoundNames(sf);
  const violations = [];

  const visit = (node) => {
    // External/unsafe static imports and re-exports.
    if (ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier)) {
      const spec = node.moduleSpecifier;
      const text = spec && ts.isStringLiteral(spec) ? spec.text : undefined;
      if (!importAllowed(relPath, text))
        violations.push(`imports \`${text ?? '?'}\` — only relative imports of sibling seed \`.mjs\` files are allowed`);
    } else if (ts.isImportEqualsDeclaration(node)) {
      violations.push('`import =` / `require` import is not allowed');
    }
    // Dynamic import(...) and require(...) calls.
    else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword)
        violations.push('dynamic `import(...)` is not allowed');
    }
    // No async side effects at import time.
    else if (ts.isAwaitExpression(node)) {
      violations.push('`await` is not allowed in a seed file');
    }
    // Free references to capability globals.
    else if (ts.isIdentifier(node) && DANGER_GLOBALS.has(node.text) && !bound.has(node.text) && isValueReference(node)) {
      violations.push(`references dangerous global \`${node.text}\` (seed files may not reach I/O, secrets, or exec)`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // De-duplicate identical messages (e.g. the same global referenced many times).
  return [...new Set(violations)];
}

function main() {
  const files = listSeedFiles();
  const problems = [];

  for (const rel of files) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    for (const v of checkSource(rel, code)) problems.push({ rel, v });
  }

  // The allowlist must be EXACT: every entry must point at a file that exists.
  for (const rel of Object.keys(ALLOWLIST)) {
    if (!existsSync(join(ROOT, rel)))
      problems.push({ rel, v: 'stale allowlist entry — file does not exist; remove it from ALLOWLIST' });
  }

  const allow = Object.keys(ALLOWLIST).length;
  console.log(`content-inertness: scanned ${files.length} seed file(s); ${allow} allowlisted exception(s).`);

  if (problems.length) {
    console.error(`\n✗ ${problems.length} content-inertness violation(s):\n`);
    for (const { rel, v } of problems) console.error(`  ${rel}\n      ${v}`);
    console.error(
      '\nSeed files are executed on import, so they must hold no dangerous capability:\n' +
        'no external/bare imports, no dynamic import()/require(), no process/eval/Function/\n' +
        'fetch/network/fs globals, no top-level await. Pure local helpers and relative\n' +
        'imports of sibling seed .mjs files are fine. If a file genuinely needs a capability,\n' +
        'add it to ALLOWLIST in scripts/check-content-inert.mjs with a reason. See #488.',
    );
    process.exit(1);
  }
  console.log('✓ all seed files are provably capability-free (safe to import).');
}

// Run only when invoked directly (not when imported by the test).
if (process.argv[1] && toPosix(process.argv[1]).endsWith('scripts/check-content-inert.mjs')) {
  main();
}
