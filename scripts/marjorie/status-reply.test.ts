import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { checkCommand, handleComment, isOwnerComment, parseCommand } from './lib/status-reply.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseHaEntries } from './lib/status-ha.mjs';

const OPEN = `# Human actions

<!-- ha-format: 2 -->

> **3 open.** Closed items are in \`HUMAN-ACTIONS-DONE.md\`.

## #88 🔴 [BLOCKING] Store the login (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** Needs the owner.
**Steps:**
1. Do it.
**Worked if:** done.

## #87 🟡 [DECIDE] Pick a budget (~5 min)
<!-- ha filed=2026-09-29 -->

**Why:** Alert fires daily.
**Steps:**
1. Read it.
2. Decide: \`accept\` — raise it; \`route\` — send to a desk.
**Worked if:** recorded.

## #70 🟡 [DECIDE] Free-form (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** Needs a call.
**Steps:**
1. Think.
**Worked if:** recorded.
`;
const DONE = `# Closed

- #1 · 2026-09-01 · done · Old thing — "ok" · by chat
`;

const dirs: string[] = [];
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });
function repoDir() {
  const dir = mkdtempSync(path.join(tmpdir(), 'status-reply-'));
  dirs.push(dir);
  writeFileSync(path.join(dir, 'HUMAN-ACTIONS.md'), OPEN);
  writeFileSync(path.join(dir, 'HUMAN-ACTIONS-DONE.md'), DONE);
  return dir;
}
const event = (body: string, over: Record<string, unknown> = {}) => ({
  action: 'created',
  issue: { number: 50, labels: [{ name: 'status-page' }], ...((over.issue as object) || {}) },
  comment: { id: 999, body, html_url: 'https://github.com/o/r/issues/50#issuecomment-999', author_association: 'OWNER', user: { login: 'sffan15-sys', type: 'User' }, ...((over.comment as object) || {}) },
});

function harness(prUrl = 'https://github.com/o/r/pull/501') {
  const calls: string[][] = [];
  const replies: string[] = [];
  const run = vi.fn((cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') return `${prUrl}\n`;
    return '';
  });
  const reply = vi.fn(async (t: string) => { replies.push(t); });
  return { calls, replies, run, reply };
}
const NOW = new Date('2026-09-30T20:00:00Z');

describe('isOwnerComment', () => {
  const ok = { login: 'sffan15-sys', association: 'OWNER', type: 'User' };
  it('admits only the owner account with owner or member standing', () => {
    expect(isOwnerComment(ok)).toBe(true);
    expect(isOwnerComment({ ...ok, association: 'MEMBER' })).toBe(true);
    expect(isOwnerComment({ ...ok, login: 'SFFAN15-SYS' })).toBe(true);
  });
  it('rejects other users, weaker standing, and bots', () => {
    expect(isOwnerComment({ ...ok, login: 'wjduvall-cmd' })).toBe(false);
    expect(isOwnerComment({ ...ok, login: 'random-fan', association: 'NONE' })).toBe(false);
    expect(isOwnerComment({ ...ok, association: 'CONTRIBUTOR' })).toBe(false);
    expect(isOwnerComment({ ...ok, association: 'COLLABORATOR' })).toBe(true);
    expect(isOwnerComment({ ...ok, login: 'someone-else', association: 'COLLABORATOR' })).toBe(false);
    expect(isOwnerComment({ ...ok, type: 'Bot' })).toBe(false);
    expect(isOwnerComment({ ...ok, login: 'sffan15-sys[bot]' })).toBe(false);
    expect(isOwnerComment({ login: 'github-actions[bot]', association: 'MEMBER', type: 'Bot' })).toBe(false);
    expect(isOwnerComment({})).toBe(false);
  });
});

describe('parseCommand', () => {
  it('reads done and decide on the first non-empty line', () => {
    expect(parseCommand('done #88')).toEqual({ kind: 'done', number: 88, text: '' });
    expect(parseCommand('\n  Decide #87 accept — fine by me ')).toEqual({ kind: 'decide', number: 87, text: 'accept — fine by me' });
    expect(parseCommand('`done #5`')).toEqual({ kind: 'done', number: 5, text: '' });
  });
  it('ignores everything else', () => {
    for (const body of ['', 'done', 'done 88 please', 'thanks!', 'I will do #88 done', 'please decide #87 accept', 'redone #5']) {
      expect(parseCommand(body)).toBeNull();
    }
  });
});

describe('checkCommand', () => {
  const items = parseHaEntries(OPEN);
  const [blocking, optioned, freeform] = items;
  it('accepts done only on non-decisions and decide only on decisions', () => {
    expect(checkCommand(blocking, { kind: 'done', number: 88, text: '' })).toMatchObject({ ok: true, choice: '' });
    expect(checkCommand(optioned, { kind: 'done', number: 87, text: '' }).ok).toBe(false);
    expect(checkCommand(blocking, { kind: 'decide', number: 88, text: 'yes' }).ok).toBe(false);
  });
  it('requires a declared option when options exist, keeping trailing detail', () => {
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'ACCEPT' })).toMatchObject({ ok: true, choice: 'accept' });
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'route to austin' })).toMatchObject({ ok: true, choice: 'route — to austin' });
    const bad = checkCommand(optioned, { kind: 'decide', number: 87, text: 'maybe' });
    expect(bad.ok).toBe(false);
    expect(bad.message).toContain('`accept`, `route`');
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: '' }).ok).toBe(false);
  });
  it('accepts a short free-form choice when none are declared', () => {
    expect(checkCommand(freeform, { kind: 'decide', number: 70, text: 'confirmed, ship it' })).toMatchObject({ ok: true, choice: 'confirmed, ship it' });
  });
});

describe('handleComment — who and what is acted on', () => {
  const never = async (e: ReturnType<typeof event>, why: string) => {
    const h = harness();
    const out = await handleComment({ event: e, root: repoDir(), run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out.acted).toBe(false);
    expect(out.reason).toBe(why);
    expect(h.run).not.toHaveBeenCalled();
    expect(h.reply).not.toHaveBeenCalled();
  };
  it('ignores a non-owner on a public repo, silently', async () => {
    await never(event('done #88', { comment: { user: { login: 'stranger', type: 'User' }, author_association: 'NONE' } }), 'not the owner');
  });
  it('ignores bot comments, including the owner-looking ones', async () => {
    await never(event('done #88', { comment: { user: { login: 'github-actions[bot]', type: 'Bot' }, author_association: 'MEMBER' } }), 'not the owner');
  });
  it('ignores comments on any other issue or on a PR', async () => {
    await never(event('done #88', { issue: { labels: [{ name: 'bug' }] } }), 'not the status issue');
    await never(event('done #88', { issue: { pull_request: {} } }), 'not a new issue comment');
  });
  it('ignores edits and deletions', async () => {
    await never({ ...event('done #88'), action: 'edited' }, 'not a new issue comment');
  });
  it('relays free-text owner comments to Marjorie instead of acting on them', async () => {
    const root = repoDir();
    const h = harness();
    const out = await handleComment({ event: event('can we talk about the Eras plan?'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out).toMatchObject({ acted: false, reason: 'relayed to marjorie' });
    expect(h.calls).toEqual([['gh', 'workflow', 'run', 'routine-marjorie-status-reply.yml', '--repo', 'o/r', '--ref', 'main', '-f', 'comment_id=999']]);
    expect(h.replies[0]).toContain('Passed to Marjorie');
    expect(readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8')).toContain('## #88');
  });
  it('says so when the relay dispatch fails, and still closes nothing', async () => {
    const h = harness();
    h.run.mockImplementation(() => { throw new Error('Resource not accessible'); });
    const out = await handleComment({ event: event('hello'), root: repoDir(), run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out).toMatchObject({ acted: false, reason: 'relay failed' });
    expect(h.replies[0]).toContain("couldn't pass that to Marjorie");
  });
});

describe('handleComment — closing', () => {
  it('done #N closes the item through a branch, PR and auto-merge, then acks', async () => {
    const root = repoDir();
    const h = harness();
    const out = await handleComment({ event: event('done #88'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, prToken: 'pat', log: vi.fn() });
    expect(out).toMatchObject({ acted: true, number: 88, prUrl: 'https://github.com/o/r/pull/501' });
    const open = readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8');
    expect(open).not.toContain('## #88');
    expect(open).toContain('## #87');
    expect(open).toContain('**2 open.**');
    const done = readFileSync(path.join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8');
    expect(done).toMatch(/- #88 · 2026-09-30 · done · Store the login — "status page https:\/\/github.com\/o\/r\/issues\/50#issuecomment-999 — owner said done" · by status page/);
    const verbs = h.calls.map((c) => c.slice(0, 3).join(' '));
    expect(verbs).toEqual(['gh pr list', 'git checkout -b', 'git add HUMAN-ACTIONS.md', 'git commit -m', 'git push -u', 'gh pr create', 'gh pr merge']);
    expect(h.calls[1][3]).toBe('status-page/ha-close-88-999');
    const create = h.calls.find((c) => c[1] === 'pr' && c[2] === 'create')!;
    expect(create[create.indexOf('--title') + 1]).toBe('Close HA #88 — owner replied on the status page');
    expect(h.calls.find((c) => c[2] === 'merge')).toContain('--auto');
    expect(h.run.mock.calls.find(([, a]) => (a as string[])[0] === 'pr' && (a as string[])[1] === 'create')![2]).toEqual({ env: { GH_TOKEN: 'pat' } });
    expect(h.replies).toHaveLength(1);
    expect(h.replies[0]).toContain('#88 marked done');
    expect(h.replies[0]).toContain('https://github.com/o/r/pull/501');
  });

  it('decide #N <choice> records the choice in the ledger', async () => {
    const root = repoDir();
    const h = harness();
    await handleComment({ event: event('decide #87 route'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    const done = readFileSync(path.join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8');
    expect(done).toContain("owner decided 'route'");
    expect(h.replies[0]).toContain('Decision recorded on #87: `route`');
  });

  it('refuses an item that is not open, without touching git', async () => {
    const h = harness();
    const out = await handleComment({ event: event('done #4'), root: repoDir(), run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out).toMatchObject({ acted: false, reason: 'not open' });
    expect(h.run).not.toHaveBeenCalled();
    expect(h.replies[0]).toContain("#4 isn't open");
  });

  it('answers a wrong-shaped command with the right syntax and closes nothing', async () => {
    const root = repoDir();
    const h = harness();
    await handleComment({ event: event('done #87'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    await handleComment({ event: event('decide #87 maybe'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(h.replies[0]).toContain('decide #87 <choice>');
    expect(h.replies[1]).toContain('isn\'t one of the options');
    expect(h.run).not.toHaveBeenCalled();
    expect(readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8')).toContain('## #87');
  });

  it('reports a failed close and flags the run failed', async () => {
    const h = harness();
    h.run.mockImplementation((cmd: string, args: string[]) => { if (cmd === 'git' && args[0] === 'push') throw new Error('remote: denied\nsecret detail'); return ''; });
    const log = vi.fn();
    const out = await handleComment({ event: event('done #88'), root: repoDir(), run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log });
    expect(out).toMatchObject({ acted: false, failed: true });
    expect(h.replies[0]).toContain("Couldn't close #88 automatically");
    expect(h.replies[0]).not.toContain('secret detail');
  });

  it('keeps the PR but says so when auto-merge is refused', async () => {
    const h = harness();
    h.run.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'gh' && args[1] === 'merge') throw new Error('auto-merge not allowed');
      return cmd === 'gh' && args[1] === 'create' ? 'https://github.com/o/r/pull/9\n' : '';
    });
    const out = await handleComment({ event: event('done #88'), root: repoDir(), run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out.acted).toBe(true);
    expect(h.replies[0]).toContain('merge it by hand');
  });
});

describe('handleComment — skip and duplicate closes', () => {
  it('a skip/defer choice closes the item as skipped', async () => {
    for (const text of ['decide #87 skip', 'decide #70 defer later', 'decide #70 SKIP not needed now']) {
      const root = repoDir();
      const h = harness();
      await handleComment({ event: event(text), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
      const done = readFileSync(path.join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8');
      expect(done, text).toMatch(/- #(87|70) · 2026-09-30 · skip · /);
      expect(h.replies[0], text).toContain('closed as skipped');
    }
  });
  it('maps choices to outcomes: only skip/defer skip, and skip is legal even when not an option', () => {
    const [, optioned, freeform] = parseHaEntries(OPEN);
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'accept' })).toMatchObject({ ok: true, outcome: 'done' });
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'skip' })).toMatchObject({ ok: true, choice: 'skip', outcome: 'skip' });
    expect(checkCommand(freeform, { kind: 'decide', number: 70, text: 'deferred until next month' })).toMatchObject({ outcome: 'done' });
    expect(checkCommand(freeform, { kind: 'decide', number: 70, text: 'defer it' })).toMatchObject({ outcome: 'skip' });
  });
  it('does not open a second closing PR while one for the same item is open', async () => {
    const root = repoDir();
    const h = harness();
    h.run.mockImplementation((cmd: string, args: string[]) => (cmd === 'gh' && args[1] === 'list' ? JSON.stringify([{ headRefName: 'status-page/ha-close-88-111' }]) : ''));
    const out = await handleComment({ event: event('done #88'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out).toMatchObject({ acted: false, reason: 'closing pr already open' });
    expect(h.run).toHaveBeenCalledTimes(1);
    expect(h.replies[0]).toContain('already open');
    expect(readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8')).toContain('## #88');
    const other = harness();
    other.run.mockImplementation((cmd: string, args: string[]) => (cmd === 'gh' && args[1] === 'list' ? JSON.stringify([{ headRefName: 'status-page/ha-close-87-5' }, { headRefName: 'feat/x' }]) : ''));
    const out2 = await handleComment({ event: event('done #88'), root: repoDir(), run: other.run, reply: other.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out2.acted).toBe(true);
  });
});
