// Tiny shared reader for the social/ state directories (posted/, queue/).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

/** Every parseable `*.json` in `dir` as `{ ref, data }`; a missing dir or one bad file never throws. */
export async function readJsonDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    try {
      out.push({ ref: `${path.basename(dir)}/${file}`, data: JSON.parse(await readFile(path.join(dir, file), 'utf8')) });
    } catch {
      /* one unreadable file never blinds the rest */
    }
  }
  return out;
}
