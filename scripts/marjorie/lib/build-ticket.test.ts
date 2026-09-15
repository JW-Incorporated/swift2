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
    expect(AUSTIN_PATH_ALLOWLIST.map((rule: { root: string }) => rule.root)).toEqual([
      'apps/web/',
      'packages/',
      'docs/',
    ]);
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

  it('validates the size claim against paths and estimated lines instead of checking headings only', () => {
    const body = renderBuildTicket(base);
    expect(checkBuildTicket(body.replace('size=small', 'size=medium')).errors).toContain(
      'marker size does not match Size',
    );
    expect(
      checkBuildTicket(body.replace('estimated-lines=40', 'estimated-lines=400')).errors,
    ).toContain('Size claim is invalid; expected medium');
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
