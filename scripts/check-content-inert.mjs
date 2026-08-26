// Content-inertness check (#488).
//
// Karen's corpus loader, the seed runners, and validate-content.mjs all
// *dynamically import* every `supabase/seed/**/*.mjs` — JavaScript `import`
// executes the file — inside processes that may carry `gh` write auth, a DB
// connection, or a Vision key. A seed file is meant to be data (titles, dates,
// source URLs), but because it runs, a malicious or mistaken file could read a
// secret, hit the network, touch the filesystem, or run a command with those
// credentials. That risk was flagged in the PR #139 review.
//
// **This is a POSITIVE grammar (allow-what's-proven), not a deny-list.** A file
// passes only if *every* node is in a small allowlist of provably-inert
// constructs: literals, template/array/object literals, local `const` +
// pure-helper declarations, calls to *locally-declared* helpers, a relative
// import of a sibling seed module, and a default/named export of those. Anything
// not on the list fails by default — in particular ALL member access
// (`a.b`, `a[b]`), computed keys, object methods/getters/setters, `new`,
// non-identifier call targets, `await`, and free identifiers. A deny-list of
// dangerous *names* is not enough: `({}).constructor.constructor('…')()` reaches
// the `Function` constructor through a literal's prototype without ever naming
// `Function`/`eval`/`process`, and getter/`toString` members execute when the
// corpus loader reads a property. Banning the *shapes* (member access, computed
// access, accessors) closes that whole class rather than patching names one by
// one. (PR #507 review, executable red-team, 2026-07-12.)
//
// A file that passes cannot do I/O, reach a secret, or exec — importing it can
// only build a constant. This protects Karen + the seed runner +
// validate-content, and is the precondition for the content auto-merge gate.
//
// A small, EXACT allowlist covers any file that genuinely must deviate (none
// today). Every allowlist entry must point at a real file, so the exception set
// can neither rot nor silently grow.
//
// Parser: the TypeScript compiler API (a devDependency), AST read only — no
// type-checking, no emit.
//
// Exports `checkSource`, `SEED_DIR`, `SEED_PREFIX`, `ALLOWLIST`, `SAFE_GLOBALS`,
// `ROOT`, and `listSeedFiles` for tests.

import ts from 'typescript';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..');
export const SEED_PREFIX = 'supabase/seed/';
export const SEED_DIR = join(ROOT, 'supabase', 'seed');

// EXACT allowlist of seed files exempt from the grammar. Keyed by repo-relative
// POSIX path with a reason. Empty today — the whole corpus passes on its own.
// Every entry must point at a real file (a stale entry fails the check).
export const ALLOWLIST = {};

// The only free identifiers a value may reference (safe constants that cannot
// be reassigned to a capability). Everything else must be locally bound.
export const SAFE_GLOBALS = new Set(['undefined', 'NaN', 'Infinity']);

// Binary/logical operators allowed between pure operands. Excludes `,`,
// `instanceof`, `in`, and assignment forms.
const SAFE_BINARY_OPS = new Set([
  ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken, ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.SlashToken, ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken,
]);

const toPosix = (p) => p.split('\\').join('/');
const relPosix = (abs) => toPosix(relative(ROOT, abs));
const kindName = (node) => ts.SyntaxKind[node.kind];

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

// Resolve an import specifier relative to `relPath` and decide whether it is a
// safe sibling-seed import (relative, inside supabase/seed, ending in .mjs).
function importAllowed(relPath, specifier) {
  if (typeof specifier !== 'string') return false;
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return false;
  const resolved = posix.normalize(posix.join(posix.dirname(relPath), specifier));
  return resolved.startsWith(SEED_PREFIX) && resolved.endsWith('.mjs');
}

// Collect every name introduced by a binding anywhere in the module (imports,
// const/var declarations incl. destructuring, function names, params). Used to
// decide whether an identifier reference / call target is locally bound.
function collectBoundNames(sf) {
  const bound = new Set();
  const add = (name) => { if (name && ts.isIdentifier(name)) bound.add(name.text); };
  const visit = (node) => {
    if (ts.isImportClause(node)) add(node.name);
    else if (ts.isImportSpecifier(node) || ts.isNamespaceImport(node)) add(node.name);
    else if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) add(node.name);
    else if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) add(node.name);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return bound;
}

/**
 * Positive-grammar checker. Returns human-readable violation strings (empty =
 * passes). `relPath` is the repo-relative POSIX path.
 */
export function checkSource(relPath, code) {
  if (Object.prototype.hasOwnProperty.call(ALLOWLIST, relPath)) return [];

  const sf = ts.createSourceFile(relPath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const bound = collectBoundNames(sf);
  const violations = [];
  const fail = (node, msg) => violations.push(`${msg} (${kindName(node)})`);

  // ── a pure, inert VALUE ────────────────────────────────────────────────
  const checkExpr = (node) => {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.BigIntLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
      case ts.SyntaxKind.NullKeyword:
        return;
      case ts.SyntaxKind.Identifier:
        if (!bound.has(node.text) && !SAFE_GLOBALS.has(node.text))
          fail(node, `free identifier \`${node.text}\` (only literals and locally-bound names allowed)`);
        return;
      case ts.SyntaxKind.ParenthesizedExpression:
        return checkExpr(node.expression);
      case ts.SyntaxKind.PrefixUnaryExpression: {
        const ok = node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken;
        if (ok && ts.isNumericLiteral(node.operand)) return;
        return fail(node, 'unary expression other than +/- on a number');
      }
      case ts.SyntaxKind.TemplateExpression:
        for (const span of node.templateSpans) checkExpr(span.expression);
        return;
      case ts.SyntaxKind.ArrayLiteralExpression:
        for (const el of node.elements) {
          if (ts.isSpreadElement(el)) { fail(el, 'spread element'); continue; }
          checkExpr(el);
        }
        return;
      case ts.SyntaxKind.ObjectLiteralExpression:
        for (const prop of node.properties) {
          if (ts.isPropertyAssignment(prop)) {
            if (ts.isComputedPropertyName(prop.name)) fail(prop.name, 'computed property key');
            checkExpr(prop.initializer);
          } else if (ts.isShorthandPropertyAssignment(prop)) {
            if (!bound.has(prop.name.text) && !SAFE_GLOBALS.has(prop.name.text))
              fail(prop, `shorthand references free identifier \`${prop.name.text}\``);
          } else {
            // SpreadAssignment, MethodDeclaration, Get/SetAccessor — all reject.
            fail(prop, 'non-data object member (spread, method, or getter/setter)');
          }
        }
        return;
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.FunctionExpression:
        checkFunctionBody(node.body);
        return;
      case ts.SyntaxKind.CallExpression:
        // Only calls to a locally-declared helper identifier are allowed. This
        // bans every member-expression callee (`a.b()`, `x['c']()`), dynamic
        // `import()`, `super()`, and IIFEs of computed targets.
        if (!ts.isIdentifier(node.expression) || !bound.has(node.expression.text))
          fail(node, 'call whose target is not a locally-declared helper');
        else for (const arg of node.arguments) checkExpr(arg);
        return;
      case ts.SyntaxKind.ConditionalExpression:
        checkExpr(node.condition); checkExpr(node.whenTrue); checkExpr(node.whenFalse);
        return;
      case ts.SyntaxKind.BinaryExpression:
        if (!SAFE_BINARY_OPS.has(node.operatorToken.kind))
          return fail(node, `disallowed binary operator \`${node.operatorToken.getText(sf)}\``);
        checkExpr(node.left); checkExpr(node.right);
        return;
      default:
        // PropertyAccessExpression, ElementAccessExpression, NewExpression,
        // AwaitExpression, TaggedTemplate, etc. all land here and fail.
        return fail(node, 'expression is not a provably-inert data value');
    }
  };

  // ── statements permitted inside a helper body ──────────────────────────
  const checkFunctionBody = (body) => {
    if (!body) return;
    if (!ts.isBlock(body)) return checkExpr(body); // concise arrow: `=> expr`
    for (const stmt of body.statements) {
      if (ts.isReturnStatement(stmt)) { if (stmt.expression) checkExpr(stmt.expression); }
      else if (ts.isVariableStatement(stmt)) checkVariableStatement(stmt, /*inFn*/ true);
      else if (ts.isIfStatement(stmt)) {
        checkExpr(stmt.expression);
        checkFunctionBody(ts.isBlock(stmt.thenStatement) ? stmt.thenStatement : ts.factory.createBlock([stmt.thenStatement]));
        if (stmt.elseStatement)
          checkFunctionBody(ts.isBlock(stmt.elseStatement) ? stmt.elseStatement : ts.factory.createBlock([stmt.elseStatement]));
      } else fail(stmt, 'disallowed statement in helper body');
    }
  };

  const checkVariableStatement = (node, inFn = false) => {
    const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
    if (!isConst) return fail(node, 'only `const` declarations are allowed');
    for (const decl of node.declarationList.declarations) {
      if (!decl.initializer) { fail(decl, '`const` without an initializer'); continue; }
      checkExpr(decl.initializer);
    }
    void inFn;
  };

  // ── top-level module statements ────────────────────────────────────────
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) || (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier)) {
      const spec = stmt.moduleSpecifier;
      const text = spec && ts.isStringLiteral(spec) ? spec.text : undefined;
      if (!importAllowed(relPath, text))
        fail(stmt, `imports \`${text ?? '?'}\` — only relative sibling seed \`.mjs\` imports are allowed`);
    } else if (ts.isExportDeclaration(stmt)) {
      // `export { a, b }` (no module specifier) — names must be bound.
      const names = stmt.exportClause && ts.isNamedExports(stmt.exportClause) ? stmt.exportClause.elements : [];
      for (const el of names) {
        const local = (el.propertyName ?? el.name).text;
        if (!bound.has(local)) fail(el, `export of unbound name \`${local}\``);
      }
    } else if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      checkExpr(stmt.expression); // export default <value>
    } else if (ts.isVariableStatement(stmt)) {
      checkVariableStatement(stmt);
    } else if (ts.isFunctionDeclaration(stmt)) {
      checkFunctionBody(stmt.body);
    } else if (stmt.kind === ts.SyntaxKind.EmptyStatement) {
      // ok
    } else {
      fail(stmt, 'disallowed top-level statement — a seed file is data + pure helpers only');
    }
  }

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

  console.log(`content-inertness: scanned ${files.length} seed file(s); ${Object.keys(ALLOWLIST).length} allowlisted exception(s).`);
  if (problems.length) {
    console.error(`\n✗ ${problems.length} content-inertness violation(s):\n`);
    for (const { rel, v } of problems) console.error(`  ${rel}\n      ${v}`);
    console.error(
      '\nSeed files are executed on import, so they must be provably inert: only\n' +
        'literals, template/array/object literals, local `const`/pure-helper\n' +
        'declarations, calls to locally-declared helpers, a relative sibling-seed\n' +
        'import, and default/named exports of those. No member access, computed\n' +
        'keys, object methods/getters, `new`, `await`, or free identifiers. If a\n' +
        'file genuinely must deviate, add it to ALLOWLIST with a reason. See #488.',
    );
    process.exit(1);
  }
  console.log('✓ all seed files are provably inert (safe to import).');
}

if (process.argv[1] && toPosix(process.argv[1]).endsWith('scripts/check-content-inert.mjs')) {
  main();
}
