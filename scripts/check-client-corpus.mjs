// Client-chunk corpus sentinel (#4918): fail CI if legal-policy text leaks
// into the browser bundle (a client module importing legal.ts). Sentinels are
// taken from LEGAL_DOCS at run time, never hardcoded. Runs AFTER the web
// build (same job as `check:budget:bundle`), scanning .next/static/chunks.
//
//   npm run check:client-corpus
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from './lib/cli.mjs';
import { LEGAL_DOCS } from '../packages/ui/src/reader/legal/lib/legal';

const here = dirname(fileURLToPath(import.meta.url));
const chunksDir = join(here, '..', 'apps', 'web', '.next', 'static', 'chunks');

const SENTINEL_LEN = 70;
// Plain ASCII only, so minification/JSON escaping cannot alter the literal.
const SAFE = /^[A-Za-z0-9 ,.'-]+$/;

/** Up to `count` distinctive sentences: the longest safe paragraphs, alternating docs. */
export function pickSentinels(docs, count = 3) {
  const perDoc = docs.map((doc) =>
    doc.sections
      .flatMap((s) => s.blocks)
      .filter((b) => b.kind === 'p')
      .map((b) => b.text.slice(0, SENTINEL_LEN))
      .filter((t) => t.length === SENTINEL_LEN && SAFE.test(t))
      .sort((a, b) => b.length - a.length),
  );
  const out = [];
  for (let i = 0; out.length < count; i++) {
    const before = out.length;
    for (const list of perDoc) if (list[i] && out.length < count) out.push(list[i]);
    if (out.length === before) break;
  }
  return out;
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.js')) yield p;
  }
}

function main() {
  const sentinels = pickSentinels(LEGAL_DOCS);
  if (sentinels.length < 2) throw new Error('could not derive sentinels from LEGAL_DOCS');
  let files;
  try {
    files = [...walk(chunksDir)];
  } catch {
    throw new Error(`no build output at ${chunksDir} - run the web build first`);
  }
  if (files.length === 0) throw new Error(`no chunks under ${chunksDir}`);
  const hits = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const s of sentinels) if (text.includes(s)) hits.push(`${f}: "${s}"`);
  }
  if (hits.length > 0) {
    console.error('Legal corpus leaked into client chunks (a client module imports legal.ts):');
    for (const h of hits) console.error(`  ${h}`);
    return 1;
  }
  console.log(`client corpus clean: ${sentinels.length} sentinels, ${files.length} chunks`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMain(main, { name: 'check-client-corpus' });
}
