import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { REPLY_CAP, composePost, finish, postCmd, save, startThread, thread, threadName, turnLog } from './chat-post.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

const MARJ = '900000000000000010';
const THREAD = '900000000000000030';
const MID = '1000000000000000009';
const HOOK = 'https://discord.com/api/webhooks/1/secret';
const RUN = 'https://github.com/JW-Incorporated/swift2/actions/runs/1';

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

const sleepImpl = vi.fn().mockResolvedValue(undefined);
const tmp = () => mkdtempSync(join(tmpdir(), 'chat-post-'));

function ctxFile(dir: string, over: Record<string, unknown> = {}) {
  const file = join(dir, 'ctx.json');
  writeFileSync(file, JSON.stringify({ bot: 'marjorie', channel_id: MARJ, thread_id: '', top_level: true, message_id: MID, url: `https://discord.com/channels/1/${MARJ}/${MID}`, text: 'what is your job?', already: null, ...over }));
  return file;
}

function recorder(routes: Record<string, unknown> = {}) {
  const log: Array<{ key: string; body: any }> = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push({ key, body: init.body ? JSON.parse(init.body) : null });
    return key in routes ? routes[key] : res(200, { id: '5' });
  });
  return { fetchImpl, log };
}

describe('save', () => {
  it('writes the reply from stdin and a one-line summary', () => {
    const dir = tmp();
    expect(save({ dir, summary: 'closed\nHA #70' }, { readStdin: () => 'Hi **Joey**\n' })).toBe(0);
    expect(readFileSync(join(dir, 'chat-reply.md'), 'utf8')).toBe('Hi **Joey**\n');
    expect(readFileSync(join(dir, 'chat-summary.txt'), 'utf8')).toBe('closed HA #70\n');
  });

  it('refuses an empty reply', () => {
    const dir = tmp();
    expect(save({ dir }, { readStdin: () => '  \n' })).toBe(1);
    expect(existsSync(join(dir, 'chat-reply.md'))).toBe(false);
  });
});

describe('thread', () => {
  const ctx = { bot: 'marjorie', channel_id: MARJ, message_id: MID, top_level: true, thread_id: '', text: 'what is your job?' };

  it('starts a named thread on a top-level message', async () => {
    const { fetchImpl, log } = recorder({ [`POST ${DISCORD_API}/channels/${MARJ}/messages/${MID}/threads`]: res(201, { id: MID }) });
    expect(await startThread({ ctx, token: 't', fetchImpl, sleepImpl })).toMatchObject({ threadId: MID });
    expect(log[0].body).toEqual({ name: threadName('marjorie', ctx.text), auto_archive_duration: 1440 });
    expect(threadName('marjorie', ctx.text)).toBe('Marjorie · what is your job?');
  });

  it('uses the thread it is already in, and the message id when a thread already exists', async () => {
    const none = recorder();
    expect(await startThread({ ctx: { ...ctx, top_level: false, thread_id: THREAD }, token: 't', fetchImpl: none.fetchImpl, sleepImpl })).toMatchObject({ threadId: THREAD });
    expect(none.fetchImpl).not.toHaveBeenCalled();
    const exists = recorder({ [`POST ${DISCORD_API}/channels/${MARJ}/messages/${MID}/threads`]: res(400, { code: 160004 }) });
    expect(await startThread({ ctx, token: 't', fetchImpl: exists.fetchImpl, sleepImpl })).toMatchObject({ threadId: MID });
  });

  it('falls back to top level when Discord refuses the thread', async () => {
    const { fetchImpl } = recorder({ [`POST ${DISCORD_API}/channels/${MARJ}/messages/${MID}/threads`]: res(403, { code: 50013 }) });
    expect(await startThread({ ctx, token: 't', fetchImpl, sleepImpl })).toMatchObject({ threadId: '' });
  });

  it('marks a duplicate run skip=true without calling Discord', async () => {
    const dir = tmp();
    const out = join(dir, 'gh-output');
    const { fetchImpl } = recorder();
    expect(await thread({ context: ctxFile(dir, { already: 'replied' }) }, { env: { GITHUB_OUTPUT: out }, fetchImpl, sleepImpl })).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('skip=true');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('composePost', () => {
  it('posts [chat failed] with the run link when there is no reply', () => {
    expect(composePost({ reply: '', runUrl: RUN, messageUrl: 'm', threadId: THREAD })).toEqual({ result: 'failed-posted', text: `[chat failed] ${RUN}` });
  });

  it('cuts a long reply to the cap with a link to the run, and links the ask at top level', () => {
    const { text } = composePost({ reply: 'x'.repeat(5000), runUrl: RUN, messageUrl: '', threadId: THREAD });
    expect(text.length).toBeLessThanOrEqual(REPLY_CAP);
    expect(text).toContain(`…\n(cut to fit Discord; the full reply is in ${RUN})`);
    expect(composePost({ reply: 'hi', runUrl: RUN, messageUrl: 'https://discord.com/channels/1/2/3', threadId: '' }).text).toBe('↪ https://discord.com/channels/1/2/3\nhi');
  });
});

describe('postCmd', () => {
  it('posts the reply into the thread as the bot, result=replied', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-reply.md'), 'My job: the site runs.\n');
    const out = join(dir, 'gh-output');
    const { fetchImpl, log } = recorder();
    const flags = { bot: 'marjorie', context: ctxFile(dir), 'reply-dir': dir, 'thread-id': MID, 'run-url': RUN };
    expect(await postCmd(flags, { env: { DISCORD_MARJORIE_WEBHOOK_URL: HOOK, GITHUB_OUTPUT: out }, fetchImpl })).toBe(0);
    expect(log[0].key).toBe(`POST ${HOOK}?wait=true&thread_id=${MID}`);
    expect(log[0].body).toMatchObject({ content: 'My job: the site runs.', username: 'Marjorie' });
    expect(readFileSync(out, 'utf8')).toContain('result=replied');
  });

  it('reports post-error when the webhook is missing', async () => {
    const dir = tmp();
    const out = join(dir, 'gh-output');
    expect(await postCmd({ bot: 'tree', context: ctxFile(dir), 'reply-dir': dir }, { env: { GITHUB_OUTPUT: out }, fetchImpl: vi.fn() })).toBe(1);
    expect(readFileSync(out, 'utf8')).toContain('result=post-error');
  });
});

describe('finish', () => {
  const eyes = (emoji: string) => `PUT ${DISCORD_API}/channels/${MARJ}/messages/${MID}/reactions/${encodeURIComponent(emoji)}/@me`;
  const gh = () => vi.fn((_cmd: string, args: string[]) => (args[1] === 'list' ? JSON.stringify([{ number: 42 }]) : ''));
  const base = (dir: string, result: string) => ({ bot: 'marjorie', 'message-id': MID, 'channel-id': MARJ, 'source-thread-id': '', 'thread-id': MID, 'post-result': result, context: ctxFile(dir), 'reply-dir': dir, 'run-url': RUN });

  it('replied → ✅ and a turn-log comment carrying the chat id; no bot post', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-summary.txt'), 'answered from the charter\n');
    const { fetchImpl, log } = recorder({ [eyes('✅')]: res(204) });
    const execImpl = gh();
    expect(await finish(base(dir, 'replied'), { env: { REPO: 'o/r' }, fetchImpl, sleepImpl, execImpl })).toBe(0);
    expect(log.map((l) => l.key)).toEqual([eyes('✅')]);
    const body = execImpl.mock.calls[1][1];
    expect(body.slice(0, 5)).toEqual(['issue', 'comment', '42', '--repo', 'o/r']);
    expect(body[6]).toBe(`💬 chat: #longlive-marjorie — what is your job? → answered from the charter\n\n<!-- chat-id: ${MID} -->`);
  });

  it('post died → ❌, then [chat failed] with the bot token in the reply thread', async () => {
    const dir = tmp();
    const { fetchImpl, log } = recorder({ [eyes('❌')]: res(204) });
    expect(await finish(base(dir, ''), { env: {}, fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
    expect(log[0].key).toBe(eyes('❌'));
    expect(log[1]).toMatchObject({ key: `POST ${DISCORD_API}/channels/${MID}/messages`, body: { content: `[chat failed] ${RUN}` } });
  });

  it('failed-posted → ❌ only, since post already said [chat failed]', async () => {
    const dir = tmp();
    const { fetchImpl, log } = recorder({ [eyes('❌')]: res(204) });
    expect(await finish(base(dir, 'failed-posted'), { env: {}, fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
    expect(log.map((l) => l.key)).toEqual([eyes('❌')]);
  });
});

describe('turnLog', () => {
  it('neither pings nor forges a marker', () => {
    const line = turnLog({ bot: 'tree', text: '@everyone <!-- chat-id: 1 -->', summary: '', replied: false, messageId: MID });
    expect(line).toContain('@​everyone');
    expect(line).toContain('&lt;!-- chat-id: 1 -->');
    expect(line.endsWith(`<!-- chat-id: ${MID} -->`)).toBe(true);
    expect(line).toContain('#longlive-tree');
  });
});
