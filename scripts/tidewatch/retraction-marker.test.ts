import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SKIP_DIRS = new Set(['.git', '.next', '.scratch', 'coverage', 'dist', 'node_modules']);
const SOURCE_EXTENSIONS = new Set(['.cjs', '.js', '.mjs', '.sql', '.ts', '.tsx']);
const RETRACT = 'scripts/tidewatch/retract.mjs';
const MIGRATION = 'supabase/migrations/20261015050000_current_item_retracted_at.sql';

async function sourceFiles(directory = ROOT): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(absolute));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

describe('retraction marker write ownership', () => {
  it('allows only the retraction command to write the marker', async () => {
    const marker = ['retracted', 'at'].join('_');
    const callNames = ['update', 'insert', 'upsert'].join('|');
    const writePatterns = [
      new RegExp(String.raw`\.(?:${callNames})\s*\(\s*\{[\s\S]{0,500}?\b${marker}\s*:`, 'i'),
      new RegExp(String.raw`\b${marker}\s*=`, 'i'),
      new RegExp(String.raw`\bupdate\s+[\w".]+\s+set[\s\S]{0,500}?\b${marker}\b`, 'i'),
      new RegExp(String.raw`\binsert\s+into[\s\S]{0,500}?\b${marker}\b`, 'i'),
    ];
    const writers: string[] = [];
    const schemaOwners: string[] = [];

    for (const file of await sourceFiles()) {
      const source = await readFile(file, 'utf8');
      const relative = path.relative(ROOT, file).split(path.sep).join('/');
      if (writePatterns.some((pattern) => pattern.test(source))) writers.push(relative);
      if (path.extname(file) === '.sql' && new RegExp(`add column if not exists ${marker} timestamptz`, 'i').test(source)) {
        schemaOwners.push(relative);
      }
    }

    expect(writers).toEqual([RETRACT]);
    expect(schemaOwners).toEqual([MIGRATION]);
  });
});
