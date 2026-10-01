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
  it('reads skip and close with their reasons', () => {
    expect(parseCommand('skip #91 not now, revisit in Q4')).toEqual({ kind: 'skip', number: 91, text: 'not now, revisit in Q4' });
    expect(parseCommand('Close #85 wrong question, not a founder call')).toEqual({ kind: 'close', number: 85, text: 'wrong question, not a founder call' });
    expect(parseCommand('close #85')).toEqual({ kind: 'close', number: 85, text: '' });
  });
  it('ignores everything else', () => {
    for (const body of ['', 'done', 'done 88 please', 'thanks!', 'I will do #88 done', 'please decide #87 accept', 'redone #5', 'close the loop', 'skip it']) {
      expect(parseCommand(body)).toBeNull();
    }
  });
});

describe('checkCommand', () => {
  const items = parseHaEntries(OPEN);
  const [blocking, optioned, freeform] = items;
  it('accepts done, skip and close on any item, task or decision', () => {
    for (const item of [blocking, optioned, freeform]) {
      expect(checkCommand(item, { kind: 'done', number: item.number, text: '' })).toMatchObject({ ok: true, choice: '', outcome: 'done', verb: 'done' });
      expect(checkCommand(item, { kind: 'skip', number: item.number, text: 'later' })).toMatchObject({ ok: true, choice: 'later', outcome: 'skip', verb: 'skipped' });
      expect(checkCommand(item, { kind: 'close', number: item.number, text: 'wrong question' })).toMatchObject({ ok: true, choice: 'wrong question', outcome: 'done', verb: 'closed' });
    }
    expect(checkCommand(blocking, { kind: 'decide', number: 88, text: 'yes' })).toMatchObject({ ok: true, choice: 'yes', verb: 'decided' });
  });
  it('keeps a declared option (with trailing detail) and records anything else verbatim', () => {
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'ACCEPT' })).toMatchObject({ ok: true, choice: 'accept' });
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'route to austin' })).toMatchObject({ ok: true, choice: 'route — to austin' });
    expect(checkCommand(optioned, { kind: 'decide', number: 87, text: 'wrong question, not a founder call' })).toMatchObject({ ok: true, choice: 'wrong question, not a founder call', outcome: 'done' });
    const bare = checkCommand(optioned, { kind: 'decide', number: 87, text: '' });
    expect(bare.ok).toBe(false);
    expect(bare.message).toContain('`accept`, `route`');
    expect(bare.message).toContain('close #87 <why>');
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
  it('done #N closes the item through the rolling branch, PR and auto-merge, then acks', async () => {
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
    expect(verbs.map((v) => v.split(' ').slice(0, 2).join(' '))).toEqual(['git fetch', 'git fetch', 'gh pr', 'git checkout', 'git add', 'git commit', 'git rev-parse', 'git push', 'gh pr', 'gh pr']);
    expect(h.calls.find((c) => c[1] === 'checkout')).toEqual(['git', 'checkout', '--quiet', '-B', 'status-page/ha-closes', 'refs/remotes/origin/main']);
    expect(h.calls.find((c) => c[1] === 'push')!.slice(-2)).toEqual(['origin', 'HEAD:refs/heads/status-page/ha-closes']);
    const create = h.calls.find((c) => c[1] === 'pr' && c[2] === 'create')!;
    expect(create[create.indexOf('--title') + 1]).toBe('Close HA #88 — owner replied on the status page');
    expect(create[create.indexOf('--body') + 1]).toContain('<!-- ha-close {"n":88,"o":"done","d":"2026-09-30"');
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

  it('asks for the answer on a bare decide, and closes nothing', async () => {
    const root = repoDir();
    const h = harness();
    await handleComment({ event: event('decide #87'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(h.replies[0]).toContain('decide #87 <choice>');
    expect(h.replies[0]).toContain('close #87 <why>');
    expect(h.run).not.toHaveBeenCalled();
    expect(readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8')).toContain('## #87');
  });

  it('closes a decision with done, close <why>, skip, or an answer that is not an option (issue #4665)', async () => {
    const wrong = 'wrong question, not a founder call';
    for (const [text, ledger, ack] of [
      ['done #87', /- #87 · 2026-09-30 · done · .*owner said done" /, '#87 marked done'],
      [`close #87 ${wrong}`, new RegExp(`- #87 · 2026-09-30 · done · .*owner closed '${wrong}'`), `#87 closed: \`${wrong}\``],
      [`decide #87 ${wrong}`, new RegExp(`owner decided '${wrong}'`), `Decision recorded on #87: \`${wrong}\``],
      ['skip #87 not this quarter', /- #87 · 2026-09-30 · skip · .*owner skipped 'not this quarter'/, '#87 skipped: `not this quarter`'],
    ] as const) {
      const root = repoDir();
      const h = harness();
      const out = await handleComment({ event: event(text), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
      expect(out.acted, text).toBe(true);
      expect(readFileSync(path.join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8'), text).toMatch(ledger);
      expect(readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8'), text).not.toContain('## #87');
      expect(h.replies[0], text).toContain(ack);
    }
  });

  it('closes a task with skip too', async () => {
    const root = repoDir();
    const h = harness();
    expect((await handleComment({ event: event('skip #88 no longer needed'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() })).acted).toBe(true);
    expect(readFileSync(path.join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8')).toMatch(/- #88 · 2026-09-30 · skip · /);
  });

  it('reports a failed close and flags the run failed', async () => {
    const h = harness();
    h.run.mockImplementation((cmd: string, args: string[]) => { if (cmd === 'gh' && args[1] === 'create') throw new Error('GraphQL: denied\nsecret detail'); return ''; });
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
  it('does not queue a second close for an item a close PR already carries', async () => {
    const root = repoDir();
    const h = harness();
    const list = (rows: unknown[]) => (cmd: string, args: string[]) => (cmd === 'gh' && args[1] === 'list' ? JSON.stringify(rows) : '');
    const rolling = { number: 7, url: 'https://github.com/o/r/pull/7', title: 'Close HA #88 — owner replied on the status page', headRefName: 'status-page/ha-closes', isCrossRepository: false, body: '<!-- ha-close {"n":88,"o":"done","d":"2026-09-30","note":"status page x — owner said done","by":"status page","s":"done"} -->' };
    h.run.mockImplementation(list([rolling]));
    const out = await handleComment({ event: event('done #88'), root, run: h.run, reply: h.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out).toMatchObject({ acted: false, reason: 'closing pr already open' });
    expect(h.replies[0]).toContain('already queued');
    expect(h.replies[0]).toContain('pull/7');
    expect(h.calls.some((c) => c[1] === 'push' || c[1] === 'create')).toBe(false);
    const chat = harness();
    chat.run.mockImplementation(list([{ number: 8, url: 'https://github.com/o/r/pull/8', title: 'Close HA #88 — founder said done in chat', headRefName: 'marjorie/ha-close-88-5', isCrossRepository: false, body: '' }]));
    const out2 = await handleComment({ event: event('done #88'), root: repoDir(), run: chat.run, reply: chat.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out2).toMatchObject({ acted: false, reason: 'closing pr already open' });
    const other = harness();
    other.run.mockImplementation(list([{ ...rolling, body: rolling.body.replace('"n":88', '"n":87'), title: 'Close HA #87 — x' }]));
    const out3 = await handleComment({ event: event('done #88'), root: repoDir(), run: other.run, reply: other.reply, repo: 'o/r', now: NOW, log: vi.fn() });
    expect(out3.acted).toBe(true);
  });
});
