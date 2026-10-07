import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { ackMarker, ackedIds, sweepOwnerComments, unacknowledged } from './status-sweep.mjs';

const owner = (id: number, body = 'hello') => ({ id, body, author_association: 'OWNER', user: { login: 'sffan15-sys', type: 'User' } });
const stranger = (id: number) => ({ id, body: 'done #5', author_association: 'NONE', user: { login: 'someone', type: 'User' } });
const ack = (id: number, login = 'github-actions[bot]') => ({ id: 9000 + id, body: `👀 Passed to Marjorie.\n\n${ackMarker(id)}`, author_association: 'NONE', user: { login, type: 'Bot' } });
const ids = (list: Array<{ id: number }>) => list.map((c) => c.id);

describe('unacknowledged', () => {
  it('a burst: every owner comment since the last ack is owed an answer, oldest first', () => {
    const thread = [owner(1), ack(1), owner(2), owner(3), owner(4)];
    expect(ids(unacknowledged(thread, owner(4)))).toEqual([2, 3, 4]);
  });

  it('answers what an earlier run already answered only once', () => {
    const thread = [owner(1), ack(1), owner(2), ack(2), owner(3), ack(3)];
    expect(unacknowledged(thread, owner(3))).toEqual([]);
  });

  it('the middle comment a dropped run would have lost is picked up by the next run', () => {
    // runs for #2 was cancelled; the run for #3 sees both #2 and #3 unacknowledged
    const thread = [owner(1), ack(1), owner(2), owner(3)];
    expect(ids(unacknowledged(thread, owner(3)))).toEqual([2, 3]);
  });

  it('never replays history from before the marker existed: with no acks, only the triggering comment', () => {
    const thread = [owner(1, 'old question'), owner(2, 'old done #3'), owner(3, 'new')];
    expect(ids(unacknowledged(thread, owner(3)))).toEqual([3]);
  });

  it('includes the trigger when the comment list lags it, and skips it once acknowledged', () => {
    expect(ids(unacknowledged([owner(1), ack(1)], owner(2)))).toEqual([2]);
    expect(unacknowledged([owner(1), ack(1)], owner(1))).toEqual([]);
  });

  it('only the owner is ever answered: strangers and bots are skipped, forged acks are not trusted', () => {
    const forged = ack(2, 'someone');
    const thread = [owner(1), ack(1), stranger(2), forged, owner(3)];
    expect(ids(unacknowledged(thread, owner(3)))).toEqual([3]);
    expect(ackedIds([forged]).size).toBe(0);
    expect(ackedIds([ack(5)]).has(5)).toBe(true);
  });
});

describe('sweepOwnerComments', () => {
  function harness(handler?: (c: { id: number }) => Promise<{ acted: boolean; reason?: string; failed?: boolean }>) {
    const posted: string[] = [];
    const calls: string[][] = [];
    const reply = vi.fn(async (text: string) => { posted.push(text); });
    const run = vi.fn((cmd: string, args: string[]) => { calls.push([cmd, ...args]); return ''; });
    const handle = vi.fn(async (event: { comment: { id: number } }, replyFn: (t: string) => Promise<void>) => {
      const result = handler ? await handler(event.comment) : { acted: false, reason: 'relayed to marjorie' };
      await replyFn(`answer to ${event.comment.id}`);
      return result;
    });
    return { posted, calls, reply, run, handle };
  }
  const event = { action: 'created', issue: { number: 50, labels: [{ name: 'status-page' }] }, comment: owner(4) };

  it('processes ALL unacknowledged owner comments in order, acknowledging each, from main each time', async () => {
    const h = harness();
    const comments = [owner(1), ack(1), owner(2), owner(3), owner(4)];
    const results = await sweepOwnerComments({ event, comments, handle: h.handle, reply: h.reply, run: h.run, log: () => {} });
    expect(results.map((r: { commentId: number }) => r.commentId)).toEqual([2, 3, 4]);
    expect(h.posted).toEqual([2, 3, 4].map((id) => `answer to ${id}\n\n${ackMarker(id)}`));
    expect(h.calls.filter((c) => c[0] === 'git')).toHaveLength(3);
    expect(h.calls[0]).toEqual(['git', 'checkout', '--force', '--quiet', 'main']);
  });

  it('is idempotent: a second sweep over the thread it just produced does nothing', async () => {
    const h = harness();
    const first = [owner(1), ack(1), owner(2), owner(3)];
    await sweepOwnerComments({ event: { ...event, comment: owner(3) }, comments: first, handle: h.handle, reply: h.reply, run: h.run, log: () => {} });
    const after = [...first, ...[2, 3].map((i) => ack(i))];
    const h2 = harness();
    const again = await sweepOwnerComments({ event: { ...event, comment: owner(3) }, comments: after, handle: h2.handle, reply: h2.reply, run: h2.run, log: () => {} });
    expect(again).toEqual([]);
    expect(h2.handle).not.toHaveBeenCalled();
  });

  it('a handler that throws still leaves a failed-ack, so later acks cannot bury the comment', async () => {
    const h = harness(async (c) => { if (c.id === 2) throw new Error('gh exploded'); return { acted: false, reason: 'ok' }; });
    h.handle.mockImplementationOnce(async () => { throw new Error('gh exploded'); });
    const comments = [owner(1), ack(1), owner(2), owner(3)];
    const results = await sweepOwnerComments({ event: { ...event, comment: owner(3) }, comments, handle: h.handle, reply: h.reply, run: h.run, log: () => {} });
    expect(results[0]).toMatchObject({ commentId: 2, failed: true, reason: 'threw' });
    expect(h.posted[0]).toContain(ackMarker(2));
    expect(results[1].commentId).toBe(3);
  });

  it('stops (rather than skip past) when not even the failed-ack can be posted', async () => {
    const h = harness();
    h.handle.mockImplementation(async () => { throw new Error('gh down'); });
    h.reply.mockImplementation(async () => { throw new Error('gh down'); });
    const results = await sweepOwnerComments({ event: { ...event, comment: owner(3) }, comments: [owner(1), ack(1), owner(2), owner(3)], handle: h.handle, reply: h.reply, run: h.run, log: () => {} });
    expect(results.map((r: { commentId: number }) => r.commentId)).toEqual([2]);
  });

  it('keeps going when switching back to main fails', async () => {
    const h = harness();
    h.run.mockImplementation(() => { throw new Error('dirty tree'); });
    const out = await sweepOwnerComments({ event, comments: [], handle: h.handle, reply: h.reply, run: h.run, log: () => {} });
    expect(out).toHaveLength(1);
  });
});
