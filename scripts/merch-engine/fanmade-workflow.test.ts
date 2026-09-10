import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('fan-made discovery workflow', () => {
  it('installs workspace dependencies before importing the RSS-backed discovery script', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-fanmade.yml'), 'utf8');

    expect(workflow).toMatch(
      /actions\/setup-node@v7[\s\S]*?\n\s+- run: npm ci\n[\s\S]*?node scripts\/merch-engine\/fanmade-discovery\.mjs/,
    );
  });
});
