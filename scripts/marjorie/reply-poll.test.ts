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

function commentsOut(bodies: string[]) {
  return JSON.stringify(bodies);
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
});
