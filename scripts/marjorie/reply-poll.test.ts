import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { main } from './reply-poll.mjs';

const THREAD_ID = '1111111111111111111';

function fakeResponse(status: number, body: unknown = []) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function fakeSleep() {
  return vi.fn().mockResolvedValue(undefined);
}

const issueListOut = JSON.stringify([{ number: 42 }]);

// Mirrors `gh api --paginate --slurp`'s real shape: one JSON array of
// pages, each page the raw array of comment objects GitHub sent. A single
// call here is a single (unpaginated) page.
function commentsOut(bodies: string[]) {
  return JSON.stringify([bodies.map((body) => ({ body }))]);
}

function commentsPagesOut(pages: string[][]) {
  return JSON.stringify(pages.map((bodies) => bodies.map((body) => ({ body }))));
}

const markerComment = `<!-- discord-message-id: ${THREAD_ID} -->`;
const rootMessage = { id: THREAD_ID, webhook_id: '999', content: 'the brief', timestamp: '2026-09-12T12:00:00.000Z' };

describe('main()', () => {
  it('excludes the thread root/webhook message and relays a new reply', async () => {
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment]))
      .mockReturnValueOnce('');
    const reply = { id: '2222222222222222222', author: { username: 'joeyfounder', global_name: 'Joey' }, content: 'sounds good', timestamp: '2026-09-12T13:00:00.000Z' };
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, [rootMessage, reply]));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl, repo: 'JW-Incorporated/swift2' });

    expect(exitCode).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(3);
    const postArgs = execImpl.mock.calls[2];
    expect(postArgs[0]).toBe('gh');
    expect(postArgs[1]).toEqual(['issue', 'comment', '42', '--repo', 'JW-Incorporated/swift2', '--body', expect.stringContaining('💬 Reply from Joey')]);
    expect(postArgs[1][6]).toContain('<!-- relay-id: 2222222222222222222 -->');
  });

  it('does not re-post a reply whose relay-id marker already exists as a comment', async () => {
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment, '<!-- relay-id: 2222222222222222222 -->']));
    const reply = { id: '2222222222222222222', author: { username: 'joeyfounder' }, content: 'sounds good', timestamp: '2026-09-12T13:00:00.000Z' };
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, [rootMessage, reply]));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(2);
  });

  it('retries once on a 429 with retry_after, then relays the reply', async () => {
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment]))
      .mockReturnValueOnce('');
    const reply = { id: '3333333333333333333', author: { username: 'joeyfounder' }, content: 'ok', timestamp: '2026-09-12T13:00:00.000Z' };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(429, { retry_after: 1 }))
      .mockResolvedValueOnce(fakeResponse(200, [rootMessage, reply]));
    const sleepImpl = fakeSleep();

    const exitCode = await main({ fetchImpl, sleepImpl, execImpl });

    expect(exitCode).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(execImpl).toHaveBeenCalledTimes(3);
  });

  it('treats a 404 (no thread yet) as a graceful no-op, not a crash', async () => {
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment]));
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(404));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(2);
  });

  it('is a no-op when no open founders-brief issue exists', async () => {
    const execImpl = vi.fn().mockReturnValueOnce(JSON.stringify([]));
    const fetchImpl = vi.fn();

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('is a no-op when the issue has no discord-message-id marker yet', async () => {
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([]));
    const fetchImpl = vi.fn();

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('finds a relay-id marker sitting past the first page of comments', async () => {
    const fillerBodies = Array.from({ length: 29 }, (_, i) => `filler comment ${i}`);
    const page1 = [markerComment, ...fillerBodies];
    const page2 = ['<!-- relay-id: 2222222222222222222 -->'];
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsPagesOut([page1, page2]));
    const reply = { id: '2222222222222222222', author: { username: 'joeyfounder' }, content: 'sounds good', timestamp: '2026-09-12T13:00:00.000Z' };
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, [rootMessage, reply]));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(2);
    // Codex round-2 (PR #4217): this test previously only exercised the
    // flattening/dedup logic against a pre-shaped mock, so removing the
    // actual `--paginate --slurp` flags from the real `gh api` call would
    // still have passed it. Assert the flags are really on the request.
    const commentsCallArgs = execImpl.mock.calls[1][1];
    expect(commentsCallArgs).toContain('--paginate');
    expect(commentsCallArgs).toContain('--slurp');
  });

  it('excludes an ordinary bot-authored message from relay', async () => {
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment]));
    const botMessage = { id: '4444444444444444444', author: { bot: true, username: 'somebot' }, content: 'automated notice', timestamp: '2026-09-12T13:00:00.000Z' };
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, [rootMessage, botMessage]));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(2);
  });

  it('dedupes by the trailing marker, not a fake one embedded earlier in reply content', async () => {
    const fakeId = '999999999999999999';
    const realId = '5555555555555555555';
    const priorRelayComment = `\u{1F4AC} Reply from Joey\n\nsee also <!-- relay-id: ${fakeId} -->\n\n<!-- relay-id: ${realId} -->`;
    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment, priorRelayComment]))
      .mockReturnValueOnce('');
    const alreadyRelayed = { id: realId, author: { username: 'joeyfounder' }, content: 'see also fake marker', timestamp: '2026-09-12T13:00:00.000Z' };
    const newReply = { id: fakeId, author: { username: 'joeyfounder' }, content: 'a genuinely new reply', timestamp: '2026-09-12T13:05:00.000Z' };
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, [rootMessage, alreadyRelayed, newReply]));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(3);
    const postArgs = execImpl.mock.calls[2];
    expect(postArgs[1][6]).toContain(`<!-- relay-id: ${fakeId} -->`);
  });

  it('paginates backward past 100 messages to find an older un-relayed reply', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: `p1-${i}`,
      author: { bot: true, username: 'somebot' },
      content: 'filler',
      timestamp: '2026-09-12T14:00:00.000Z',
    }));
    const oldReply = { id: '6666666666666666666', author: { username: 'joeyfounder' }, content: 'an older reply', timestamp: '2026-09-12T11:00:00.000Z' };
    const page2 = [rootMessage, oldReply];

    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment]))
      .mockReturnValueOnce('');
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(200, page1))
      .mockResolvedValueOnce(fakeResponse(200, page2));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][0]).toContain('before=p1-99');
    expect(execImpl).toHaveBeenCalledTimes(3);
    const postArgs = execImpl.mock.calls[2];
    expect(postArgs[1][6]).toContain('<!-- relay-id: 6666666666666666666 -->');
  });

  it('does not stop early just because a full page\'s oldest message was already relayed (Codex round-2, PR #4217)', async () => {
    // Simulates a same-millisecond ordering tie: the page's oldest entry
    // is already-relayed, but an unrelayed reply still sits further back.
    // The old stop-on-relayed-oldest shortcut would have ended pagination
    // here, permanently burying `olderUnrelayed` once enough newer
    // messages accumulated.
    const alreadyRelayedOldest = { id: '7777777777777777777', author: { username: 'joeyfounder' }, content: 'already handled', timestamp: '2026-09-12T14:00:00.000Z' };
    const page1 = [
      ...Array.from({ length: 99 }, (_, i) => ({
        id: `p1-${i}`,
        author: { bot: true, username: 'somebot' },
        content: 'filler',
        timestamp: '2026-09-12T14:00:00.000Z',
      })),
      alreadyRelayedOldest,
    ];
    const olderUnrelayed = { id: '8888888888888888888', author: { username: 'joeyfounder' }, content: 'still not relayed', timestamp: '2026-09-12T10:00:00.000Z' };
    const page2 = [rootMessage, olderUnrelayed];

    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment, '<!-- relay-id: 7777777777777777777 -->']))
      .mockReturnValueOnce('');
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(200, page1))
      .mockResolvedValueOnce(fakeResponse(200, page2));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(execImpl).toHaveBeenCalledTimes(3);
    const postArgs = execImpl.mock.calls[2];
    expect(postArgs[1][6]).toContain('<!-- relay-id: 8888888888888888888 -->');
  });

  it('stops paginating once a full page\'s oldest message is the thread root', async () => {
    const filler = Array.from({ length: 99 }, (_, i) => ({
      id: `p1-${i}`,
      author: { bot: true, username: 'somebot' },
      content: 'filler',
      timestamp: '2026-09-12T14:00:00.000Z',
    }));
    const page1 = [...filler, rootMessage];

    const execImpl = vi.fn()
      .mockReturnValueOnce(issueListOut)
      .mockReturnValueOnce(commentsOut([markerComment]));
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, page1));

    const exitCode = await main({ fetchImpl, sleepImpl: fakeSleep(), execImpl });

    expect(exitCode).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(execImpl).toHaveBeenCalledTimes(2);
  });
});
