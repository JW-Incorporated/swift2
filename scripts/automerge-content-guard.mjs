// automerge-content-guard — the CONTENT/NAME backstop for auto-merge-content.yml.
//
// THE HOLE THIS EXISTS FOR (red-team finding #1972, P0). The path allowlist in
// `.github/content-automerge-allowlist.txt` matches on PREFIXES (a literal
// `startsWith`). That mechanism structurally cannot express two things that
// decide whether a file executes server-side with secrets:
//
//   1. "any Next.js App-Router request handler" — a route handler is ANY
//      `route.ts` / `route.tsx` / `route.js` under `apps/web/app/`, a *suffix*
//      pattern, not a subtree. Three already live OUTSIDE `/api/`
//      (apps/web/app/vault/tier0/route.ts, vault/moment/[id]/route.ts,
//      vault/album/[slug]/tracks/route.ts), so the old single `!apps/web/app/api/`
//      deny let a server route auto-deploy to prod with no human.
//
//   2. "any file that runs on the server with secrets" — a Server Action
//      (`"use server"`), a `server-only` module, or anything reading a secret
//      env var. In the App Router `page.tsx`/`layout.tsx` are Server Components
//      by default, and a Server Action can live in ANY `app/` or `lib/` file.
//      `apps/web/lib/longlive/mood-client.ts` already reads `ANTHROPIC_API_KEY`
//      while sitting among pure display modules — allowlisted by path today.
//
// A path prefix cannot see any of that. This guard inspects the BASENAME and
// CONTENT of each changed code file and reports the ones that must NOT
// auto-merge, so they fall to a human. It is purely additive: it can only make
// the gate stricter (decline more), never widen it.
//
// Ported into the workflow via a dedicated `guard-code` job that checks out the
// BASE ref (this trusted copy) and feeds it the PR head's file contents as data
// (never executing PR code) — same `pull_request_target`-safe pattern as
// scripts/social/check-drafts.mjs. Pure functions are exported for the unit
// test; `main()` reads a `--manifest` JSON array of repo-relative paths.
//
// WIDENED (#3180, found during the #1969 investigation): the original secret
// detection only matched the literal substring `process.env.NAME` /
// `process.env['NAME']`, so a destructuring read (`const { KEY } =
// process.env`) or a read via an imported `env` alias (`import { env } from
// 'node:process'; env.KEY`) evaded it entirely. Both are now flagged — see
// DESTRUCTURES_PROCESS_ENV and processEnvImportAliases below.

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { runMain } from './lib/cli.mjs';

/**
 * Code-file extensions we inspect for server markers. Anything else (JSON, MD,
 * images, seed .mjs data) is not a Next.js execution surface this guard judges.
 */
export const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/** A changed file is a code file iff its extension is one we scan. */
export const isCodeFile = (p) => CODE_EXTENSIONS.includes(path.posix.extname(p.split('\\').join('/')));

/**
 * Secret env vars that must never be read by an auto-merged file. This list is
 * the high-signal set actually used in this repo; the GENERIC heuristic below
 * catches anything shaped like a secret that a future file might add.
 * NEXT_PUBLIC_ / EXPO_PUBLIC_ vars are public by framework convention and are
 * deliberately NOT secrets (e.g. apps/web/lib/vault.ts reads NEXT_PUBLIC_* — it
 * is kept human by PATH, not by this content guard).
 */
export const SECRET_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GITHUB_FEEDBACK_TOKEN',
  'SOCIAL_POSTER_PAT',
  'GOOGLE_VISION_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'VERCEL_TOKEN',
  'X_API_KEY',
  'X_API_KEY_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_TOKEN_SECRET',
  'IG_ACCESS_TOKEN',
];

/**
 * A generic secret-shape: a `process.env` name that looks like a credential and
 * is NOT a framework-public (NEXT_PUBLIC_/EXPO_PUBLIC_) var. Catches a
 * newly-introduced secret the explicit list above hasn't caught up with.
 */
const SECRET_NAME_SHAPE = /(API_KEY|_SECRET|_TOKEN|SERVICE_ROLE|_PAT)$/;
const PUBLIC_PREFIX = /^(NEXT_PUBLIC_|EXPO_PUBLIC_)/;

/** Match `process.env.NAME` and `process.env['NAME']` / `["NAME"]`. */
function envNamesRead(content) {
  const names = new Set();
  const dot = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
  const bracket = /process\.env\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g;
  let m;
  while ((m = dot.exec(content))) names.add(m[1]);
  while ((m = bracket.exec(content))) names.add(m[1]);
  return [...names];
}

/**
 * `const/let/var { ... } = process.env` — a destructuring read never appears
 * as the literal substring `process.env.NAME`, so `envNamesRead` cannot see
 * it. Flagged UNCONDITIONALLY (not filtered by destructured name): even
 * naming a variable in a way that doesn't look like a secret is suspicious
 * enough via this path to need a human look, since scanning individual
 * destructured names is exactly the shape a disguised read would take.
 */
const DESTRUCTURES_PROCESS_ENV = /\b(?:const|let|var)\s*\{[^}]*\}\s*=\s*process\.env\b/;

/**
 * `process.env` imported under an alias — `import { env } from 'node:process'`
 * or `import { env as foo } from 'process'` — never contains the literal
 * substring `process.env` at all, so neither `envNamesRead` nor the
 * destructure check above can see a subsequent `env.NAME` / `env['NAME']` /
 * `const { NAME } = env` read. Returns every local alias bound to `env`.
 */
function processEnvImportAliases(content) {
  const aliases = new Set();
  const re = /import\s*\{[^}]*\benv\b(?:\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*))?[^}]*\}\s*from\s*['"](?:node:)?process['"]/g;
  let m;
  while ((m = re.exec(content))) aliases.add(m[1] || 'env');
  return [...aliases];
}

/**
 * Reasons a file's PATH/BASENAME alone makes it server-executing or
 * security/deploy config — no content needed.
 */
export function scanPath(rawPath) {
  const p = rawPath.split('\\').join('/');
  const base = p.split('/').pop() ?? p;
  const reasons = [];

  // A Next.js route handler anywhere under the App Router — the thing the old
  // `!apps/web/app/api/` deny could not express for routes outside /api/.
  if (p.startsWith('apps/web/app/') && /^route\.(ts|tsx|js|jsx|mjs|cjs)$/.test(base)) {
    reasons.push('Next.js App-Router route handler (executes server-side); route.* can live anywhere under app/, not only under /api/, so a path-prefix deny cannot catch it.');
  }
  // Deploy / security config — must stay human (item 4 of the fix). Also barred
  // by path, but named here so the guard is self-sufficient.
  if (/^(next\.config|middleware)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(base)) {
    reasons.push('Next.js deploy/security config (next.config.* / middleware.*) — security-relevant, human-only.');
  }
  if (p === 'apps/web/lib/security-headers.mjs' || p.startsWith('apps/web/lib/security-headers.')) {
    reasons.push('The CSP / security-headers module — security-relevant, human-only.');
  }
  return reasons;
}

/** Reasons a file's CONTENT makes it server-executing with secrets. */
export function scanContent(content) {
  const reasons = [];

  // A `"use server"` directive => the file (or a function in it) is a Server
  // Action: server-side code callable from the client. Matched as a standalone
  // directive line so the words inside a comment/string don't false-positive.
  if (/^\s*(['"])use server\1\s*;?\s*$/m.test(content)) {
    reasons.push('Contains a "use server" directive (a Server Action — server-side code).');
  }
  // Importing `server-only` is the framework's explicit "this must never reach
  // the client" marker.
  if (/(^|[\s;])import\s+(?:[^'";]*\sfrom\s+)?['"]server-only['"]/m.test(content) ||
      /require\(\s*['"]server-only['"]\s*\)/.test(content)) {
    reasons.push('Imports `server-only` (a server-only module by declaration).');
  }
  // Reads a secret env var — the crown-jewel risk (#1972: "a server route
  // reading secrets"). Explicit list first, then the generic secret shape.
  const names = envNamesRead(content);
  const secretsHit = names.filter(
    (n) => !PUBLIC_PREFIX.test(n) && (SECRET_ENV_VARS.includes(n) || SECRET_NAME_SHAPE.test(n)),
  );
  if (secretsHit.length) {
    reasons.push(`Reads secret env var(s): ${secretsHit.sort().join(', ')}.`);
  }

  // Destructuring from `process.env` directly (#3180) — flagged regardless of
  // which names are pulled out; see DESTRUCTURES_PROCESS_ENV above.
  if (DESTRUCTURES_PROCESS_ENV.test(content)) {
    reasons.push('Destructures from `process.env` (e.g. `const { ... } = process.env`) — not caught by this guard\'s exact-name matching, so flagged unconditionally.');
  }

  // `process.env` read via an imported alias (#3180) — e.g.
  // `import { env } from 'node:process'; env.SOME_TOKEN`, which contains no
  // literal `process.env` substring at all.
  for (const alias of processEnvImportAliases(content)) {
    const aliasDot = new RegExp(`\\b${alias}\\.([A-Za-z_][A-Za-z0-9_]*)`, 'g');
    const aliasBracket = new RegExp(`\\b${alias}\\[\\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\\s*\\]`, 'g');
    const aliasDestructure = new RegExp(`\\b(?:const|let|var)\\s*\\{[^}]*\\}\\s*=\\s*${alias}\\b`);
    const aliasNames = new Set();
    let am;
    while ((am = aliasDot.exec(content))) aliasNames.add(am[1]);
    while ((am = aliasBracket.exec(content))) aliasNames.add(am[1]);
    const aliasSecretsHit = [...aliasNames].filter(
      (n) => !PUBLIC_PREFIX.test(n) && (SECRET_ENV_VARS.includes(n) || SECRET_NAME_SHAPE.test(n)),
    );
    if (aliasSecretsHit.length) {
      reasons.push(`Reads secret env var(s) via aliased \`process.env\` import (\`${alias}\`): ${aliasSecretsHit.sort().join(', ')}.`);
    }
    if (aliasDestructure.test(content)) {
      reasons.push(`Destructures from an aliased \`process.env\` import (\`${alias}\`) — flagged unconditionally, same as a direct \`process.env\` destructure.`);
    }
  }

  return reasons;
}

/**
 * Full scan of one changed file. `content` may be omitted for a non-code file
 * (only the path is judged then). Returns the list of reasons it must not
 * auto-merge; empty means clear.
 */
export function scanFile({ path: p, content }) {
  const reasons = scanPath(p);
  if (content != null && isCodeFile(p)) reasons.push(...scanContent(content));
  return reasons;
}

/**
 * Scan many `{ path, content }` records. Returns only the offenders, each with
 * its reasons — the shape the workflow turns into a decline.
 */
export function scanFiles(files) {
  const out = [];
  for (const f of files) {
    const reasons = scanFile(f);
    if (reasons.length) out.push({ path: f.path, reasons });
  }
  return out;
}

async function run() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--manifest');
  if (i === -1 || !argv[i + 1]) {
    console.error('usage: automerge-content-guard.mjs --manifest <json-array-of-paths>');
    return 2;
  }
  let paths;
  try {
    const raw = await readFile(argv[i + 1], 'utf8');
    paths = JSON.parse(raw);
    if (!Array.isArray(paths) || paths.some((p) => typeof p !== 'string')) {
      throw new Error('manifest must be a JSON array of path strings');
    }
  } catch (err) {
    console.error(`automerge-content-guard: could not read manifest: ${err.message ?? err}`);
    return 2;
  }

  const files = [];
  for (const p of paths) {
    if (!isCodeFile(p)) {
      // Non-code file still gets a path-only judgement (e.g. a route.json is
      // not a thing, but keep the surface uniform); content is skipped.
      files.push({ path: p });
      continue;
    }
    try {
      files.push({ path: p, content: await readFile(p, 'utf8') });
    } catch (err) {
      console.error(`automerge-content-guard: could not read ${p}: ${err.message ?? err}`);
      return 2;
    }
  }

  const offenders = scanFiles(files);
  if (offenders.length) {
    console.error('automerge-content-guard: server-executing / secret-reading file(s) — NOT auto-mergeable:');
    for (const { path: p, reasons } of offenders) {
      console.error(`  • ${p}`);
      for (const r of reasons) console.error(`      - ${r}`);
    }
    return 1;
  }
  console.log(`automerge-content-guard: ${files.length} code file(s) scanned, none server-executing — clear.`);
  return 0;
}

// A genuinely unexpected throw (a bug in scanFiles, etc.) exits 2, the same
// "broken gate" code as a bad manifest/unreadable file — never the generic 1
// runMain would otherwise assign to an uncaught error.
async function main() {
  try {
    return await run();
  } catch (err) {
    console.error(err);
    return 2;
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'automerge-content-guard' });
}
