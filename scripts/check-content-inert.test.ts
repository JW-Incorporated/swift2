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
        source_title: title, accessed_at: ACCESSED, reliability_score: 2,
      });
      const ALBUM = wiki('1989_(album)', '1989');
      export default { eraSlug: '1989', tracks: [{ slug: 'wtny', sources: [ALBUM, wiki('x', 'y')] }] };
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

  it('accepts ternaries, nullish/logical ops, and negative numbers as data', () => {
    const code = `const n = null;\nexport default { a: n ?? 0, b: -3, c: true && 'x', d: 1 > 0 ? 'y' : 'z' };`;
    expect(checkSource(P, code)).toEqual([]);
  });

  it('does not flag danger words used as property keys or string data', () => {
    const code = `export default { method: 'GET', config: { process: 'studio', constructor: 'writer' }, verb: 'fetch' };`;
    expect(checkSource(P, code)).toEqual([]);
  });
});

describe('checkSource — rejects the PR #507 red-team (prototype-escape) bypasses', () => {
  // Each of these PASSED the old deny-list check but is a real capability
  // escape; all MUST fail under the positive grammar.
  const mustFail = (label: string, src: string) =>
    it(`rejects: ${label}`, () => expect(checkSource(P, src).length).toBeGreaterThan(0));

  mustFail('({}).constructor.constructor at top level',
    "({}).constructor.constructor('return process.env')()");
  mustFail('[].constructor.constructor',
    "[].constructor.constructor('return globalThis')()");
  mustFail('getter that reaches Function',
    "export default { get d(){ return ({}).constructor.constructor('x')() } }");
  mustFail('toString method that reaches Function',
    "export default { toString(){ return ({}).constructor.constructor('return 1')() } }");
  mustFail('computed-key constructor chain',
    "const f = ({})['constructor']['constructor']; f('return process')()");
  mustFail('string-concat computed key (con+structor)',
    "const f = ({})['con'+'structor']; export default { f };");
});

describe('checkSource — rejects other capabilities', () => {
  it('rejects a bare/external import', () => {
    expect(checkSource(P, `import fs from 'node:fs';\nexport default {};`).join()).toMatch(/imports `node:fs`/);
    expect(checkSource(P, `import _ from 'lodash';\nexport default {};`).join()).toMatch(/only relative sibling seed/);
  });
  it('rejects a relative import that escapes supabase/seed', () => {
    expect(checkSource(P, `import x from '../../../scripts/secret.mjs';\nexport default { x };`).join())
      .toMatch(/only relative sibling seed/);
  });
  it('rejects reading process/secrets (free identifier)', () => {
    expect(checkSource(P, `export default { t: process };`).join()).toMatch(/free identifier `process`/);
  });
  it('rejects dynamic import(), require(), fetch(), eval() — non-local call targets', () => {
    expect(checkSource(P, `export default (await import('node:fs'));`).length).toBeGreaterThan(0);
    expect(checkSource(P, `const cp = require('child_process');\nexport default {};`).length).toBeGreaterThan(0);
    expect(checkSource(P, `export default { d: fetch('http://evil') };`).length).toBeGreaterThan(0);
    expect(checkSource(P, `export default { d: eval('1') };`).length).toBeGreaterThan(0);
  });
  it('rejects new expressions and tagged templates', () => {
    expect(checkSource(P, `export default { d: new Date() };`).length).toBeGreaterThan(0);
    expect(checkSource(P, `const t = (s) => s;\nexport default { d: t\`x\` };`).length).toBeGreaterThan(0);
  });
  it('rejects top-level await and non-const declarations', () => {
    expect(checkSource(P, `const x = await Promise.resolve(1);\nexport default { x };`).length).toBeGreaterThan(0);
    expect(checkSource(P, `let y = 1;\nexport default { y };`).join()).toMatch(/only `const`/);
  });
  it('rejects member access on a bound value (shape ban is wholesale)', () => {
    expect(checkSource(P, `const o = { a: 1 };\nexport default { v: o.a };`).length).toBeGreaterThan(0);
  });
});

describe('the real corpus + allowlist', () => {
  it('every non-allowlisted seed file on disk passes; allowlisted ones are exempt', () => {
    const offenders: string[] = [];
    for (const rel of listSeedFiles()) {
      const v = checkSource(rel, readFileSync(join(ROOT, rel), 'utf8'));
      if (v.length) offenders.push(`${rel}: ${v.join('; ')}`);
    }
    // checkSource returns [] for allowlisted files, so this asserts the entire
    // corpus is green (Joey's "everything passes" requirement).
    expect(offenders).toEqual([]);
  });

  it('the allowlist is exact — every entry points at a real file', () => {
    for (const rel of Object.keys(ALLOWLIST)) {
      expect(readFileSync(join(ROOT, rel), 'utf8').length).toBeGreaterThan(0);
    }
  });
});
