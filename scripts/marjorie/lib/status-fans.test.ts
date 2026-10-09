import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { classifyFans, needsFiles, readRecap, renderForFans, replaceRecap, sanitizeRecap } from './status-fans.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { FEEDBACK_LABEL, fetchFeedback, fetchPrFiles } from './status-fans-data.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { renderShipped } from './status-shipped.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const pr = (n: number, title: string, over: Record<string, unknown> = {}) => ({
  number: n, title, url: `https://github.com/o/r/pull/${n}`, author: 'a', branch: `b${n}`, labels: [] as string[],
  mergedAt: '2026-09-30T18:00:00Z', updatedAt: '2026-09-30T18:00:00Z', draft: false, body: '', ...over,
});

describe('classifyFans', () => {
  const content = pr(1, 'content: add Midnights moment', { branch: 'content-shift/midnights-1', labels: ['content-shift'] });
  const web = pr(2, 'feat(web): era page share button');
  const webByFiles = pr(3, 'Add a nicer empty state');
  const onlyTests = pr(4, 'fix(web): flaky test');
  const docs = pr(5, 'docs: update the readme');
  const mobile = pr(6, 'feat(mobile): push permission prompt');
  const ci = pr(7, 'ci: speed up the build');
  const backend = pr(8, 'fix(worker): retry the sync');
  const files = new Map([
    [1, ['supabase/seed/content/midnights.mjs']],
    [2, ['apps/web/components/longlive/Share.tsx']],
    [3, ['packages/experience/src/empty.tsx']],
    [4, ['apps/web/lib/x.test.ts']],
    [6, ['apps/mobile/app/push.tsx']],
    [8, ['apps/worker/src/sync.ts']],
  ]);
  const all = [content, web, webByFiles, onlyTests, docs, mobile, ci, backend];

  it('sorts content, site, and app changes; leaves tests, docs, CI and backend behind the scenes', () => {
    const out = classifyFans(all, files);
    expect(out.content.map((x: { pr: { number: number } }) => x.pr.number)).toEqual([1]);
    expect(out.site.map((x: { pr: { number: number } }) => x.pr.number)).toEqual([2, 3]);
    expect(out.app.map((x: { pr: { number: number } }) => x.pr.number)).toEqual([6]);
  });
  it('falls back to a feat/fix title scoped to the site or app when the file list is unavailable', () => {
    const out = classifyFans([web, webByFiles, mobile, backend, docs, onlyTests], new Map());
    expect(out.site.map((x: { pr: { number: number } }) => x.pr.number)).toEqual([2, 4]);
    expect(out.app.map((x: { pr: { number: number } }) => x.pr.number)).toEqual([6]);
  });
  it('only asks GitHub for the files of PRs that could be fan-facing', () => {
    expect(all.filter(needsFiles).map((p) => p.number)).toEqual([1, 2, 3, 4, 6, 8]);
  });
});

describe('renderForFans', () => {
  const fans = {
    content: [{ pr: pr(1, 'content: add Midnights moment'), paths: ['supabase/seed/content/midnights.mjs'] }, { pr: pr(9, 'content: unmapped'), paths: ['somewhere/else.mjs'] }],
    site: [{ pr: pr(2, 'feat(web): era page share button (#2)') }],
    app: [],
  };
  const posted = [{ platform: 'x', postedAt: '2026-09-30T10:00:00Z', url: 'https://x.com/p/1' }, { platform: 'instagram', postedAt: '2026-09-29T10:00:00Z', url: '' }];
  const feedback = { count: 2, numbers: [7, 8], latest: [{ number: 8, title: 'Love it @sffan15-sys see #123 [x](http://a)', url: 'https://github.com/o/r/issues/8' }, { number: 7, title: 'Bug on iPad', url: 'https://github.com/o/r/issues/7' }] };
  const out = renderForFans({ fans, posted, feedback, recap: '- A new Midnights moment is up\n- Sharing an era is easier' });

  it('has the heading, the recap region, then one block per non-empty feed', () => {
    expect(out.startsWith('## 🎉 For fans — what changed on the site (7 days)\n\n<!-- fan-recap:start -->\n- A new Midnights moment is up')).toBe(true);
    expect(out).toContain('**📚 New content** (2)');
    expect(out).toContain('**📣 Posts that went live** (2)');
    expect(out).toContain('**✨ Features & fixes** (1)');
    expect(out).not.toContain('App updates');
  });
  it('links an era on the site when the changed seed file maps to one, and always the PR otherwise', () => {
    expect(out).toContain('- [add Midnights moment](https://github.com/o/r/pull/1) — [see midnights on the site](https://www.longlivets.com/?era=midnights)');
    expect(out).toContain('- [content: unmapped](https://github.com/o/r/pull/9)'.replace('content: ', ''));
  });
  it('lists posts with links, strips the PR number from titles, and counts feedback with the latest few', () => {
    expect(out).toContain('- [X · 2026-09-30](https://x.com/p/1)');
    expect(out).toContain('- Instagram · 2026-09-29');
    expect(out).toContain('- [era page share button](https://github.com/o/r/pull/2)');
    expect(out).toContain('💬 **2** pieces of feedback from fans in 7 days');
    expect(out).toContain('- [#7 Bug on iPad](https://github.com/o/r/issues/7)');
  });
  it('defangs fan-written feedback titles: no mentions, links or issue cross-refs', () => {
    const line = out.split('\n').find((l: string) => l.includes('#8')) as string;
    expect(line).not.toMatch(/\[x\]|@sffan15-sys|#123/);
  });
  it('says so when there is nothing, when feedback is unreadable, and when there is none', () => {
    const quiet = renderForFans({ fans: { content: [], site: [], app: [] }, posted: [], feedback: { count: 0, numbers: [], latest: [] }, recap: '' });
    expect(quiet).toContain('_Nothing changed for fans in the last 7 days._');
    expect(quiet).toContain('No feedback from fans in the last 7 days.');
    expect(quiet).toContain("_Marjorie writes a short, plain-language recap");
    expect(renderForFans({ fans: { content: [], site: [], app: [] }, posted: [], feedback: null, recap: '' })).toContain("isn't readable this run");
  });
  it('caps each block at six lines and counts the rest', () => {
    const many = renderForFans({ fans: { content: [], site: Array.from({ length: 9 }, (_, i) => ({ pr: pr(100 + i, `feat(web): thing ${i}`) })), app: [] }, posted: [], feedback: { count: 0, numbers: [], latest: [] }, recap: '' });
    expect(many).toContain('**✨ Features & fixes** (9)');
    expect(many).toContain('_+3 more_');
  });
});

describe('the fan recap region', () => {
  it('round-trips, reads back empty for the placeholder, and replaces in place', () => {
    const page = replaceRecap('# page\n', '- one\n- two');
    expect(readRecap(page)).toBe('- one\n- two');
    expect(readRecap(replaceRecap(page, '- three'))).toBe('- three');
    expect(replaceRecap(page, '- three').match(/fan-recap:start/g)).toHaveLength(1);
    expect(readRecap(renderForFans({ fans: { content: [], site: [], app: [] }, posted: [], feedback: null, recap: '' }))).toBe('');
    expect(readRecap('nothing')).toBe('');
  });
  it('is short, plain and safe: six lines max, no markers, no live mentions', () => {
    const out = sanitizeRecap(`${Array.from({ length: 9 }, (_, i) => `- line ${i} <!-- fan-recap:end --> @bob`).join('\n')}\n`);
    expect(out.split('\n')).toHaveLength(6);
    expect(out).not.toContain('<!--');
    expect(out).not.toMatch(/@bob/);
    expect(sanitizeRecap('x'.repeat(500)).length).toBeLessThanOrEqual(220);
  });
});

describe('Behind the scenes', () => {
  it('is the merged-PR list inside a collapsed block under its own heading', () => {
    const out = renderShipped([pr(1, 'chore: tidy'), pr(2, 'refactor: split')], { hidden: 3, heading: '## 🔧 Behind the scenes (last 7 days)', collapse: true });
    expect(out.startsWith('## 🔧 Behind the scenes (last 7 days)\n\n<details>\n<summary>2 merged — tap to expand</summary>')).toBe(true);
    expect(out.endsWith('</details>')).toBe(true);
    expect(out).toContain('3 housekeeping PRs filtered');
    expect(out).toContain('- [chore: tidy](https://github.com/o/r/pull/1)');
  });
});

describe('fan data lookups', () => {
  it('reads each candidate PR\'s changed files, newest first, and leaves a failed lookup out', async () => {
    const calls: string[] = [];
    const api = async (p: string) => {
      calls.push(p);
      if (p.includes('/pulls/3/')) throw new Error('boom');
      return [{ filename: 'apps/web/a.tsx' }];
    };
    const files = await fetchPrFiles(api, 'o/r', [pr(2, 'feat(web): x'), pr(3, 'feat(web): y'), pr(4, 'docs: z'), pr(5, 'feat(web): old', { mergedAt: '2026-08-01T00:00:00Z' })], NOW);
    expect([...files.keys()]).toEqual([2]);
    expect(calls.some((c) => c.includes('/pulls/4/'))).toBe(false);
    expect(calls.some((c) => c.includes('/pulls/5/'))).toBe(false);
  });
  it('counts the user-feedback tickets of the last seven days from the issues API', async () => {
    const row = (n: number, at: string) => ({ number: n, title: `fb ${n}`, html_url: `https://github.com/o/r/issues/${n}`, body: '', state: 'open', labels: [{ name: FEEDBACK_LABEL }], created_at: at });
    const seen: string[] = [];
    const api = async (p: string) => { seen.push(p); return [row(9, '2026-09-30T00:00:00Z'), row(8, '2026-09-29T00:00:00Z'), row(7, '2026-09-28T00:00:00Z'), row(6, '2026-09-27T00:00:00Z'), row(5, '2026-09-10T00:00:00Z')]; };
    const out = await fetchFeedback(api, 'o/r', NOW);
    expect(seen[0]).toContain('labels=user-feedback');
    expect(out.count).toBe(4);
    expect(out.numbers).toEqual([9, 8, 7, 6]);
    expect(out.latest.map((f: { number: number }) => f.number)).toEqual([9, 8, 7]);
    await expect(fetchFeedback(async () => { throw new Error('403'); }, 'o/r', NOW)).rejects.toThrow();
  });
});
