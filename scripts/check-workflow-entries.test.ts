import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkEntries, collectEntries } from './check-workflow-entries.mjs';

const root = mkdtempSync(join(tmpdir(), 'wf-entries-test-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const FILES: Record<string, string> = {
  '.github/workflows/w.yml': [
    'name: w',
    'on: workflow_dispatch',
    'jobs:',
    '  j:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - run: node scripts/good.mjs',
    '      - run: node --no-warnings scripts/bad.mjs',
    '      - run: node scripts/sender.mjs',
    '      - run: node -e "console.log(1)"',
    '      - run: node scripts/${{ matrix.x }}.mjs',
    '      - run: npx tsx scripts/ignored.ts',
    '',
  ].join('\n'),
  'scripts/good.mjs': `import { helper } from './lib/helper.mjs';\nexport const x = helper;\n`,
  'scripts/lib/helper.mjs': `export const helper = 1;\n`,
  'scripts/bad.mjs': `import { helper } from './lib/helper';\nexport const x = helper;\n`,
  'scripts/sender.mjs': `await fetch('https://discord.com/api/webhooks/x', { method: 'POST' });\nthrow new Error('must never run');\n`,
};
for (const [rel, body] of Object.entries(FILES)) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}

describe('collectEntries', () => {
  it('finds node entries, skips -e/npx and lists ${{ }} paths', () => {
    const { entries, skipped } = collectEntries(root);
    expect(entries).toEqual(['scripts/bad.mjs', 'scripts/good.mjs', 'scripts/sender.mjs']);
    expect(skipped).toHaveLength(1);
  });
});

describe('checkEntries', () => {
  it('passes a loadable entry, fails an extensionless import, never spawns a static-only entry', async () => {
    const { results, failed } = await checkEntries({ root, timeoutMs: 20000, concurrency: 2 });
    const by = Object.fromEntries(results.map((r) => [r.entry, r]));
    expect(by['scripts/good.mjs']).toMatchObject({ mode: 'load', ok: true });
    expect(by['scripts/bad.mjs']).toMatchObject({ mode: 'load', ok: false });
    expect(by['scripts/sender.mjs']).toMatchObject({ mode: 'static', ok: true });
    expect(failed.map((r) => r.entry)).toEqual(['scripts/bad.mjs']);
  }, 60000);
});
