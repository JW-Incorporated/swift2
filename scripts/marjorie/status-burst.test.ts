// The status-reply job end to end with the real handler: a burst of owner
// comments, of which a concurrency group would have kept only the first and the
// last (W7 follow-up from the W4 review), and a decision that must reach the
// tickets it is about.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { handleComment } from './lib/status-reply.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { ackMarker, sweepOwnerComments } from './lib/status-sweep.mjs';

const OPEN = `# Human actions

<!-- ha-format: 2 -->

> **2 open.** Closed items are in \`HUMAN-ACTIONS-DONE.md\`.

## #88 🔴 [BLOCKING] Store the login (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** Needs the owner.
**Steps:**
1. Do it.
**Worked if:** done.

## #87 🟡 [DECIDE] Pick a budget (~5 min)
<!-- ha filed=2026-09-29 -->

**Why:** The alert in #4180 fires daily and PR #4220 waits on it; see https://github.com/o/r/issues/4301.
**Steps:**
1. Decide: \`accept\` — raise it; \`route\` — send it to a desk.
**Worked if:** recorded.
`;
const DONE = '# Closed\n\n- #1 · 2026-09-01 · done · Old thing — "ok" · by chat\n';

const dirs: string[] = [];
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });
function root() {
  const dir = mkdtempSync(path.join(tmpdir(), 'status-burst-'));
  dirs.push(dir);
  writeFileSync(path.join(dir, 'HUMAN-ACTIONS.md'), OPEN);
  writeFileSync(path.join(dir, 'HUMAN-ACTIONS-DONE.md'), DONE);
  return dir;
}
const owner = (id: number, body: string) => ({ id, body, html_url: `https://github.com/o/r/issues/50#issuecomment-${id}`, author_association: 'OWNER', user: { login: 'sffan15-sys', type: 'User' } });
const bot = (id: number, body: string) => ({ id: 9000 + id, body, user: { login: 'github-actions[bot]', type: 'Bot' }, author_association: 'NONE' });
const issue = { number: 50, labels: [{ name: 'status-page' }] };

function env(threadComments: Record<number, unknown[]> = {}) {
  const calls: string[][] = [];
  const replies: string[] = [];
  const run = vi.fn((cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') return 'https://github.com/o/r/pull/501\n';
    if (cmd === 'gh' && args[0] === 'api') return JSON.stringify(threadComments[Number(/issues\/(\d+)\/comments/.exec(args[1])?.[1])] || []);
    return '';
  });
  const reply = async (t: string) => { replies.push(t); };
  return { calls, replies, run, reply };
}
const sweep = (e: ReturnType<typeof env>, dir: string, comments: unknown[], trigger: ReturnType<typeof owner>) =>
  sweepOwnerComments({
    event: { action: 'created', issue, comment: trigger },
    comments,
    handle: (ev: unknown, ack: (t: string) => Promise<void>) => handleComment({ event: ev, root: dir, run: e.run, reply: ack, repo: 'o/r', now: new Date('2026-09-30T20:00:00Z'), log: vi.fn() }),
    reply: e.reply,
    run: e.run,
    log: () => {},
  });

describe('a burst of owner comments', () => {
  it('answers every one when only the last run survives the concurrency group', async () => {
    const dir = root();
    const e = env();
    const thread = [owner(1, 'earlier'), bot(1, `seen ${ackMarker(1)}`), owner(2, 'what is the plan for Friday?'), owner(3, 'done #88'), owner(4, 'and the shop links?')];
    const results = await sweep(e, dir, thread, owner(4, 'and the shop links?'));
    expect(results.map((r: { commentId: number }) => r.commentId)).toEqual([2, 3, 4]);
    const dispatched = e.calls.filter((c) => c[0] === 'gh' && c[1] === 'workflow').map((c) => c[c.length - 1]);
    expect(dispatched).toEqual(['comment_id=2', 'comment_id=4']);
    expect(e.calls.some((c) => c[0] === 'gh' && c[1] === 'pr' && c[2] === 'create')).toBe(true);
    expect(e.replies).toHaveLength(3);
    for (const [i, id] of [2, 3, 4].entries()) expect(e.replies[i]).toContain(ackMarker(id));
  });

  it('a second pass over the answered thread does nothing — no duplicate relay, no second PR', async () => {
    const dir = root();
    const first = env();
    const thread = [owner(2, 'question one'), owner(3, 'question two')];
    // no acks yet and the run was woken by #3: only #3 is owed; then #2 would be lost by a drop,
    // so the realistic burst has an earlier ack as its baseline.
    const withBaseline = [bot(1, ackMarker(1)), ...thread];
    await sweep(first, dir, withBaseline, thread[1]);
    const answered = [...withBaseline, ...first.replies.map((text, i) => bot(i + 2, text))];
    const second = env();
    expect(await sweep(second, dir, answered, thread[1])).toEqual([]);
    expect(second.calls.filter((c) => c[0] === 'gh' && c[1] === 'workflow')).toEqual([]);
  });
});

describe('decide #N reaches the tickets the item names', () => {
  it('comments the decision on each referenced issue and PR, once, with the status-page link', async () => {
    const dir = root();
    const e = env();
    await sweep(e, dir, [bot(1, ackMarker(1))], owner(5, 'decide #87 route'));
    const comments = e.calls.filter((c) => c[0] === 'gh' && c[1] === 'issue' && c[2] === 'comment' && c[3] !== '50');
    expect(comments.map((c) => c[3])).toEqual(['4180', '4220', '4301']);
    const body = comments[0][comments[0].indexOf('--body') + 1];
    expect(body).toContain('decided on human action #87');
    expect(body).toContain("`route`");
    expect(body).toContain('https://github.com/o/r/issues/50#issuecomment-5');
    expect(body).toContain('<!-- decision-propagated: HA-87 -->');
  });

  it('does not comment again where the marker is already present', async () => {
    const dir = root();
    const e = env({ 4180: [bot(1, '<!-- decision-propagated: HA-87 -->')] });
    await sweep(e, dir, [bot(1, ackMarker(1))], owner(5, 'decide #87 route'));
    const targets = e.calls.filter((c) => c[0] === 'gh' && c[1] === 'issue' && c[2] === 'comment' && c[3] !== '50').map((c) => c[3]);
    expect(targets).toEqual(['4220', '4301']);
  });

  it('a done reply propagates nothing', async () => {
    const dir = root();
    const e = env();
    await sweep(e, dir, [bot(1, ackMarker(1))], owner(5, 'done #88'));
    expect(e.calls.some((c) => c[0] === 'gh' && c[1] === 'issue' && c[3] === '4180')).toBe(false);
  });
});
