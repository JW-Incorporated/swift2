#!/usr/bin/env node
// Builds a writer-eval kit folder from the backfill's writer-eval-kit.jsonl
// (issue #6572): the exact writer system prompt, N items stratified across
// category and sourceTier (no Sonnet drafts), and the Sonnet drafts in a
// separate file for blind scoring.
//
// Usage:
//   npx tsx scripts/news/build-writer-eval-kit.mjs <writer-eval-kit.jsonl> [--n 60] [--out <dir>]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runMain } from '../lib/cli.mjs';

export function parseKit(text) {
  return text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

/** Round-robin across category x sourceTier strata (each stratum sorted by kitId) until n items are taken. */
export function stratify(rows, n) {
  const strata = new Map();
  for (const row of [...rows].sort((a, b) => (a.kitId < b.kitId ? -1 : a.kitId > b.kitId ? 1 : 0))) {
    const key = `${row.category}|${row.sourceTier}`;
    if (!strata.has(key)) strata.set(key, []);
    strata.get(key).push(row);
  }
  const queues = [...strata.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, q]) => q);
  const picked = [];
  while (picked.length < n && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (picked.length >= n) break;
      const next = q.shift();
      if (next) picked.push(next);
    }
  }
  return picked;
}

export function splitKit(picked) {
  const items = picked.map((row) => {
    const item = { ...row };
    delete item.sonnetDraft;
    return item;
  });
  const drafts = picked.filter((r) => r.sonnetDraft).map((r) => ({ kitId: r.kitId, ...r.sonnetDraft }));
  return { items, drafts };
}

export function readmeText(count, schema) {
  return [
    '# Writer eval kit',
    '',
    `${count} items, stratified across category and source tier.`,
    '',
    '## Contract',
    '',
    '- `system-prompt.txt` is the exact system message the production writer receives.',
    '- For each line in `items.jsonl`, send `userMessage` as the user message with that system prompt.',
    '- Reply with the `write_post` JSON object only: `{ "lead", "body", "citations": [{ "sentence", "ref" }] }`. No prose, no code fences.',
    '- `max_tokens` is 1200.',
    '- Cite only fact ids (f1, f2, ...) and context ids (c1, c2, ...) that appear in the item.',
    '- `sonnet-drafts.jsonl` holds the production model drafts keyed by `kitId`. Keep it away from the writer under test so scoring stays blind.',
    '',
    '## write_post schema',
    '',
    '```json',
    JSON.stringify(schema, null, 2),
    '```',
    '',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { input: undefined, n: 60, out: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--n') args.n = Number.parseInt(argv[++i], 10);
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (!args.input) args.input = argv[i];
  }
  return args;
}

async function main() {
  const { input, n, out } = parseArgs(process.argv.slice(2));
  if (!input || !(n > 0)) {
    console.error('usage: build-writer-eval-kit.mjs <writer-eval-kit.jsonl> [--n 60] [--out <dir>]');
    return 1;
  }
  const { WRITER_SYSTEM_MESSAGE } = await import('../../apps/worker/src/extract/writer-client.ts');
  const { WRITE_POST_TOOL } = await import('../../apps/worker/src/extract/writer-prompt.ts');
  const dir = resolve(out ?? join(process.cwd(), 'writer-eval-kit'));
  const { items, drafts } = splitKit(stratify(parseKit(readFileSync(input, 'utf8')), n));
  const lines = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'system-prompt.txt'), WRITER_SYSTEM_MESSAGE);
  writeFileSync(join(dir, 'items.jsonl'), lines(items));
  writeFileSync(join(dir, 'sonnet-drafts.jsonl'), lines(drafts));
  writeFileSync(join(dir, 'README.md'), readmeText(items.length, WRITE_POST_TOOL.input_schema));
  console.log(`build-writer-eval-kit: wrote ${items.length} item(s) to ${dir}`);
  return 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/news/build-writer-eval-kit.mjs')) {
  runMain(main, { name: 'build-writer-eval-kit' });
}
