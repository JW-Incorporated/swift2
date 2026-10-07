import { describe, expect, it } from 'vitest';
import { checkWorkflow, scanImports, scriptsRunBy } from './check-workflow-deps.mjs';

const FILES: Record<string, string> = {
  'scripts/needs-pkg.mjs': `import { createClient } from '@supabase/supabase-js';\n`,
  'scripts/builtin-only.mjs': `import { readFileSync } from 'node:fs';\nimport { helper } from './lib/helper.mjs';\nimport path from 'path';\n`,
  'scripts/lib/helper.mjs': `import { x } from 'node:os';\nexport const helper = 1;\n`,
  'scripts/via-helper.mjs': `import { helper } from './lib/pkg-helper.mjs';\n`,
  'scripts/lib/pkg-helper.mjs': `import yaml from 'yaml';\n`,
  'scripts/needs-gen.mjs': `const m = await import('../apps/web/lib/x.ts');\n`,
  'apps/web/lib/x.ts': `import { A } from './x.generated';\n`,
};
const read = (rel: string) => FILES[rel] ?? null;
const opts = { read, tracked: new Set(Object.keys(FILES)) };
const pkgScripts = { 'run-it': 'node scripts/needs-pkg.mjs' };

const job = (steps: unknown[]) => ({ jobs: { j: { steps } } });
const setup = (npmCi?: string) => ({
  uses: './.github/actions/setup-repo',
  ...(npmCi ? { with: { 'npm-ci': npmCi } } : {}),
});

describe('scriptsRunBy', () => {
  it('finds node, tsx, npx tsx and npm run scripts', () => {
    const run = 'node scripts/a.mjs --x\nnpx tsx --tsconfig t.json scripts/b.ts\nnpm run run-it';
    expect([...scriptsRunBy(run, pkgScripts)].sort()).toEqual([
      'scripts/a.mjs',
      'scripts/b.ts',
      'scripts/needs-pkg.mjs',
    ]);
  });
});

describe('scanImports', () => {
  it('reports bare packages and ignores node: builtins and relative files', () => {
    expect(scanImports('scripts/builtin-only.mjs', opts).packages).toEqual([]);
    expect(scanImports('scripts/needs-pkg.mjs', opts).packages).toEqual(['@supabase/supabase-js']);
  });
  it('follows relative imports transitively', () => {
    expect(scanImports('scripts/via-helper.mjs', opts).packages).toEqual(['yaml']);
  });
  it('flags missing gitignored generated modules', () => {
    expect(scanImports('scripts/needs-gen.mjs', opts).generated).toEqual(['apps/web/lib/x.generated']);
  });
});

describe('checkWorkflow', () => {
  it('flags a job that runs a package-importing script without installing', () => {
    const doc = job([setup(), { run: 'node scripts/needs-pkg.mjs' }]);
    const problems = checkWorkflow('w.yml', doc, pkgScripts, opts);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('w.yml:j');
  });
  it('passes when setup-repo installs deps', () => {
    const doc = job([setup('true'), { run: 'node scripts/needs-pkg.mjs' }]);
    expect(checkWorkflow('w.yml', doc, pkgScripts, opts)).toEqual([]);
  });
  it('passes when an explicit npm ci step installs deps', () => {
    const doc = job([{ run: 'npm ci --ignore-scripts' }, { run: 'npx tsx scripts/needs-pkg.mjs' }]);
    expect(checkWorkflow('w.yml', doc, pkgScripts, opts)).toEqual([]);
  });
  it('passes a builtin-only script with no install (fast path)', () => {
    const doc = job([setup(), { run: 'node scripts/builtin-only.mjs' }]);
    expect(checkWorkflow('w.yml', doc, pkgScripts, opts)).toEqual([]);
  });
  it('requires sync:content when generated modules are imported', () => {
    const noSync = job([setup('true'), { run: 'node scripts/needs-gen.mjs' }]);
    expect(checkWorkflow('w.yml', noSync, pkgScripts, opts)).toHaveLength(1);
    const withSync = job([setup('true'), { run: 'npm run sync:content' }, { run: 'node scripts/needs-gen.mjs' }]);
    expect(checkWorkflow('w.yml', withSync, pkgScripts, opts)).toEqual([]);
  });
});
