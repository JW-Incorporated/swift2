#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';

export function preserveGeneratedAt(previous, current) {
  const { generatedAt: previousGeneratedAt, ...previousData } = previous;
  const { generatedAt: currentGeneratedAt, ...currentData } = current;
  return previousGeneratedAt && isDeepStrictEqual(previousData, currentData)
    ? { ...current, generatedAt: previousGeneratedAt }
    : { ...current, generatedAt: currentGeneratedAt };
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith('--')) {
    throw new Error(`${name} requires a path`);
  }
  return resolve(args[index + 1]);
}

async function main() {
  const args = process.argv.slice(2);
  const previousPath = option(args, '--previous');
  const currentPath = option(args, '--current');
  const previous = JSON.parse(await readFile(previousPath, 'utf8'));
  const current = JSON.parse(await readFile(currentPath, 'utf8'));
  const stabilized = preserveGeneratedAt(previous, current);
  await writeFile(currentPath, `${JSON.stringify(stabilized, null, 2)}\n`, 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'merch-revenue-generated-at' });
}
