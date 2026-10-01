import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { BODY_LIMIT, PAGE_MARKER, readPreserved, renderStatusPage, sanitizeNote } from './status-render.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { gatherStatusData, readMetrics, readPosted } from './status-data.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { planSummary, renderGrowth, renderNextUp, renderTree } from './status-sections.mjs';

const REPO = 'JW-Incorporated/swift2';
const NOW = Date.parse('2026-09-30T20:00:00Z');
const HA = `## #1 🔴 [BLOCKING] Do a thing (~5 min)
<!-- ha filed=2026-09-29 -->

**Why:** Because.
**Steps:**
1. Do it.
**Worked if:** done.
`;
const pr = (n: number, over: Record<string, unknown> = {}) => ({
  number: n, title: `change ${n}`, url: `https://github.com/o/r/pull/${n}`, author: 'a', branch: `b${n}`, labels: [] as string[],
  mergedAt: '2026-09-30T18:00:00Z', updatedAt: '2026-09-30T18:00:00Z', draft: false, ...over,
});
const base = () => ({
  haMarkdown: HA, mergedPrs: [pr(1)], openPrs: [pr(2, { mergedAt: null })], plan: null, posted: [], draftPrs: [],
  metricsLatest: null, metricsPrior: null, note: { text: '', date: '' }, ping: null, warnings: [],
});

describe('renderStatusPage', () => {
  const body = renderStatusPage(base(), { now: NOW, repo: REPO });
  it('has the header with the UTC update time and every section in order', () => {
    expect(body.startsWith(PAGE_MARKER)).toBe(true);
    expect(body).toContain('_Updated 2026-09-30 20:00 UTC · 1:00 PM PT_');
    const order = ['## 🙋 Needs you', '## 🎉 For fans', '## 🔧 Behind the scenes', '## 🧭 Next up', '## 📈 Growth', '## 🌳 Tree', "## 🗒️ Marjorie's note"].map((h) => body.indexOf(h));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it('is deterministic for a fixed clock', () => {
    expect(renderStatusPage(base(), { now: NOW, repo: REPO })).toBe(body);
  });
  it('stays under GitHub\'s body limit even with thousands of PRs and hundreds of actions', () => {
    const huge = base();
    huge.mergedPrs = Array.from({ length: 4000 }, (_, i) => pr(i, { title: `change ${i} ${'x'.repeat(150)}` }));
    huge.openPrs = Array.from({ length: 500 }, (_, i) => pr(10_000 + i, { mergedAt: null }));
    huge.haMarkdown = Array.from({ length: 300 }, (_, i) => HA.replace('## #1 ', `## #${i + 1} `).replace('Because.', `Because ${'why '.repeat(80)}.`)).join('\n');
    huge.note = { text: 'n'.repeat(5000), date: '2026-09-30' };
    const out = renderStatusPage(huge, { now: NOW, repo: REPO });
    expect(out.length).toBeLessThanOrEqual(BODY_LIMIT);
    expect(BODY_LIMIT).toBeLessThan(65_536);
  });
  it('names unreadable sources instead of claiming an empty list', () => {
    const out = renderStatusPage({ ...base(), haMarkdown: '', warnings: ['HUMAN-ACTIONS.md', 'merged PRs'] }, { now: NOW, repo: REPO });
    expect(out).toContain("Couldn't read: HUMAN-ACTIONS.md, merged PRs");
    expect(out).toContain('Could not read HUMAN-ACTIONS.md');
    expect(out).not.toContain('Nothing waiting on you');
  });
  it('keeps Marjorie\'s note and ping stamp across a re-render', () => {
    const first = renderStatusPage({ ...base(), note: { text: 'Hold the line.\nSecond line.', date: '2026-09-30' }, ping: { date: '2026-09-30', msg: '123' } }, { now: NOW, repo: REPO });
    const kept = readPreserved(first);
    expect(kept.note).toEqual({ text: 'Hold the line.\nSecond line.', date: '2026-09-30' });
    expect(kept.ping).toEqual({ date: '2026-09-30', msg: '123' });
    const second = renderStatusPage({ ...base(), ...{ note: kept.note, ping: kept.ping } }, { now: NOW + 3 * 3_600_000, repo: REPO });
    expect(readPreserved(second)).toEqual(kept);
  });
  it('treats the empty-note placeholder as no note', () => {
    expect(readPreserved(body).note).toEqual({ text: '', date: '' });
    expect(readPreserved('no markers at all')).toEqual({ note: { text: '', date: '' }, ping: null, held: '' });
  });
  it('filters noise from Shipped and counts it', () => {
    const out = renderStatusPage({ ...base(), mergedPrs: [pr(1), pr(3, { title: 'growth-snapshot: x' })] }, { now: NOW, repo: REPO });
    expect(out).toContain('1 housekeeping PRs filtered');
    expect(out).not.toContain('growth-snapshot');
  });
});

describe('sanitizeNote', () => {
  it('strips comment markers and defuses @-mentions', () => {
    const out = sanitizeNote('hi <!-- marjorie-note:end --> @sffan15-sys and email a@b.co `@code`');
    expect(out).not.toContain('<!--');
    expect(out).not.toContain('-->');
    expect(out).toContain('@​sffan15-sys');
    expect(out).toContain('a@b.co');
    expect(out).toContain('`@code`');
  });
});

describe('sections', () => {
  it('summarizes a weekly plan without headings or comments', () => {
    expect(planSummary('<!-- x -->\n# Title\n\nGoal one.\n\n---\nGoal two.')).toBe('Goal one.\nGoal two.');
  });
  it('quotes only the "Next up" bullets from a weekly plan, falling back to the first lines without that heading', () => {
    const plan = [
      '# Weekly plan — week of 2026-09-28', '', 'TL;DR: grow Instagram, fix the drafter.', '',
      '## Next up', '- Ship the share-card MVP', '- Unblock Tree drafts', '3. Review the Patient Zero coverage', '* Close the link sweep', '- Pick the VMAs recap angle', '- A sixth bullet that must not show', '',
      '## 1. Are we growing?', '**Why:** followers are flat', '**Evidence:** social/metrics', '',
      '## 2. Is content top tier?', '**Why:** mixed',
    ].join('\n');
    const out = planSummary(plan);
    expect(out.split('\n')).toEqual([
      '- Ship the share-card MVP', '- Unblock Tree drafts', '- Review the Patient Zero coverage', '- Close the link sweep', '- Pick the VMAs recap angle',
    ]);
    expect(out).not.toMatch(/Why|Evidence|TL;DR|sixth/);
    const page = renderNextUp({ plan: { number: 9, title: 'Weekly plan', url: 'https://p/9', body: plan }, prs: [] }, { now: NOW });
    expect(page).toContain('[Weekly plan](https://p/9)');
    expect(page).toContain('> - Ship the share-card MVP');
    expect(page).not.toContain('Evidence');
    expect(planSummary('# T\n\nTL;DR only.\n\n## Next up\n\nnothing bulleted\n\n## 1. Q\n**Why:** x')).toBe('TL;DR only.\nnothing bulleted\n**Why:** x');
  });
  it('renders next up with and without a plan, capping in-flight PRs at 8', () => {
    const prs = Array.from({ length: 11 }, (_, i) => pr(i + 1, { mergedAt: null, updatedAt: '2026-09-20T00:00:00Z' }));
    const withPlan = renderNextUp({ plan: { number: 5, title: 'Week of 09-28', url: 'https://p', body: 'Grow IG.' }, prs }, { now: NOW });
    expect(withPlan).toContain('[Week of 09-28](https://p)');
    expect(withPlan).toContain('> Grow IG.');
    expect(withPlan).toContain('_+3 more open_');
    expect(withPlan).toContain('idle 10d');
    expect(renderNextUp({ plan: null, prs: [] }, { now: NOW })).toContain('No weekly plan filed yet');
  });
  it('shows follower deltas against the earlier snapshot', () => {
    const out = renderGrowth({ latest: { date: '2026-09-30', followers: { x: 3, instagram: 10, facebook: 8 }, postsLast24h: { total: 2 } }, prior: { date: '2026-09-23', followers: { x: 3, instagram: 6, facebook: 9 } } });
    expect(out).toContain('Instagram: **10** (+4)');
    expect(out).toContain('X: **3** (±0)');
    expect(out).toContain('Facebook: **8** (-1)');
    expect(renderGrowth({ latest: null, prior: null })).toContain('No growth snapshot yet');
  });
  it('shows published posts and the pending approval count with a link', () => {
    const out = renderTree({ published: [{ platform: 'x', postedAt: '2026-09-29T10:00:00Z', url: 'https://x.com/p/1' }], pending: [pr(9), pr(10)], pendingUrl: 'https://list' });
    expect(out).toContain('**1** posts published in 7 days (X 1)');
    expect(out).toContain('**2** drafts awaiting your ✅ — [review](https://list)');
  });
});

describe('data readers', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'status-data-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'social', 'metrics'), { recursive: true });
  mkdirSync(path.join(root, 'social', 'posted'), { recursive: true });
  for (const d of ['2026-09-20', '2026-09-23', '2026-09-24', '2026-09-30']) {
    writeFileSync(path.join(root, 'social', 'metrics', `${d}.json`), JSON.stringify({ date: d, followers: { x: 1 } }));
  }
  writeFileSync(path.join(root, 'social', 'posted', 'a.json'), JSON.stringify({ platform: 'x', postedAt: '2026-09-29T00:00:00Z', url: 'u' }));
  writeFileSync(path.join(root, 'social', 'posted', 'old.json'), JSON.stringify({ platform: 'x', postedAt: '2026-08-01T00:00:00Z', url: 'u' }));
  writeFileSync(path.join(root, 'social', 'posted', 'pipeline-test-x.json'), JSON.stringify({ platform: 'x', postedAt: '2026-09-29T00:00:00Z' }));
  writeFileSync(path.join(root, 'social', 'posted', 'broken.json'), '{nope');
  writeFileSync(path.join(root, 'HUMAN-ACTIONS.md'), HA);

  it('compares the newest snapshot to the one nearest seven days earlier', () => {
    const { latest, prior } = readMetrics(root);
    expect(latest.date).toBe('2026-09-30');
    expect(prior.date).toBe('2026-09-23');
  });
  it('lists only real posts published inside the window', () => {
    expect(readPosted(root, NOW)).toEqual([{ platform: 'x', postedAt: '2026-09-29T00:00:00Z', url: 'u' }]);
  });
  it('degrades per source: a failing endpoint becomes a warning, not a blank page', async () => {
    const api = vi.fn(async (p: string) => {
      if (p.includes('state=closed')) throw new Error('boom');
      return [];
    });
    const data = await gatherStatusData({ api, repo: REPO, root, now: NOW, readPreserved });
    expect(data.warnings).toEqual(['merged PRs']);
    expect(data.haMarkdown).toBe(HA);
    expect(data.posted).toHaveLength(1);
  });
});

describe('the page\'s fan, strategy and behind-the-scenes sections', () => {
  const withStrategy = () => ({
    ...base(),
    mergedPrs: [pr(1, { title: 'chore: tidy' }), pr(2, { title: 'feat(web): era share button' })],
    strategy: { bullets: ['Win on era pages', 'Post daily'], changedAt: '2026-09-28' },
    prFiles: new Map([[2, ['apps/web/components/Share.tsx']]]),
    feedback: { count: 1, numbers: [5], latest: [{ number: 5, title: 'Love it', url: 'https://github.com/o/r/issues/5' }] },
    recap: '- Sharing an era is easier',
  });
  const out = renderStatusPage(withStrategy(), { now: NOW, repo: REPO });

  it('puts Strategy right under Needs you, then For fans, then the collapsed Behind the scenes', () => {
    const order = ['## 🙋 Needs you', '## 🧭 Strategy', '## 🎉 For fans', '## 🔧 Behind the scenes', '## 🧭 Next up', '## 📈 Growth'].map((h) => out.indexOf(h));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(out).toContain('- Win on era pages');
    expect(out).toContain('Last changed 2026-09-28');
  });
  it('shows fan-facing changes under For fans and only the rest behind the scenes', () => {
    const fans = out.slice(out.indexOf('## 🎉 For fans'), out.indexOf('## 🔧 Behind the scenes'));
    const behind = out.slice(out.indexOf('## 🔧 Behind the scenes'), out.indexOf('## 🧭 Next up'));
    expect(fans).toContain('[era share button](https://github.com/o/r/pull/2)');
    expect(fans).toContain('- Sharing an era is easier');
    expect(behind).toContain('<details>');
    expect(behind).toContain('[chore: tidy](https://github.com/o/r/pull/1)');
    expect(behind).not.toContain('era share button');
  });
  it('omits Strategy when the strategy file is absent, and keeps its markers out of the way', () => {
    const none = renderStatusPage({ ...withStrategy(), strategy: { bullets: [], changedAt: '' } }, { now: NOW, repo: REPO });
    expect(none).not.toContain('## 🧭 Strategy');
    expect(none.startsWith(PAGE_MARKER)).toBe(true);
  });
  it('is still deterministic and bounded', () => {
    expect(renderStatusPage(withStrategy(), { now: NOW, repo: REPO })).toBe(out);
    expect(out.length).toBeLessThanOrEqual(BODY_LIMIT);
  });
});
