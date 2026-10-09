import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const frozen = join(repo, 'scripts/parity/fixture/content/frozen');
const PERSONAS = ['theo', 'loren', 'vera', 'deb'];

describe('parity frozen fixture carries persona authors (#5391)', () => {
  const manifest = JSON.parse(readFileSync(join(frozen, 'manifest.json'), 'utf-8'));
  const eraFiles = Object.entries<{ path: string }>(manifest.files).filter(([name]) =>
    name.startsWith('content:'),
  );

  it('gives every frozen bundle item a persona author so bylines render', () => {
    expect(eraFiles.length).toBeGreaterThan(0);
    for (const [, entry] of eraFiles) {
      const { items } = JSON.parse(readFileSync(join(frozen, entry.path), 'utf-8'));
      for (const item of items) expect(PERSONAS, item.id).toContain(item.author);
    }
  });

  it('bakes the same author into every frozen content-vault item', () => {
    const baked = readFileSync(
      join(repo, 'scripts/parity/fixture/web/content-vault.generated.ts'),
      'utf-8',
    );
    const items = [...baked.matchAll(/^ {6}id: "/gm)].length;
    const authors = [...baked.matchAll(/^ {6}author: "(theo|loren|vera|deb)",$/gm)].length;
    expect(authors).toBe(items);
  });
});
