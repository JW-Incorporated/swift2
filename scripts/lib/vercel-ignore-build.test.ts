import { describe, expect, it } from 'vitest';
import { INERT_PREFIXES, decide, isInertPath } from './vercel-ignore-build.mjs';
import { resolveBase } from '../vercel-ignore-build.mjs';

// Every test names the MUTATION it catches. The rule is a deny-list that
// fails open, so most of these assert that something still BUILDS — a bug
// that skips a build nobody needed costs a few cents; a bug that skips a
// build that mattered is a silent production 404 nobody sees until a user
// hits it.

describe('fails open (the cases that must never skip)', () => {
  it('always builds production — MUTATION: drop the VERCEL_ENV==="production" guard', () => {
    const v = decide({ vercelEnv: 'production', files: ['docs/only.md'] });
    expect(v.build).toBe(true);
    expect(v.reason).toMatch(/production/);
  });

  it('builds when the diff is empty — MUTATION: read "no files changed" as "nothing to deploy"', () => {
    expect(decide({ vercelEnv: 'preview', files: [] }).build).toBe(true);
  });

  it('builds when there is no file list at all — MUTATION: default `files` to []', () => {
    expect(decide({ vercelEnv: 'preview', files: null }).build).toBe(true);
    expect(decide({ vercelEnv: 'preview' }).build).toBe(true);
    expect(decide().build).toBe(true);
  });

  it('builds when git failed — MUTATION: swallow a git error and carry on with an empty diff', () => {
    const errors = ['not a git checkout', 'no resolvable base commit (shallow clone?)', 'git diff failed'];
    for (const diffError of errors) {
      const v = decide({ vercelEnv: 'preview', files: ['docs/a.md'], diffError });
      expect(v.build).toBe(true);
      expect(v.reason).toMatch(/failing open/);
    }
  });

  it('builds when the file list is only whitespace — MUTATION: trim to empty, then skip', () => {
    expect(decide({ vercelEnv: 'preview', files: ['', '   '] }).build).toBe(true);
  });

  it('builds when ONE live path rides along with inert ones — MUTATION: .some() instead of .every()', () => {
    const v = decide({
      vercelEnv: 'preview',
      files: ['docs/a.md', 'social/metrics/x.json', 'apps/web/app/page.tsx'],
    });
    expect(v.build).toBe(true);
    expect(v.reason).toContain('apps/web/app/page.tsx');
  });

  it('builds anything unrecognised — MUTATION: turn the deny-list into an allow-list', () => {
    for (const f of ['newthing/x.ts', 'infra/terraform.tf', 'unknown', 'vercel.json']) {
      expect(decide({ vercelEnv: 'preview', files: [f] }).build).toBe(true);
    }
  });

  it('builds every real input of the prebuild chain — MUTATION: add a build input to INERT_PREFIXES', () => {
    const buildInputs = [
      'supabase/seed/content/2026-09.mjs',
      'supabase/seed/merch/official.mjs',
      'packages/shared/src/source-tiers.ts',
      'packages/content/src/cache.ts',
      'scripts/sync-longlive-content.mjs',
      'scripts/lib/longlive-sync-shared.mjs',
      'apps/web/app/api/mood/route.ts',
      'apps/web/public/content/current.json',
      'package.json',
      'package-lock.json',
      'apps/worker/src/index.ts',
    ];
    for (const f of buildInputs) {
      expect(isInertPath(f), `${f} must never be treated as inert`).toBe(false);
      expect(decide({ vercelEnv: 'preview', files: [f] }).build).toBe(true);
    }
  });

  it('respects the / boundary — MUTATION: startsWith("docs") without the slash', () => {
    for (const f of ['docsite/index.md', 'social-engine/run.ts', 'apps/mobile-web/App.tsx', 'e2etools/x.ts']) {
      expect(isInertPath(f), `${f} must not match a prefix`).toBe(false);
    }
  });

  it('only treats ROOT markdown as inert — MUTATION: match *.md at any depth', () => {
    expect(isInertPath('README.md')).toBe(true);
    expect(isInertPath('apps/web/README.md')).toBe(false);
    expect(isInertPath('packages/core/NOTES.md')).toBe(false);
  });

  it('never trusts an absolute or traversing path — MUTATION: normalise away ../ before matching', () => {
    for (const f of ['/docs/a.md', '../docs/a.md', 'docs/../apps/web/page.tsx']) {
      expect(isInertPath(f)).toBe(false);
    }
  });

  it('rejects non-strings rather than throwing — MUTATION: assume every entry is a string', () => {
    expect(isInertPath(undefined as unknown as string)).toBe(false);
    expect(isInertPath(42 as unknown as string)).toBe(false);
    expect(decide({ vercelEnv: 'preview', files: [null as unknown as string, 'docs/a.md'] }).build).toBe(true);
  });
});

describe('the saving (the only cases that skip)', () => {
  it('skips a docs-only commit — the news-digest branch, 48 of 240 measured builds', () => {
    expect(decide({ vercelEnv: 'preview', files: ['docs/content-ops/news-candidates.md'] }).build).toBe(false);
  });

  it('skips a social-ledger commit — 16 of 240 measured builds', () => {
    expect(decide({ vercelEnv: 'preview', files: ['social/feedback/2026-W38.jsonl'] }).build).toBe(false);
    expect(decide({ vercelEnv: 'preview', files: ['social/metrics/2026-09-16.json'] }).build).toBe(false);
  });

  it('skips a mobile-only commit — the web deployment cannot change', () => {
    expect(decide({ vercelEnv: 'preview', files: ['apps/mobile/App.tsx', 'apps/mobile/app.json'] }).build).toBe(false);
  });

  it('skips a mixed bag of inert paths', () => {
    const v = decide({
      vercelEnv: 'preview',
      files: ['docs/a.md', 'social/queue/b.json', '.github/workflows/c.yml', 'STATE.md', 'e2e/d.spec.ts'],
    });
    expect(v.build).toBe(false);
  });

  it('normalises Windows separators — MUTATION: match on the raw string', () => {
    expect(isInertPath('docs\\content-ops\\news.md')).toBe(true);
  });
});

describe('INERT_PREFIXES itself', () => {
  it('never overlaps a build input root — MUTATION: add supabase/, packages/, scripts/ or apps/web/', () => {
    const buildRoots = ['supabase/', 'packages/', 'scripts/', 'apps/web/', 'apps/worker/', 'data/'];
    for (const prefix of INERT_PREFIXES) {
      for (const root of buildRoots) {
        expect(prefix.startsWith(root), `${prefix} overlaps build input ${root}`).toBe(false);
        expect(root.startsWith(prefix), `build input ${root} is covered by ${prefix}`).toBe(false);
      }
    }
  });

  it('every entry ends in a slash so prefix matching stays on a boundary', () => {
    for (const prefix of INERT_PREFIXES) expect(prefix.endsWith('/')).toBe(true);
  });
});

describe('resolveBase', () => {
  const ok = () => '';
  const fail = () => null;

  it('uses VERCEL_GIT_PREVIOUS_SHA when it resolves', () => {
    expect(resolveBase({ VERCEL_GIT_PREVIOUS_SHA: 'abc123' }, ok)).toBe('abc123');
  });

  it('falls back to HEAD^ when the previous sha is unknown to this clone — MUTATION: trust the env blindly', () => {
    const run = (args: string[]) => (args[0] === 'cat-file' ? null : '');
    expect(resolveBase({ VERCEL_GIT_PREVIOUS_SHA: 'deadbeef' }, run)).toBe('HEAD^');
  });

  it('falls back to HEAD^ when the env var is absent or blank', () => {
    expect(resolveBase({}, ok)).toBe('HEAD^');
    expect(resolveBase({ VERCEL_GIT_PREVIOUS_SHA: '   ' }, ok)).toBe('HEAD^');
  });

  it('returns null on a shallow clone with no parent — MUTATION: return "HEAD^" unconditionally', () => {
    expect(resolveBase({}, fail)).toBe(null);
  });
});
