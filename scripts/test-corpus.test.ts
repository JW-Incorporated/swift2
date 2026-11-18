import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs CLI module, no type declarations
import { checkReport, discoverRoots, vitestArgs } from './test-corpus.mjs';

const root = mkdtempSync(join(tmpdir(), 'test-corpus-'));
function put(rel: string, text: string) {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

put('apps/web/lib/longlive/content-vault.generated.ts', 'export const X = 1;');
put('apps/web/lib/longlive/content.ts', "import { X } from './content-vault.generated';");
put('scripts/lib/loader.mjs', "readFileSync(join(ROOT, 'supabase', 'seed', 'tracks'));");
put('scripts/lib/mentions-only.mjs', '// reads nothing; see supabase/seed/README');
put('scripts/lib/reads-other.mjs', "readFileSync('package.json');");
put('scripts/seed-path.test.ts', "const p = 'supabase/seed/content/x.json';");
put('scripts/plain.test.ts', "expect(1).toBe(1);");
put('scripts/parity/fixture/web/content-vault.generated.ts', 'export const X = 0;');
put('apps/web/node_modules/pkg/a.generated.ts', '');

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('test-corpus zero-file guard', () => {
  it('never lets vitest pass with no tests', () => {
    expect(vitestArgs(['a.generated.ts'], [], 'r.json')).not.toContain('--passWithNoTests');
    expect(vitestArgs(['a.generated.ts'], [], 'r.json')).toContain('--outputFile.json=r.json');
  });

  it('fails a run that resolved zero test files, or left no report', () => {
    expect(checkReport({ testResults: [] })).toMatch(/zero test files/);
    expect(checkReport(null)).toMatch(/zero test files/);
    expect(checkReport({})).toMatch(/zero test files/);
  });

  it('accepts a run that executed at least one test file', () => {
    expect(checkReport({ testResults: [{ name: 'x.test.ts' }] })).toBeNull();
  });
});

describe('test-corpus discoverRoots', () => {
  const roots: string[] = discoverRoots(root);

  it('takes every generated content module as a root, except frozen fixtures and node_modules', () => {
    expect(roots).toContain('apps/web/lib/longlive/content-vault.generated.ts');
    expect(roots).not.toContain('scripts/parity/fixture/web/content-vault.generated.ts');
    expect(roots).not.toContain('apps/web/node_modules/pkg/a.generated.ts');
  });

  it('takes a source module that reads the seed through fs, not one that only mentions it', () => {
    expect(roots).toContain('scripts/lib/loader.mjs');
    expect(roots).not.toContain('scripts/lib/mentions-only.mjs');
    expect(roots).not.toContain('scripts/lib/reads-other.mjs');
  });

  it('takes a test that names the seed path itself, and leaves importers to vitest related', () => {
    expect(roots).toContain('scripts/seed-path.test.ts');
    expect(roots).not.toContain('scripts/plain.test.ts');
    expect(roots).not.toContain('apps/web/lib/longlive/content.ts');
  });
});
