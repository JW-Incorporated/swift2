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
  it('catches the three real vault route handlers (currently allowlisted by path)', () => {
    for (const p of [
      'apps/web/app/vault/tier0/route.ts',
      'apps/web/app/vault/moment/[id]/route.ts',
      'apps/web/app/vault/album/[slug]/tracks/route.ts',
    ]) {
      expect(scanFile({ path: p, content: read(p) }).length, p).toBeGreaterThan(0);
    }
  });

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
      'apps/web/lib/longlive/format.ts',
      'apps/web/lib/longlive/eras.ts',
      'apps/web/lib/longlive/tracks.ts',
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
