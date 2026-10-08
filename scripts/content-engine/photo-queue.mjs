#!/usr/bin/env node
// Photo-enrichment worker helper (GitHub issue #762). Deterministic marker +
// queue tooling so no run re-implements progress parsing by hand (CLAUDE.md
// rule 8). The marker is a comma-SAFE JSON array — see lib/photo-marker.mjs for
// the why. This CLI never touches GitHub or the network; the worker pipes it
// comment text on stdin and posts whatever it prints.
//
// Usage:
//   # One-time / occasional: rebuild the persisted marker from the full comment
//   # history (recovers whole comma-keys, drops shredded fragments and
//   # already-done pages). Pipe in the raw #762 comments (JSON or plain text).
//   gh issue view 762 --comments | node scripts/content-engine/photo-queue.mjs migrate
//
//   # Every run: given the newest marker body, print the top-N work queue.
//   node scripts/content-engine/photo-queue.mjs queue 10 --marker path/to/marker.txt
//   echo '<!-- photo-done: [...] -->' | node scripts/content-engine/photo-queue.mjs queue 10
import { readFile } from 'node:fs/promises';
import { loadCorpus } from './lib/corpus.mjs';
import { visibilityScore } from './lib/visibility.mjs';
import {
  recoverKeysFromComments,
  parseMarkerBody,
  reviewedSparseKeys,
  serializeMarker,
  buildQueue,
  isPhotoDone,
  MARKER_RE,
} from './lib/photo-marker.mjs';

const readStdin = async () => {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
};

async function inputText(args) {
  const fileFlag = args.indexOf('--marker');
  if (fileFlag !== -1 && args[fileFlag + 1]) return readFile(args[fileFlag + 1], 'utf8');
  if (!process.stdin.isTTY) return readStdin();
  return '';
}

/** Pull the newest marker body from a blob (highest-index marker wins). */
function newestMarkerBody(text) {
  let last = null;
  for (const m of String(text).matchAll(MARKER_RE)) last = m[1];
  return last;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const items = await loadCorpus();
  const moments = items.filter((it) => it.type === 'moment');
  const corpusKeys = moments.map((it) => it.key);

  if (cmd === 'migrate') {
    const text = await inputText(rest);
    if (!text.trim()) {
      console.error('migrate: pipe the #762 comments in on stdin (or pass --marker <file>).');
      process.exit(1);
    }
    const recovered = recoverKeysFromComments(text, corpusKeys);
    const keep = reviewedSparseKeys(items, recovered).sort();
    const objectivelyDone = moments.filter(isPhotoDone).length;
    console.error(
      `migrate: recovered ${recovered.length} recorded keys → kept ${keep.length} reviewed-sparse ` +
        `(dropped ${recovered.length - keep.length} that are objectively done or stale). ` +
        `${objectivelyDone}/${moments.length} moments are objectively done and are now recomputed live.`,
    );
    console.log(serializeMarker(keep));
    return;
  }

  if (cmd === 'queue') {
    const nArg = rest.find((a) => /^\d+$/.test(a));
    const n = nArg === undefined ? 10 : Number(nArg);
    const text = await inputText(rest);
    const reviewed = parseMarkerBody(newestMarkerBody(text) ?? '', corpusKeys);
    const q = buildQueue(items, reviewed, visibilityScore, n);
    console.error(`queue: ${q.length} page(s), reviewed-sparse marker holds ${reviewed.length} key(s).`);
    console.log(JSON.stringify(q, null, 2));
    return;
  }

  console.error('usage: photo-queue.mjs <migrate|queue [n]> [--marker <file>]');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
