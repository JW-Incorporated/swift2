import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { eraLink, isContentPR, erasTouched, renderContentLine } from './content-shipped.mjs';

describe('eraLink', () => {
  it('maps the two eras whose seed filename does not match the app era id', () => {
    expect(eraLink('the-life-of-a-showgirl')).toBe('https://www.longlivets.com/?era=tloas');
    expect(eraLink('tortured-poets')).toBe('https://www.longlivets.com/?era=ttpd');
  });

  it('maps a plain era 1:1', () => {
    expect(eraLink('red')).toBe('https://www.longlivets.com/?era=red');
  });

  it('returns null for an unknown era rather than guessing a link', () => {
    expect(eraLink('some-new-era-nobody-registered')).toBeNull();
  });
});

describe('isContentPR', () => {
  it('matches by branch prefix', () => {
    expect(isContentPR({ headRefName: 'content-shift/2026-08-23', labels: [] })).toBe(true);
    expect(isContentPR({ headRefName: 'vault/2026-08-23', labels: [] })).toBe(true);
    expect(isContentPR({ headRefName: 'fix/some-bug', labels: [] })).toBe(false);
  });

  it('matches by label even off-prefix', () => {
    expect(isContentPR({ headRefName: 'fix/karen-tickets', labels: [{ name: 'cie' }] })).toBe(true);
    expect(isContentPR({ headRefName: 'fix/karen-tickets', labels: ['content-shift'] })).toBe(true);
  });
});

describe('erasTouched', () => {
  it('maps known seed paths to eras and reports unknown paths separately', () => {
    const { eras, unmapped } = erasTouched([
      'supabase/seed/content/red.mjs',
      'supabase/seed/content/lover.mjs',
      'apps/web/lib/longlive/content-vault.generated.ts',
    ]);
    expect(eras.sort()).toEqual(['lover', 'red']);
    expect(unmapped).toEqual(['apps/web/lib/longlive/content-vault.generated.ts']);
  });

  it('never fabricates an era link for a path it cannot map', () => {
    const { eras, unmapped } = erasTouched(['scripts/content-engine/run.mjs']);
    expect(eras).toEqual([]);
    expect(unmapped).toEqual(['scripts/content-engine/run.mjs']);
  });
});

describe('renderContentLine', () => {
  it('links every era touched, with the PR link, when eras are known', () => {
    const pr = { number: 2291, title: 'content: red era dossier additions' };
    const line = renderContentLine(pr, ['supabase/seed/content/red.mjs']);
    expect(line).toContain('[red](https://www.longlivets.com/?era=red)');
    expect(line).toContain('[#2291](https://github.com/JW-Incorporated/swift2/pull/2291)');
  });

  it('falls back to raw paths, never a fabricated link, when nothing maps', () => {
    const pr = { number: 2292, title: 'fix: engine tweak' };
    const line = renderContentLine(pr, ['scripts/content-engine/run.mjs']);
    expect(line).not.toContain('?era=');
    expect(line).toContain('scripts/content-engine/run.mjs');
  });
});
