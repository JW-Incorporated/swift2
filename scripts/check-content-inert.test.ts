import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkSource, listSeedFiles, ALLOWLIST, ROOT } from './check-content-inert.mjs';

// A seed file lives here; relative-import resolution is computed from this path.
const P = 'supabase/seed/tracks/example.mjs';

describe('checkSource — allows the real authoring pattern', () => {
  it('accepts a plain default-exported object literal', () => {
    expect(checkSource(P, `export default { eraSlug: '1989', tracks: [] };`)).toEqual([]);
  });

  it('accepts pure local factory helpers with template-literal URLs', () => {
    const code = `
      const ACCESSED = '2026-07-08';
      const wiki = (article, title) => ({
        source_url: \`https://en.wikipedia.org/wiki/\${article}\`,
        source_title: title, accessed_at: ACCESSED,
      });
      const ALBUM = wiki('1989_(album)', '1989');
      export default { eraSlug: '1989', tracks: [{ slug: 'wtny', sources: [ALBUM] }] };
    `;
    expect(checkSource(P, code)).toEqual([]);
  });

  it('accepts named exports (no default), e.g. eras-data.mjs', () => {
    const code = `export const eras = [{ slug: '1989' }];\nexport const milestones = [];`;
    expect(checkSource('supabase/seed/eras-data.mjs', code)).toEqual([]);
  });

  it('accepts a relative import of a sibling seed .mjs data module', () => {
    const code = `import DOSSIERS from './example.dossiers.mjs';\nexport default { tracks: DOSSIERS };`;
    expect(checkSource(P, code)).toEqual([]);
  });

  it('does not flag danger names used as property keys or property access', () => {
    // `process`/`fetch` here are data, not capabilities.
    const code = `export default { method: 'GET', config: { process: 'studio' }, verb: 'fetch' };`;
    expect(checkSource(P, code)).toEqual([]);
  });

  it('does not flag a danger name that is locally bound as a parameter', () => {
    const code = `const f = (fetch) => ({ v: fetch });\nexport default { items: [f('x')] };`;
    expect(checkSource(P, code)).toEqual([]);
  });
});

describe('checkSource — rejects real capabilities', () => {
  it('rejects a bare/external import', () => {
    expect(checkSource(P, `import fs from 'node:fs';\nexport default {};`).join()).toMatch(/imports `node:fs`/);
    expect(checkSource(P, `import _ from 'lodash';\nexport default {};`).join()).toMatch(/only relative imports/);
  });

  it('rejects a relative import that escapes supabase/seed', () => {
    const code = `import x from '../../../scripts/secret.mjs';\nexport default { x };`;
    expect(checkSource(P, code).join()).toMatch(/only relative imports of sibling seed/);
  });

  it('rejects a relative import that is not .mjs', () => {
    expect(checkSource(P, `import x from './evil.js';\nexport default { x };`).join()).toMatch(/imports `\.\/evil\.js`/);
  });

  it('rejects reading process/secrets', () => {
    expect(checkSource(P, `export default { t: process.env.GITHUB_TOKEN };`).join()).toMatch(/dangerous global `process`/);
  });

  it('rejects dynamic import() and require()', () => {
    expect(checkSource(P, `const cp = require('child_process');\nexport default {};`).join()).toMatch(/dangerous global `require`/);
    expect(checkSource(P, `export default (await import('node:fs'));`).join()).toMatch(/dynamic `import\(\.\.\.\)`|`await`/);
  });

  it('rejects network access', () => {
    expect(checkSource(P, `export default { data: fetch('http://evil.example') };`).join()).toMatch(/dangerous global `fetch`/);
  });

  it('rejects eval / Function constructor', () => {
    expect(checkSource(P, `export default { x: eval('1+1') };`).join()).toMatch(/dangerous global `eval`/);
    expect(checkSource(P, `const f = new Function('return 1');\nexport default { f };`).join()).toMatch(/dangerous global `Function`/);
  });

  it('rejects top-level await', () => {
    expect(checkSource(P, `const x = await Promise.resolve(1);\nexport default { x };`).join()).toMatch(/`await`/);
  });

  it('rejects globalThis/global back-doors', () => {
    expect(checkSource(P, `export default { p: globalThis.process };`).join()).toMatch(/dangerous global `globalThis`/);
  });
});

describe('the real corpus + allowlist', () => {
  it('every seed file on disk passes the check', () => {
    const offenders: string[] = [];
    for (const rel of listSeedFiles()) {
      const v = checkSource(rel, readFileSync(join(ROOT, rel), 'utf8'));
      if (v.length) offenders.push(`${rel}: ${v.join('; ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('the allowlist is empty today (kept as an exact escape hatch)', () => {
    expect(Object.keys(ALLOWLIST)).toEqual([]);
  });
});
