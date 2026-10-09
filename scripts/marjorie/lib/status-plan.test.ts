import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { nextUpSections, renderNextUpSections } from './status-plan.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { renderNextUp } from './status-sections.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { STRATEGY_PATH, readStrategy, renderStrategy, strategyChangedAt, summaryBullets } from './status-strategy.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const PLAN = [
  '# Weekly plan — week of 2026-09-28', '', 'TL;DR: grow Instagram.', '',
  '## Next up', '',
  '### To grow', '- Ship the share-card MVP', '- Pitch the VMAs recap angle', '',
  '### To make content better', '1. Re-source the Midnights photos', '* Fix the 1989 caption tone', '',
  '### Other', '- Close the link sweep', '',
  '## 1. Are we growing?', '**Why:** flat', '- not a next-up bullet',
].join('\n');

describe('nextUpSections', () => {
  it('reads the To grow / To make content better / Other sub-sections under Next up, in order', () => {
    expect(nextUpSections(PLAN)).toEqual([
      { title: 'To grow', icon: '🌱', bullets: ['Ship the share-card MVP', 'Pitch the VMAs recap angle'] },
      { title: 'To make content better', icon: '🎨', bullets: ['Re-source the Midnights photos', 'Fix the 1989 caption tone'] },
      { title: 'Other', icon: '', bullets: ['Close the link sweep'] },
    ]);
  });
  it('stops at the next heading of the same or a higher level and skips empty sub-sections', () => {
    const out = nextUpSections('## Next up\n### To grow\n- a\n### Other\n\n## After\n### To grow\n- not mine');
    expect(out.map((s: { title: string }) => s.title)).toEqual(['To grow']);
  });
  it('returns nothing for a flat Next up, so the old bullet list still renders', () => {
    expect(nextUpSections('## Next up\n- one\n- two\n')).toEqual([]);
    expect(nextUpSections('no headings at all')).toEqual([]);
    expect(nextUpSections('')).toEqual([]);
  });
  it('caps bullets per sub-section and strips markers from the plan text', () => {
    const many = `## Next up\n### To grow\n${Array.from({ length: 9 }, (_, i) => `- item ${i} <!-- x -->`).join('\n')}`;
    const [grow] = nextUpSections(many);
    expect(grow.bullets).toHaveLength(5);
    expect(grow.bullets[0]).toBe('item 0');
  });
  it('renders as quoted bold headings with their bullets', () => {
    expect(renderNextUpSections(nextUpSections(PLAN)).slice(0, 4)).toEqual(['> **🌱 To grow**', '> - Ship the share-card MVP', '> - Pitch the VMAs recap angle', '> **🎨 To make content better**']);
  });
  it('replaces the flat summary on the page, and falls back to it when a plan has no sub-sections', () => {
    const withSections = renderNextUp({ plan: { number: 9, title: 'Weekly plan', url: 'https://p/9', body: PLAN }, prs: [] }, { now: NOW });
    expect(withSections).toContain('> **🌱 To grow**');
    expect(withSections).toContain('> - Close the link sweep');
    expect(withSections).not.toContain('TL;DR');
    const flat = renderNextUp({ plan: { number: 9, title: 'Weekly plan', url: 'https://p/9', body: '## Next up\n- Ship it\n' }, prs: [] }, { now: NOW });
    expect(flat).toContain('> - Ship it');
    expect(flat).not.toContain('To grow');
  });
});

describe('strategy summary', () => {
  const DOC = '# Growth strategy\n\nIntro.\n\n## Summary\n\n- Win on era pages\n- Post daily on IG @someone\n* Fashion later <!-- x -->\n\n## Details\n- not in the summary\n';
  it('takes the bullets of the Summary section only, at most six, defanged', () => {
    expect(summaryBullets(DOC)).toEqual(['Win on era pages', 'Post daily on IG @​someone', 'Fashion later &lt;!-- x --&gt;']);
    expect(summaryBullets(`## Summary\n${Array.from({ length: 9 }, (_, i) => `- b${i}`).join('\n')}`)).toHaveLength(6);
    expect(summaryBullets('## Summary\nJust a sentence.\n\n## Next')).toEqual(['Just a sentence.']);
    expect(summaryBullets('# No summary here')).toEqual([]);
  });
  const dirs: string[] = [];
  afterAll(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
  it('is absent (empty) when the strategy file does not exist, present when it does', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'status-strategy-'));
    dirs.push(root);
    expect(readStrategy(root)).toEqual([]);
    mkdirSync(path.join(root, 'docs', 'strategy'), { recursive: true });
    writeFileSync(path.join(root, STRATEGY_PATH), DOC);
    expect(readStrategy(root)).toHaveLength(3);
  });
  it('renders the bullets, the last-changed date, the full-strategy link and how to steer it — or nothing', () => {
    const out = renderStrategy({ bullets: ['A', 'B'], changedAt: '2026-09-28' }, { repo: 'o/r' });
    expect(out).toContain('## 🧭 Strategy\n\n- A\n- B\n');
    expect(out).toContain('Last changed 2026-09-28 — [full strategy](https://github.com/o/r/blob/main/docs/strategy/growth-strategy.md) — challenge or steer it by talking to Marjorie in #marjorie.');
    expect(renderStrategy({ bullets: ['A'], changedAt: '' }, { repo: 'o/r' })).not.toContain('Last changed');
    expect(renderStrategy({ bullets: [], changedAt: '' }, { repo: 'o/r' })).toBe('');
  });
  it('reads the last-changed date from the newest commit and tolerates failure', async () => {
    const api = async (p: string) => (p.includes('/commits?') ? [{ commit: { committer: { date: '2026-09-28T10:00:00Z' } } }] : []);
    expect(await strategyChangedAt(api, 'o/r')).toBe('2026-09-28');
    expect(await strategyChangedAt(async () => { throw new Error('404'); }, 'o/r')).toBe('');
  });
});
