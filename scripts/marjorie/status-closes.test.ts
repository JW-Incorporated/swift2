// The rolling close PR against REAL git (a bare origin, a seed clone that plays
// "everyone else pushing to main", a work clone that plays the workflow's
// checkout) and a fake `gh`. Issue #4665: two replies a minute apart each opened
// a close PR from main rewriting the same "N open" header line; the second sat
// CONFLICTING for good.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { cleanRecord, closesBody, pendingCloses, recordsFromBody, syncCloses } from './lib/status-closes.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { handleComment } from './lib/status-reply.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { renderStatusPage } from './lib/status-render.mjs';

const OPEN = `# Human actions

<!-- ha-format: 2 -->

> **3 open.** Closed items are in \`HUMAN-ACTIONS-DONE.md\`.

## #91 🟡 [DECIDE] Which mix? (~5 min)
<!-- ha filed=2026-09-29 -->

**Why:** Needs a call.
**Steps:**
1. Decide: \`mix\` — both; \`no\` — neither.
**Worked if:** recorded.

## #85 🔴 [BLOCKING] Rotate the token (~5 min)
<!-- ha filed=2026-09-20 -->

**Why:** Expired.
**Steps:**
1. Do it.
**Worked if:** done.

## #80 🔴 [BLOCKING] Pay the invoice (~5 min)
<!-- ha filed=2026-09-10 -->

**Why:** Due.
**Steps:**
1. Do it.
**Worked if:** done.
`;
const DONE = '# Closed\n\n- #1 · 2026-09-01 · done · Old thing — "ok" · by chat\n';
const BRANCH = 'status-page/ha-closes';
const NOW = new Date('2026-10-01T06:00:00Z');

const dirs: string[] = [];
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function world() {
  const base = mkdtempSync(path.join(tmpdir(), 'status-closes-'));
  dirs.push(base);
  const origin = path.join(base, 'origin.git');
  git(base, 'init', '--quiet', '--bare', '-b', 'main', origin);
  const clone = (name: string) => {
    const dir = path.join(base, name);
    git(base, '-c', 'core.autocrlf=false', 'clone', '--quiet', origin, dir);
    git(dir, 'config', 'user.name', 'bot');
    git(dir, 'config', 'user.email', 'bot@example.com');
    git(dir, 'config', 'core.autocrlf', 'false');
    git(dir, 'checkout', '--quiet', '-B', 'main');
    return dir;
  };
  const seed = clone('seed');
  writeFileSync(path.join(seed, 'HUMAN-ACTIONS.md'), OPEN);
  writeFileSync(path.join(seed, 'HUMAN-ACTIONS-DONE.md'), DONE);
  git(seed, 'add', '.');
  git(seed, 'commit', '--quiet', '-m', 'seed');
  git(seed, 'push', '--quiet', 'origin', 'main');
  const work = clone('work');

  type Pr = { number: number; url: string; title: string; body: string; headRefName: string; isCrossRepository: boolean; open: boolean };
  const prs: Pr[] = [];
  const ghCalls: string[][] = [];
  const flag = (args: string[], name: string) => args[args.indexOf(name) + 1];
  const run = vi.fn((cmd: string, args: string[]) => {
    if (cmd === 'git') return git(work, ...args);
    ghCalls.push(args);
    if (args[0] === 'pr' && args[1] === 'list') return JSON.stringify(prs.filter((p) => p.open));
    if (args[0] === 'pr' && args[1] === 'create') {
      const n = 4660 + prs.length + 1;
      prs.push({ number: n, url: `https://github.com/o/r/pull/${n}`, title: flag(args, '--title'), body: flag(args, '--body'), headRefName: flag(args, '--head'), isCrossRepository: false, open: true });
      return `https://github.com/o/r/pull/${n}\n`;
    }
    if (args[0] === 'pr' && args[1] === 'edit') {
      const pr = prs.find((p) => String(p.number) === args[2])!;
      pr.title = flag(args, '--title');
      pr.body = flag(args, '--body');
      return '';
    }
    if (args[0] === 'pr' && args[1] === 'view') return JSON.stringify({ body: prs.find((p) => String(p.number) === args[2])!.body });
    if (args[0] === 'pr' && args[1] === 'close') {
      prs.find((p) => String(p.number) === args[2])!.open = false;
      return '';
    }
    return '';
  });
  const owner = (id: number, body: string) => ({
    action: 'created',
    issue: { number: 50, labels: [{ name: 'status-page' }] },
    comment: { id, body, html_url: `https://github.com/o/r/issues/50#issuecomment-${id}`, author_association: 'OWNER', user: { login: 'sffan15-sys', type: 'User' } },
  });
  const replies: string[] = [];
  /** One owner reply, the way the sweep runs it: back on main first. */
  const reply = async (id: number, body: string) => {
    git(work, 'checkout', '--force', '--quiet', 'main');
    return handleComment({ event: owner(id, body), root: work, run, reply: async (t: string) => { replies.push(t); }, repo: 'o/r', now: NOW, prToken: 'pat', log: vi.fn() });
  };
  /** Everyone else landing a commit on main. */
  const pushMain = (edit: (text: string) => string) => {
    git(seed, 'pull', '--quiet', '--ff-only', 'origin', 'main');
    writeFileSync(path.join(seed, 'HUMAN-ACTIONS.md'), edit(readFileSync(path.join(seed, 'HUMAN-ACTIONS.md'), 'utf8')));
    git(seed, 'commit', '--quiet', '-am', 'main moves');
    git(seed, 'push', '--quiet', 'origin', 'main');
  };
  /** Merging the PR the way GitHub would, in a scratch clone; throws on a conflict. */
  const mergeInto = (name: string) => {
    const dir = clone(name);
    git(dir, 'merge', '--quiet', '--no-edit', `origin/${BRANCH}`);
    return { open: readFileSync(path.join(dir, 'HUMAN-ACTIONS.md'), 'utf8'), done: readFileSync(path.join(dir, 'HUMAN-ACTIONS-DONE.md'), 'utf8'), dir };
  };
  return { work, prs, ghCalls, run, reply, replies, pushMain, mergeInto };
}

vi.setConfig({ testTimeout: 60_000 });

describe('two closes in quick succession (issue #4665)', () => {
  it('land on ONE PR and merge cleanly together', async () => {
    const w = world();
    const first = await w.reply(1001, 'decide #80 close');
    const second = await w.reply(1002, 'decide #85 close');
    expect(first).toMatchObject({ acted: true, number: 80 });
    expect(second).toMatchObject({ acted: true, number: 85 });
    expect(w.prs).toHaveLength(1);
    expect(w.prs[0].title).toBe('Close HA #80, #85 — owner replied on the status page');
    expect(w.ghCalls.filter((a) => a[1] === 'create')).toHaveLength(1);
    expect(w.ghCalls.filter((a) => a[1] === 'edit')).toHaveLength(1);
    expect(w.replies[1]).toContain(w.prs[0].url);
    const merged = w.mergeInto('merge-a');
    expect(merged.open).not.toContain('## #80');
    expect(merged.open).not.toContain('## #85');
    expect(merged.open).toContain('## #91');
    expect(merged.open).toContain('**1 open.**');
    expect(merged.done).toMatch(/- #85 · 2026-09-30 · done · /);
    expect(merged.done).toMatch(/- #80 · 2026-09-30 · done · /);
    expect(merged.done).toContain("owner decided 'close'");
    expect(recordsFromBody(w.prs[0].body).map((r: { n: number }) => r.n)).toEqual([80, 85]);
    expect([...pendingCloses(w.prs.map((p) => ({ ...p, branch: p.headRefName, fork: p.isCrossRepository }))).keys()]).toEqual([80, 85]);
  });

  it('a repeat reply for an item already queued adds nothing', async () => {
    const w = world();
    await w.reply(1001, 'close #80 paid');
    const again = await w.reply(1002, 'done #80');
    expect(again).toMatchObject({ acted: false, reason: 'closing pr already open' });
    expect(w.prs).toHaveLength(1);
    expect(recordsFromBody(w.prs[0].body)).toHaveLength(1);
  });
});

describe('a close PR that main moved under', () => {
  async function queued() {
    const w = world();
    await w.reply(1001, 'decide #80 close');
    await w.reply(1002, 'decide #85 close');
    return w;
  }
  // Another item filed on main bumps the very header line both closes rewrite.
  const fileNewItem = (text: string) => `${text.replace('**3 open.**', '**4 open.**')}\n## #92 🟡 [DECIDE] Newly filed (~5 min)\n<!-- ha filed=2026-10-01 -->\n\n**Why:** New.\n**Steps:**\n1. Decide: \`a\` — one; \`b\` — two.\n**Worked if:** recorded.\n`;

  it('really conflicts without a rebuild, and the heal rebuilds it from main with every pending close', async () => {
    const w = await queued();
    w.pushMain(fileNewItem);
    expect(() => w.mergeInto('merge-conflict')).toThrow();

    const healed = await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log: vi.fn() });
    expect(healed).toMatchObject({ ok: true, changed: true, number: w.prs[0].number });
    expect(w.prs).toHaveLength(1);
    const merged = w.mergeInto('merge-healed');
    expect(merged.open).toContain('## #92');
    expect(merged.open).not.toContain('## #80');
    expect(merged.open).not.toContain('## #85');
    expect(merged.open).toContain('**2 open.**');
    expect(merged.done).toContain('- #80 · ');
    expect(merged.done).toContain('- #85 · ');
  });

  it('is a no-op when the branch is already main plus the pending closes', async () => {
    const w = await queued();
    const before = git(w.work, 'rev-parse', `origin/${BRANCH}`).trim();
    w.run.mockClear();
    const out = await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log: vi.fn() });
    expect(out).toMatchObject({ ok: true, changed: false });
    expect(w.run.mock.calls.some(([c, a]) => c === 'git' && (a as string[])[0] === 'push')).toBe(false);
    expect(git(w.work, 'ls-remote', 'origin', `refs/heads/${BRANCH}`).split('\t')[0]).toBe(before);
  });

  it('does nothing when no close PR is open', async () => {
    const w = world();
    expect(await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log: vi.fn() })).toEqual({ ok: true, nothing: true });
  });

  it('drops a close someone else already made on main, and closes the PR when none remain', async () => {
    const w = await queued();
    const strip = (id: number) => (text: string) => text.replace(new RegExp(`\\n## #${id} [\\s\\S]*?(?=\\n## #|$)`), '').replace(/\*\*\d open\.\*\*/, '**2 open.**');
    w.pushMain(strip(80));
    const log = vi.fn();
    const one = await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log });
    expect(one).toMatchObject({ ok: true });
    expect(w.prs[0].title).toBe('Close HA #85 — owner replied on the status page');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('dropping #80'));
    w.pushMain(strip(85));
    const none = await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log });
    expect(none).toEqual({ ok: true, nothing: true });
    expect(w.prs[0].open).toBe(false);
  });

  it('rebuilds from scratch when the PR was closed unmerged and the branch is stale', async () => {
    const w = await queued();
    w.prs[0].open = false;
    const out = await w.reply(1003, 'close #91 wrong question');
    expect(out.acted).toBe(true);
    expect(w.prs).toHaveLength(2);
    const merged = w.mergeInto('merge-fresh');
    expect(merged.open).not.toContain('## #91');
    expect(merged.open).toContain('## #80');
  });
});

describe('records read back from a PR body are untrusted', () => {
  const good = { n: 80, o: 'done', d: '2026-09-30', note: 'status page u — owner said done', by: 'status page', s: 'done' };
  it('round-trips through the body, whatever the owner typed', () => {
    const nasty = { ...good, note: 'a --> b <!-- c', s: 'closed: <script>' };
    const rec = cleanRecord(nasty);
    expect(recordsFromBody(closesBody([rec]))).toEqual([rec]);
    expect(closesBody([rec]).match(/--!?>/g)).toHaveLength(1);
  });
  it('drops malformed, duplicate and out-of-range records', () => {
    const body = [good, { ...good, o: 'delete' }, { ...good, n: -3 }, { ...good, d: 'yesterday' }, { ...good, note: '' }, good]
      .map((r) => `<!-- ha-close ${JSON.stringify(r)} -->`).join('\n') + '\n<!-- ha-close {not json} -->';
    expect(recordsFromBody(body)).toEqual([good]);
  });
  it('ignores a same-named branch from a fork', async () => {
    const w = world();
    w.prs.push({ number: 9, url: 'https://github.com/o/r/pull/9', title: 'Close HA #80 — x', body: closesBody([good]), headRefName: BRANCH, isCrossRepository: true, open: true });
    const out = await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log: vi.fn() });
    expect(out).toEqual({ ok: true, nothing: true });
  });
});

describe('pendingCloses', () => {
  it('reads the rolling PR from its body and older per-item PRs from their titles', () => {
    const rec = cleanRecord({ n: 85, o: 'done', d: '2026-09-30', note: 'n', s: 'closed: wrong question' });
    const map = pendingCloses([
      { number: 4667, url: 'u1', title: 'Close HA #80, #85 — owner replied on the status page', body: closesBody([rec]), branch: BRANCH, author: 'sffan15-sys', fork: false },
      { number: 4668, url: 'u2', title: 'Close HA #12 — founder said done in chat', body: '', branch: 'marjorie/ha-close-12-5', author: 'sffan15-sys', fork: false },
      { number: 4669, url: 'u3', title: 'feat: something', body: '', branch: 'feat/x', author: 'sffan15-sys', fork: false },
    ]);
    expect([...map.keys()].sort()).toEqual([12, 85]);
    expect(map.get(85)).toEqual({ pr: { number: 4667, url: 'u1' }, summary: 'closed: wrong question' });
    expect(map.get(12)).toEqual({ pr: { number: 4668, url: 'u2' }, summary: '' });
  });
});

describe('the page reflects an answered item at once', () => {
  const page = (openPrs: unknown[], haMarkdown = OPEN) => renderStatusPage({
    haMarkdown, mergedPrs: [], openPrs, plan: null, posted: [], draftPrs: [], metricsLatest: null, metricsPrior: null,
    note: { text: '', date: '' }, ping: null, warnings: [],
  }, { now: Date.parse('2026-10-01T06:00:00Z'), repo: 'o/r' });
  const rec = (n: number, s: string) => cleanRecord({ n, o: 'done', d: '2026-10-01', note: 'n', s });
  const rolling = { number: 4667, url: 'https://github.com/o/r/pull/4667', title: 'Close HA #80, #85 — x', branch: BRANCH, labels: [], draft: false, body: closesBody([rec(80, 'closed: paid'), rec(85, 'decided: close')]) };

  it('moves answered items from Needs you to a Closing line while their PR is open', () => {
    const out = page([rolling]);
    const needs = out.slice(out.indexOf('## 🙋 Needs you'), out.indexOf('## 🚢'));
    expect(needs).toContain('**#91 — ');
    expect(needs).not.toContain('**#80 — ');
    expect(needs).not.toContain('**#85 — ');
    expect(needs).toContain('✅ **Closing — merging now**');
    expect(needs).toContain('- #85 — Rotate the token');
    expect(needs).toContain('your answer: decided: close · [PR #4667](https://github.com/o/r/pull/4667)');
    expect(out).toContain('🔴 0 blocking · 🟡 1 to decide');
    expect(out).not.toContain('⏳ Closing now');
  });
  it('drops the line entirely once the PR has merged (gone from the open list and the file)', () => {
    const merged = OPEN.replace(/\n## #85 [\s\S]*$/, '\n').replace('**3 open.**', '**1 open.**');
    const out = page([], merged);
    expect(out).not.toContain('Closing — merging now');
    expect(out).not.toContain('#85');
    expect(out).not.toContain('#80');
  });
  it('shows nothing for a close PR whose item already left the file', () => {
    expect(page([rolling], OPEN.replace(/\n## #80 [\s\S]*$/, '\n').replace(/\n## #85 [\s\S]*?(?=\n## #|$)/, ''))).not.toContain('#80 —');
  });
});

describe('only OUR close PRs count (the repo is public)', () => {
  const rec = cleanRecord({ n: 80, o: 'done', d: '2026-10-01', note: 'n', s: 'closed: paid' });
  const ours = { number: 4667, url: 'https://github.com/o/r/pull/4667', title: 'Close HA #80 — x', body: closesBody([rec]), branch: BRANCH, author: 'github-actions[bot]', fork: false, labels: [] as string[], draft: false };
  const page = (openPrs: unknown[]) => renderStatusPage({
    haMarkdown: OPEN, mergedPrs: [], openPrs, plan: null, posted: [], draftPrs: [], metricsLatest: null, metricsPrior: null,
    note: { text: '', date: '' }, ping: null, warnings: [],
  }, { now: Date.parse('2026-10-01T06:00:00Z'), repo: 'o/r' });

  it('ignores a fork PR that reuses the rolling branch name and a stranger\'s "Close HA" title', () => {
    expect([...pendingCloses([{ ...ours, fork: true }]).keys()]).toEqual([]);
    expect([...pendingCloses([{ ...ours, branch: 'evil/x', author: 'stranger' }]).keys()]).toEqual([]);
    expect([...pendingCloses([{ ...ours, branch: 'evil/x', body: '' }]).keys()]).toEqual([]);
    expect([...pendingCloses([ours]).keys()]).toEqual([80]);
  });
  it('accepts an older per-item close branch only from the bot or the owner', () => {
    const legacy = { ...ours, title: 'Close HA #85 — x', body: '', branch: 'status-page/ha-close-85-9' };
    expect([...pendingCloses([legacy]).keys()]).toEqual([85]);
    expect([...pendingCloses([{ ...legacy, author: 'stranger' }]).keys()]).toEqual([]);
    expect([...pendingCloses([{ ...legacy, branch: 'marjorie/ha-close-85-9', author: 'sffan15-sys' }]).keys()]).toEqual([85]);
  });
  it('a forged PR neither hides a Needs-you item nor injects text into the page', () => {
    const forged = { ...ours, fork: true, body: closesBody([cleanRecord({ n: 80, o: 'done', d: '2026-10-01', note: 'n', s: '@everyone <!-- x --> click' })]) };
    const out = page([forged]);
    expect(out).toContain('**#80 — ');
    expect(out).not.toContain('Closing — merging now');
    expect(out).not.toContain('@everyone');
  });
  it('defangs even a trusted summary: no markers, backticks or live mentions', () => {
    const risky = { ...ours, body: closesBody([cleanRecord({ n: 80, o: 'done', d: '2026-10-01', note: 'n', s: 'decided: @sffan15-sys <!-- x --> `code`' })]) };
    const needs = page([risky]);
    expect(needs).toContain('your answer: decided: @​sffan15-sys &lt;!-- x --&gt; \'code\'');
    expect(needs).not.toMatch(/@sffan15-sys|<!-- x/);
  });
});

describe('a heal never closes a PR a reply just added to', () => {
  async function queued() {
    const w = world();
    await w.reply(1001, 'decide #80 close');
    return w;
  }
  const strip80 = (text: string) => text.replace(/\n## #80 [\s\S]*$/, '\n').replace(/\*\*\d open\.\*\*/, '**2 open.**');

  it('leaves the PR open when its body gained a close between the heal\'s listing and its close', async () => {
    const w = await queued();
    w.pushMain(strip80);
    const base = w.run.getMockImplementation()!;
    w.run.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'gh' && args[1] === 'view') {
        w.prs[0].body = closesBody([...recordsFromBody(w.prs[0].body), cleanRecord({ n: 85, o: 'done', d: '2026-10-01', note: 'n', s: 'done' })]);
      }
      return base(cmd, args);
    });
    const out = await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log: vi.fn() });
    expect(out).toMatchObject({ ok: true, nothing: true, raced: true });
    expect(w.prs[0].open).toBe(true);
    expect(recordsFromBody(w.prs[0].body).map((r: { n: number }) => r.n)).toEqual([80, 85]);
  });
  it('does not close when the re-read fails either', async () => {
    const w = await queued();
    w.pushMain(strip80);
    const base = w.run.getMockImplementation()!;
    w.run.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'gh' && args[1] === 'view') throw new Error('502');
      return base(cmd, args);
    });
    expect(await syncCloses({ root: w.work, run: w.run, repo: 'o/r', prToken: 'pat', log: vi.fn() })).toMatchObject({ raced: true });
    expect(w.prs[0].open).toBe(true);
  });
});
