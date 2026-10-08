import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const promptDir = join(root, 'docs/agents/runner-prompts');
const files = [
  ...readdirSync(promptDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(promptDir, f)),
  join(root, 'docs/kevin.md'),
];

describe('Kevin prompts never post a literal @file body (#4653)', () => {
  it('finds the prompt files', () => {
    expect(files.length).toBeGreaterThan(2);
  });

  it.each(files)('%s uses a file-reading flag', (file) => {
    const text = readFileSync(file, 'utf8');
    expect(text).not.toContain('-f body=@');
    expect(text).not.toContain('--body "@');
  });
});
