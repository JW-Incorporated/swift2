import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkEntries, collectEntries, walkStatic } from './check-workflow-entries.mjs';

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

const root2 = mkdtempSync(join(tmpdir(), 'wf-entries-test2-'));
afterAll(() => rmSync(root2, { recursive: true, force: true }));
const FILES2: Record<string, string> = {
  '.github/workflows/w2.yml': [
    'name: w2',
    'on: workflow_dispatch',
    'jobs:',
    '  j:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - run: node scripts/args.mjs --ok',
    '      - run: node scripts/args-bad.mjs --bad',
    '      - run: node run.mjs',
    '        working-directory: sub',
    '      - run: node scripts/known-bad.mjs',
    '      - run: node scripts/known-good.mjs',
    '      - run: node scripts/other-bad.mjs',
    '',
  ].join('\n'),
  'scripts/args.mjs': `if (!process.argv.includes('--ok')) await import('./missing.mjs');\n`,
  'scripts/args-bad.mjs': `if (!process.argv.includes('--ok')) await import('./missing.mjs');\n`,
  'sub/run.mjs': `export const y = 1;\n`,
  'scripts/known-bad.mjs': `import './nope';\n`,
  'scripts/known-good.mjs': `export const z = 1;\n`,
  'scripts/other-bad.mjs': `import './nope';\n`,
  'scripts/typed.ts': [
    `import type { A } from './nope1';`,
    `import { type B, type C } from './nope2';`,
    `export type { D } from './nope3';`,
    `import { real } from './real.ts';`,
    '',
  ].join('\n'),
  'scripts/real.ts': `export const real = 1;\n`,
  'scripts/real-named.ts': `import { type B, value } from './nope2';\n`,
};
for (const [rel, body] of Object.entries(FILES2)) {
  mkdirSync(dirname(join(root2, rel)), { recursive: true });
  writeFileSync(join(root2, rel), body);
}

describe('workflow args and working-directory', () => {
  it('honors step working-directory and keeps distinct args per entry', () => {
    const { entries, invocations } = collectEntries(root2);
    expect(entries).toContain('sub/run.mjs');
    expect(invocations.find((i) => i.entry === 'scripts/args.mjs')?.args).toEqual(['--ok']);
  });

  it('spawns with the workflow args', async () => {
    const { results } = await checkEntries({ root: root2, knownFailures: {} });
    const by = Object.fromEntries(results.map((r) => [r.entry, r]));
    expect(by['scripts/args.mjs'].ok).toBe(true);
    expect(by['scripts/args-bad.mjs'].ok).toBe(false);
    expect(by['sub/run.mjs'].ok).toBe(true);
  }, 60000);
});

describe('walkStatic type-only imports', () => {
  it('skips import type, export type from and all-type inline imports', () => {
    expect(walkStatic(root2, 'scripts/typed.ts').problems).toEqual([]);
  });
  it('still flags an inline import with a value binding', () => {
    expect(walkStatic(root2, 'scripts/real-named.ts').problems).toHaveLength(1);
  });
});

describe('KNOWN_FAILURES', () => {
  const known = {
    'scripts/known-bad.mjs': { reason: 'test', issue: 1 },
    'scripts/known-good.mjs': { reason: 'test', issue: 2 },
  };
  it('tolerates known failures, flags now-passing, fails on others', async () => {
    const { results, failed } = await checkEntries({ root: root2, knownFailures: known });
    const by = Object.fromEntries(results.map((r) => [r.entry, r]));
    expect(by['scripts/known-bad.mjs'].known).toEqual(known['scripts/known-bad.mjs']);
    expect(by['scripts/known-good.mjs'].nowPasses).toEqual(known['scripts/known-good.mjs']);
    expect(failed.map((r) => r.entry)).toEqual(['scripts/args-bad.mjs', 'scripts/other-bad.mjs']);
  }, 60000);
});
