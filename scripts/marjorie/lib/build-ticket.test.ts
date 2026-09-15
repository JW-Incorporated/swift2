import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs module, no type declarations
import {
  AUSTIN_PATH_ALLOWLIST,
  checkBuildTicket,
  findExistingBuildTicket,
  isAustinAllowedPath,
  renderBuildTicket,
  sizeFromPaths,
} from './build-ticket.mjs';

const CLI = fileURLToPath(new URL('./build-ticket.mjs', import.meta.url));
const base = {
  expected: 'The timeline opens without a blank screen.',
  surface: 'web timeline',
  paths: ['apps/web/components/longlive/Timeline.tsx'],
  estimatedLines: 40,
  acceptanceCriteria: [
    'Opening the timeline renders its first card.',
    'A regression test covers the failure.',
  ],
  reporterSaid: 'The page is blank.',
  source: 'issue',
  sourceContext: '**From a site submission** — #123, filed 2026-09-14 by an anonymous visitor.',
};

describe('Austin allowlist and size', () => {
  it('keeps the allowlist as exported data and accepts in-fence source/test/docs paths', () => {
    expect(AUSTIN_PATH_ALLOWLIST).toEqual(['apps/web/', 'packages/', 'docs/']);
    expect(isAustinAllowedPath('apps/web/components/Card.tsx')).toBe(true);
    expect(isAustinAllowedPath('packages/shared/src/card.test.ts')).toBe(true);
    expect(isAustinAllowedPath('docs/runbook.md')).toBe(true);
  });

  it.each([
    'apps/web/app/api/feedback/route.ts',
    '.github/workflows/build.yml',
    'docs/agents/marjorie.md',
    'docs/specs/change.md',
    'docs/decisions.md',
    'package.json',
    'packages/shared/package.json',
    'apps/web/lib/auth.ts',
    'apps/web/lib/auth-client.ts',
    'apps/web/.env.local',
    'packages/core/src/schema.ts',
    'apps/web/components',
    'apps/web/app/vault/live-theories/route.ts',
    'apps/web/./app/api/feedback.ts',
    'apps/web//app/api/feedback.ts',
    '../outside.ts',
    'apps/web/**/*.tsx',
  ])('rejects an out-of-fence or vague path: %s', (candidate) => {
    expect(isAustinAllowedPath(candidate)).toBe(false);
  });

  it('certifies small only with <=5 allowed files and a positive <=150 line estimate', () => {
    expect(sizeFromPaths(['apps/web/a.ts'], 150)).toBe('small');
    expect(sizeFromPaths(['apps/web/a.ts'], undefined)).toBe('medium');
    expect(sizeFromPaths(['apps/web/a.ts'], 151)).toBe('medium');
    expect(sizeFromPaths(['scripts/a.mjs'], 20)).toBe('medium');
    expect(
      sizeFromPaths(
        [
          'apps/web/a.ts',
          'apps/web/b.ts',
          'apps/web/c.ts',
          'apps/web/d.ts',
          'apps/web/e.ts',
          'apps/web/f.ts',
        ],
        20,
      ),
    ).toBe('medium');
  });

  it('uses the explicit needsSpec signal for large instead of inventing a path-count threshold', () => {
    expect(sizeFromPaths(['apps/web/a.ts'], 20, { needsSpec: true })).toBe('large');
  });

  it('allows a concrete Next dynamic-page path while keeping route handlers outside the fence', () => {
    expect(isAustinAllowedPath('apps/web/app/era/[eraId]/page.tsx')).toBe(true);
    expect(isAustinAllowedPath('apps/web/app/era/[...slug]/page.tsx')).toBe(true);
    expect(isAustinAllowedPath('apps/web/app/era/[[...slug]]/page.tsx')).toBe(true);
    expect(isAustinAllowedPath('apps/web/components/[ab].tsx')).toBe(false);
    expect(isAustinAllowedPath('apps/web/components/ab].tsx')).toBe(false);
    expect(isAustinAllowedPath('apps/web/app/era/[slug]]/page.tsx')).toBe(false);
    expect(isAustinAllowedPath('apps/web/app/era/[[...slug]/page.tsx')).toBe(false);
    expect(isAustinAllowedPath('apps/web/app/era/[...slug]]/page.tsx')).toBe(false);
    expect(isAustinAllowedPath('apps/web/app/vault/current/[eraId]/route.ts')).toBe(false);
  });
});

describe('renderBuildTicket / checkBuildTicket', () => {
  it('renders the required blocks in order, computes size, and preserves the reconciliation backlink', () => {
    const body = renderBuildTicket(base);
    expect(checkBuildTicket(body)).toEqual({ ok: true, errors: [] });
    const tokens = [
      '**Expected**',
      '**Where**',
      '**Size**',
      '**Acceptance criteria**',
      '**Reporter said**',
      '<!-- marjorie-build: size=small source=issue -->',
      '**From a site submission** — #123',
    ];
    const positions = tokens.map((token) => body.indexOf(token));
    expect(
      positions.every((position, index) => index === 0 || position > positions[index - 1]),
    ).toBe(true);
  });

  it('quotes reporter words without turning leading mentions into pings', () => {
    const body = renderBuildTicket({ ...base, reporterSaid: '@owner\nplease look' });
    expect(body).toContain('> `@owner`\n> please look');
  });

  it('does not mistake marker-shaped reporter text for the helper marker', () => {
    const body = renderBuildTicket({
      ...base,
      reporterSaid: '<!-- marjorie-build: size=large source=issue -->',
    });
    expect(checkBuildTicket(body)).toEqual({ ok: true, errors: [] });
  });

  it('refuses missing Expected and missing Acceptance criteria', () => {
    expect(() => renderBuildTicket({ ...base, expected: '' })).toThrow('Expected is required');
    expect(() => renderBuildTicket({ ...base, acceptanceCriteria: [] })).toThrow(
      'Acceptance criteria is required',
    );
    expect(
      checkBuildTicket(renderBuildTicket(base).replace('**Expected**', '**Gone**')).errors,
    ).toContain('missing section: **Expected**');
    expect(
      checkBuildTicket(renderBuildTicket(base).replace('**Acceptance criteria**', '**Gone**'))
        .errors,
    ).toContain('missing section: **Acceptance criteria**');
  });

  it('enforces one to three Expected sentences in render and check', () => {
    expect(() => renderBuildTicket({ ...base, expected: 'One. Two? Three! Four.' })).toThrow(
      'Expected must be one to three sentences',
    );
    const body = renderBuildTicket(base).replace(
      base.expected,
      'One sentence. Two sentences. Three sentences. Four sentences.',
    );
    expect(checkBuildTicket(body).errors).toContain('Expected must be one to three sentences');
    expect(() =>
      renderBuildTicket({
        ...base,
        expected: 'The U.S. timeline opens. Cards render. Filters work.',
      }),
    ).not.toThrow();
    expect(() => renderBuildTicket({ ...base, expected: 'One.Two.Three.Four.' })).toThrow(
      'Expected must be one to three sentences',
    );
  });

  it('validates the size claim against paths and estimated lines instead of checking headings only', () => {
    const body = renderBuildTicket(base);
    expect(checkBuildTicket(body.replace('size=small', 'size=medium')).errors).toContain(
      'marker size does not match Size',
    );
    expect(
      checkBuildTicket(body.replace('estimated-lines=40', 'estimated-lines=400')).errors,
    ).toContain('Size claim is invalid; expected medium');
  });

  it('returns check errors for a malformed path instead of throwing', () => {
    const body = renderBuildTicket(base).replace(
      'apps/web/components/longlive/Timeline.tsx',
      'apps/web/./app/api/feedback.ts',
    );
    expect(() => checkBuildTicket(body)).not.toThrow();
    expect(checkBuildTicket(body).errors).toContain(
      'path must be canonical: apps/web/./app/api/feedback.ts',
    );
  });

  it('refuses large tickets and public copies of founder Discord text', () => {
    expect(() => renderBuildTicket({ ...base, needsSpec: true })).toThrow('requires a spec');
    expect(() =>
      renderBuildTicket({ ...base, source: 'chat:https://discord.com/channels/1/2/3' }),
    ).toThrow("founder's Discord words");
  });

  it('allows alert tickets without a Reporter said block', () => {
    const body = renderBuildTicket({ ...base, source: 'alert', reporterSaid: undefined });
    expect(body).not.toContain('**Reporter said**');
    expect(checkBuildTicket(body)).toEqual({ ok: true, errors: [] });
  });
});

describe('findExistingBuildTicket', () => {
  const filed = {
    number: 44,
    url: 'https://github.com/o/r/issues/44',
    labels: [{ name: 'marjorie-filed' }],
    body: renderBuildTicket(base),
  };

  it('finds the prior filing by exact source context', () => {
    expect(findExistingBuildTicket([filed], base.sourceContext)).toBe(filed);
  });

  it('does not accept the same text on an issue without marjorie-filed', () => {
    expect(findExistingBuildTicket([{ ...filed, labels: [] }], base.sourceContext)).toBeNull();
  });

  it('does not let a pre-M8 unready filing suppress a ready-shaped replacement', () => {
    expect(
      findExistingBuildTicket([{ ...filed, body: base.sourceContext }], base.sourceContext),
    ).toBeNull();
  });

  it('matches source context as an exact line, not a substring of another issue number', () => {
    const source12 = '**From watchdog alert** — https://github.com/o/r/issues/12';
    const source123 = '**From watchdog alert** — https://github.com/o/r/issues/123';
    const body = renderBuildTicket({ ...base, source: 'alert', sourceContext: source123 });
    expect(findExistingBuildTicket([{ ...filed, body }], source12)).toBeNull();
  });
});

describe('CLI', () => {
  it('renders to a file, checks it, and reports its size', () => {
    const dir = mkdtempSync(join(tmpdir(), 'build-ticket-'));
    const input = join(dir, 'input.json');
    const output = join(dir, 'body.md');
    writeFileSync(input, JSON.stringify(base));
    execFileSync('node', [CLI, 'render', input, output]);
    expect(readFileSync(output, 'utf8')).toContain(
      '<!-- marjorie-build: size=small source=issue -->',
    );
    expect(execFileSync('node', [CLI, 'check', output], { encoding: 'utf8' }).trim()).toBe('ready');
    expect(execFileSync('node', [CLI, 'size', input], { encoding: 'utf8' }).trim()).toBe('small');
    const issues = join(dir, 'issues.json');
    writeFileSync(
      issues,
      JSON.stringify([
        {
          number: 44,
          url: 'https://github.com/o/r/issues/44',
          labels: [{ name: 'marjorie-filed' }],
          body: renderBuildTicket(base),
        },
      ]),
    );
    expect(
      JSON.parse(execFileSync('node', [CLI, 'find', issues, input], { encoding: 'utf8' })),
    ).toEqual({
      number: 44,
      url: 'https://github.com/o/r/issues/44',
    });
  });

  it('exits nonzero and names the missing section', () => {
    const dir = mkdtempSync(join(tmpdir(), 'build-ticket-bad-'));
    const body = join(dir, 'bad.md');
    writeFileSync(body, '**Where**\nSurface: web\nFiles:\n- `apps/web/a.ts`\n');
    const result = spawnSync('node', [CLI, 'check', body], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('missing section: **Expected**');
    expect(result.stderr).toContain('missing section: **Acceptance criteria**');
  });
});
