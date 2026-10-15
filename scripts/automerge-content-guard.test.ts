import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isCodeFile,
  scanContent,
  scanPath,
  scanFile,
  scanFiles,
  SECRET_ENV_VARS,
} from './automerge-content-guard.mjs';
import { ROOT } from './lib/generated-content.mjs';

const read = (rel: string) => readFileSync(join(ROOT, ...rel.split('/')), 'utf8');

describe('isCodeFile', () => {
  it('matches TS/JS variants and nothing else', () => {
    for (const p of ['a.ts', 'a.tsx', 'a.js', 'a.jsx', 'a.mjs', 'a.cjs']) {
      expect(isCodeFile(p), p).toBe(true);
    }
    for (const p of ['a.json', 'a.md', 'a.png', 'seed/x.sql']) {
      expect(isCodeFile(p), p).toBe(false);
    }
  });
});

describe('scanPath — route handlers anywhere under app/', () => {
  it('flags a route handler OUTSIDE /api/ (the #1972 hole)', () => {
    for (const p of [
      'apps/web/app/vault/tier0/route.ts',
      'apps/web/app/vault/moment/[id]/route.ts',
      'apps/web/app/vault/album/[slug]/tracks/route.ts',
      'apps/web/app/x/route.tsx',
      'apps/web/app/deep/nested/route.js',
    ]) {
      expect(scanPath(p).some((r) => r.includes('route handler')), p).toBe(true);
    }
  });

  it('flags route handlers under /api/ too', () => {
    expect(scanPath('apps/web/app/api/feedback/route.ts').length).toBeGreaterThan(0);
  });

  it('does NOT flag a page/layout/component by name alone', () => {
    for (const p of [
      'apps/web/app/vault/page.tsx',
      'apps/web/app/layout.tsx',
      'apps/web/components/longlive/Foo.tsx',
      'apps/web/lib/longlive/format.ts',
    ]) {
      expect(scanPath(p), p).toEqual([]);
    }
  });

  it('does NOT flag a file merely named route.ts OUTSIDE app/', () => {
    // The guard only claims App-Router semantics under apps/web/app/.
    expect(scanPath('packages/core/src/route.ts')).toEqual([]);
  });

  it('flags next.config.* / middleware.* and the security-headers module', () => {
    expect(scanPath('apps/web/next.config.mjs').length).toBeGreaterThan(0);
    expect(scanPath('apps/web/middleware.ts').length).toBeGreaterThan(0);
    expect(scanPath('apps/web/lib/security-headers.mjs').length).toBeGreaterThan(0);
  });
});

describe('scanContent — server execution markers', () => {
  it('flags a "use server" directive (Server Action)', () => {
    expect(scanContent('"use server";\nexport async function save() {}').length).toBeGreaterThan(0);
    expect(scanContent("'use server'\nexport async function save() {}").length).toBeGreaterThan(0);
  });

  it('does NOT flag "use server" appearing in a comment or string', () => {
    expect(scanContent('// remember to use server components here\nexport const x = 1;')).toEqual([]);
    expect(scanContent('const doc = "you can use server actions";')).toEqual([]);
  });

  it('flags a server-only import', () => {
    expect(scanContent("import 'server-only';\nexport const x = 1;").length).toBeGreaterThan(0);
    expect(scanContent("import foo from 'server-only';").length).toBeGreaterThan(0);
    expect(scanContent("require('server-only');").length).toBeGreaterThan(0);
  });

  it('flags reading a known secret env var (dot and bracket forms)', () => {
    expect(scanContent('const k = process.env.ANTHROPIC_API_KEY;').length).toBeGreaterThan(0);
    expect(scanContent("const k = process.env['SUPABASE_SERVICE_ROLE_KEY'];").length).toBeGreaterThan(0);
    expect(scanContent('const k = process.env.GITHUB_FEEDBACK_TOKEN;').length).toBeGreaterThan(0);
  });

  it('flags a secret-SHAPED env var the explicit list has not caught up with', () => {
    expect(scanContent('const k = process.env.SOME_NEW_API_KEY;').length).toBeGreaterThan(0);
    expect(scanContent('const k = process.env.MY_SERVICE_ROLE;').length).toBeGreaterThan(0);
  });

  it('does NOT flag framework-public or non-secret env reads', () => {
    // These are exactly what a client-safe / view file legitimately reads.
    expect(scanContent('const u = process.env.NEXT_PUBLIC_SUPABASE_URL;')).toEqual([]);
    expect(scanContent('const u = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;')).toEqual([]);
    expect(scanContent('const u = process.env.EXPO_PUBLIC_SUPABASE_URL;')).toEqual([]);
    expect(scanContent('if (process.env.NODE_ENV !== "production") {}')).toEqual([]);
    expect(scanContent('const b = process.env.VAULT_FALLBACK_BASE_URL;')).toEqual([]);
  });

  it('every explicit secret name is actually detected', () => {
    for (const name of SECRET_ENV_VARS) {
      expect(scanContent(`const k = process.env.${name};`).length, name).toBeGreaterThan(0);
    }
  });
});

describe('scanContent — destructured process.env reads (#3180)', () => {
  it('flags a destructure of a secret-shaped name', () => {
    expect(scanContent('const { ANTHROPIC_API_KEY } = process.env;').length).toBeGreaterThan(0);
  });

  it('flags a destructure UNCONDITIONALLY, even a non-secret-shaped name', () => {
    // Per #3180: naming a variable in a way that doesn't look like a secret
    // is still suspicious via this path, so it is flagged regardless.
    expect(scanContent('const { NODE_ENV } = process.env;').length).toBeGreaterThan(0);
  });

  it('flags let/var destructures too, and across multiple lines', () => {
    expect(scanContent('let { FOO } = process.env;').length).toBeGreaterThan(0);
    expect(scanContent('var { FOO } = process.env;').length).toBeGreaterThan(0);
    expect(scanContent('const {\n  FOO,\n  BAR,\n} = process.env;').length).toBeGreaterThan(0);
  });

  it('does NOT flag an unrelated destructure', () => {
    expect(scanContent('const { a, b } = someOtherObject;')).toEqual([]);
  });
});

describe('scanContent — process.env read via an import alias (#3180)', () => {
  it('flags a secret-shaped name read through an aliased `env` import', () => {
    const content = "import { env } from 'node:process';\nconst k = env.ANTHROPIC_API_KEY;";
    expect(scanContent(content).length).toBeGreaterThan(0);
  });

  it('flags a secret-shaped name read through a renamed alias', () => {
    const content = "import { env as nodeEnv } from 'node:process';\nconst k = nodeEnv.SUPABASE_SERVICE_ROLE_KEY;";
    expect(scanContent(content).length).toBeGreaterThan(0);
  });

  it('flags a bracket-form read through the alias', () => {
    const content = "import { env } from 'process';\nconst k = env['X_API_KEY'];";
    expect(scanContent(content).length).toBeGreaterThan(0);
  });

  it('flags a destructure off the aliased import, unconditionally', () => {
    const content = "import { env } from 'node:process';\nconst { NODE_ENV } = env;";
    expect(scanContent(content).length).toBeGreaterThan(0);
  });

  it('does NOT flag the import alone, or a non-secret member read off it', () => {
    expect(scanContent("import { env } from 'node:process';")).toEqual([]);
    expect(scanContent("import { env } from 'node:process';\nconst u = env.NEXT_PUBLIC_SUPABASE_URL;")).toEqual([]);
  });

  it('does NOT flag an unrelated `env` identifier that was never imported from process', () => {
    expect(scanContent('const env = getSomeConfig();\nconst k = env.ANTHROPIC_API_KEY;')).toEqual([]);
  });
});

describe('scanFile / scanFiles', () => {
  it('a pure view component and a client-safe lib module are clear', () => {
    expect(scanFile({ path: 'apps/web/components/longlive/Foo.tsx', content: 'export const Foo = () => null;' })).toEqual([]);
    expect(scanFile({ path: 'apps/web/lib/longlive/format.ts', content: 'export const fmt = (n: number) => `${n}`;' })).toEqual([]);
  });

  it('returns only offenders, each with reasons', () => {
    const offenders = scanFiles([
      { path: 'apps/web/components/longlive/Foo.tsx', content: 'export const Foo = () => null;' },
      { path: 'apps/web/app/vault/tier0/route.ts', content: 'export function GET() {}' },
      { path: 'apps/web/lib/longlive/mood-client.ts', content: 'const k = process.env.ANTHROPIC_API_KEY;' },
    ]);
    expect(offenders.map((o) => o.path).sort()).toEqual([
      'apps/web/app/vault/tier0/route.ts',
      'apps/web/lib/longlive/mood-client.ts',
    ]);
    expect(offenders.every((o) => o.reasons.length > 0)).toBe(true);
  });
});

// ── the real tree: the exact files #1972 named must be caught, and the
//    founder's intended view/component auto-merge must NOT regress ──────────
describe('against the committed tree', () => {
  // The three legacy Supabase Vault route handlers this test used to assert
  // against (`apps/web/app/vault/{tier0,moment,album/[slug]/tracks}/route.ts`)
  // were deleted by OS-014b-6 (`docs/proposals/2026-09-vault-read-path.md`
  // Option A closeout) — every surface now reads from the published content
  // bundle and the whole Supabase read path is gone. Nothing in the
  // committed tree needs this specific regression case anymore; the guard's
  // general server-secret-scanning behavior is still covered by the other
  // cases below and the synthetic cases above.

  it('catches mood-client.ts reading ANTHROPIC_API_KEY inside the display subtree', () => {
    const p = 'apps/web/lib/longlive/mood-client.ts';
    expect(scanFile({ path: p, content: read(p) }).length).toBeGreaterThan(0);
  });

  it('catches the security-headers module and next.config', () => {
    expect(scanFile({ path: 'apps/web/lib/security-headers.mjs', content: read('apps/web/lib/security-headers.mjs') }).length).toBeGreaterThan(0);
    expect(scanFile({ path: 'apps/web/next.config.mjs', content: read('apps/web/next.config.mjs') }).length).toBeGreaterThan(0);
  });

  it('does NOT flag real client-safe display modules (no over-tightening)', () => {
    for (const p of [
      'packages/experience/src/format.ts',
      'packages/experience/src/eras.ts',
      'packages/experience/src/track-guide.ts',
    ]) {
      expect(scanFile({ path: p, content: read(p) }), p).toEqual([]);
    }
  });
});

// ── the workflow must keep invoking the guard (a security control must not be
//    silently droppable) ────────────────────────────────────────────────────
describe('the auto-merge workflow wires the guard', () => {
  it('references scripts/automerge-content-guard.mjs', () => {
    const wf = read('.github/workflows/auto-merge-content.yml');
    expect(wf).toContain('automerge-content-guard.mjs');
  });
});
