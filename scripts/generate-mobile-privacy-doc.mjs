#!/usr/bin/env node
// OS-042 — writes the GENERATED block in
// apps/mobile/docs/privacy-and-data-safety.md from the single data
// inventory (apps/web/lib/longlive/data-inventory.ts), so the store
// paste-ready answers can never hand-drift from that inventory the way the
// mobile doc and `/privacy` drifted from the shipped code before (#800,
// #3251).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatedMobilePrivacyBlock } from '../apps/web/lib/longlive/data-inventory.ts';
import { runMain } from './lib/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DOC_FILE = 'apps/mobile/docs/privacy-and-data-safety.md';

const START = '<!-- GENERATED:mobile-privacy-inventory:start';
const END = '<!-- GENERATED:mobile-privacy-inventory:end -->';

/** Re-indents a generated block's lines as markdown blockquote (`> `) lines, matching the surrounding doc. */
function quoteBlock(block) {
  return block
    .split('\n')
    .map((line) => (line.length ? `> ${line}` : '>'))
    .join('\n');
}

/** Replaces the GENERATED block in `doc` with fresh content built from the inventory. Exported so the check script and this generator share one implementation. */
export function withRegeneratedBlock(doc) {
  const startIdx = doc.indexOf(START);
  const endIdx = doc.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`${DOC_FILE} is missing the GENERATED markers — did the doc get hand-edited?`);
  }
  const marker = `${START} — produced by\n> \`npm run privacy:mobile-doc\` from \`apps/web/lib/longlive/data-inventory.ts\`\n> (OS-042). Do not hand-edit the lines below; edit the inventory and\n> regenerate. \`data-inventory.test.ts\` fails the build if this block drifts\n> from what the inventory would produce, or if the inventory ever disagrees\n> with the \`/privacy\` policy prose. -->`;
  const body = quoteBlock(generatedMobilePrivacyBlock());
  const replacement = `${marker}\n>\n${body}\n>\n> ${END}`;
  return doc.slice(0, startIdx) + replacement + doc.slice(endIdx + END.length);
}

function main() {
  const path = resolve(ROOT, DOC_FILE);
  const before = readFileSync(path, 'utf8');
  const after = withRegeneratedBlock(before);
  writeFileSync(path, after);
  console.log(after === before ? `✓ ${DOC_FILE} already in sync` : `✓ regenerated ${DOC_FILE}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'generate-mobile-privacy-doc' });
}
