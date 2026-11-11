import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const FANMADE_SEED_PATH = 'supabase/seed/merch/fanmade.mjs';

function block(seed) {
  return JSON.stringify(seed, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

export async function appendFanmadeSeeds({
  seeds,
  path = FANMADE_SEED_PATH,
  readFileImpl = readFile,
  writeFileImpl = writeFile,
} = {}) {
  if (!Array.isArray(seeds) || seeds.length === 0) return { written: 0 };
  const target = resolve(path);
  const source = await readFileImpl(target, 'utf8');
  const marker = /\r?\n\];\r?\n\r?\nexport default FAN_MADE;\s*$/;
  if (!marker.test(source)) throw new Error('fan-made seed module footer was not found');
  const addition = seeds.map((seed) => `${block(seed)},`).join('\n');
  const updated = source.replace(marker, `\n${addition}\n\n];\n\nexport default FAN_MADE;\n`);
  await writeFileImpl(target, updated, 'utf8');
  return { written: seeds.length };
}
