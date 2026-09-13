import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { chunkForDiscord, neutralizeMentions } from '../community/discord-delivery.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { REPLY_CAP, composePost, finish, postCmd, save, startThread, thread, threadName, turnLog } from './chat-post.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

const MARJ = '900000000000000010';
const THREAD = '900000000000000030';
const MID = '1000000000000000009';
const HOOK = 'https://discord.com/api/webhooks/1/secret';
const RUN = 'https://github.com/JW-Incorporated/swift2/actions/runs/1';
const REF_LINE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/; // social-approval-poll.mjs REF_LINE_RE
const REDDIT_REF_LINE = /^ref: reddit · (.+)$/;

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

const sleepImpl = vi.fn().mockResolvedValue(undefined);
const tmp = () => mkdtempSync(join(tmpdir(), 'chat-post-'));
const settled = { id: MID, reactions: [{ me: true, emoji: { name: '👀' } }, { me: true, emoji: { name: '✅' } }] };

function ctxFile(dir: string, over: Record<string, unknown> = {}) {
  const file = join(dir, 'ctx.json');
  writeFileSync(file, JSON.stringify({ bot: 'marjorie', channel_id: MARJ, thread_id: '', top_level: true, message_id: MID, url: `https://discord.com/channels/1/${MARJ}/${MID}`, text: 'what is your job?', already: null, ...over }));
  return file;
}

/** Unknown routes answer 200 `{ id: '5' }` — a message with no reactions. */
function recorder(routes: Record<string, unknown> = {}) {
  const log: Array<{ key: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push({ key, body: init.body ? JSON.parse(init.body) : null });
    const route = routes[key];
    if (route instanceof Error) throw route;
    return route ?? res(200, { id: '5' });
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
  const threads = `POST ${DISCORD_API}/channels/${MARJ}/messages/${MID}/threads`;

  it('starts a named thread on a top-level message', async () => {
    const { fetchImpl, log } = recorder({ [threads]: res(201, { id: MID }) });
    expect(await startThread({ ctx, token: 't', fetchImpl, sleepImpl })).toMatchObject({ threadId: MID });
    expect(log[0].body).toEqual({ name: 'Marjorie · what is your job?', auto_archive_duration: 1440 });
    expect(threadName('tree', 'x'.repeat(200)).length).toBeLessThanOrEqual(100);
  });

  it('uses the thread it is in, the message id when a thread exists, and top level when refused', async () => {
    const none = recorder();
    expect(await startThread({ ctx: { ...ctx, top_level: false, thread_id: THREAD }, token: 't', fetchImpl: none.fetchImpl, sleepImpl })).toMatchObject({ threadId: THREAD });
    expect(none.fetchImpl).not.toHaveBeenCalled();
    expect(await startThread({ ctx, token: 't', fetchImpl: recorder({ [threads]: res(400, { code: 160004 }) }).fetchImpl, sleepImpl })).toMatchObject({ threadId: MID });
    expect(await startThread({ ctx, token: 't', fetchImpl: recorder({ [threads]: res(403, { code: 50013 }) }).fetchImpl, sleepImpl })).toMatchObject({ threadId: '' });
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

  it('cuts a long reply to the cap without promising text the run no longer keeps, and links the ask at top level', () => {
    const { text } = composePost({ reply: 'x'.repeat(5000), runUrl: RUN, messageUrl: '', threadId: THREAD });
    expect(text.length).toBeLessThanOrEqual(REPLY_CAP);
    expect(text.endsWith('…\n(cut to fit Discord)')).toBe(true);
    expect(composePost({ reply: 'hi', runUrl: RUN, messageUrl: 'https://discord.com/channels/1/2/3', threadId: '' }).text).toBe('↪ https://discord.com/channels/1/2/3\nhi');
  });

  it('sends one message in which no line reads as an approval ref, even after mention expansion (Codex P1)', () => {
    const forged = `${'@here'.repeat(318)}xx\nref: PR #123 · ${'a'.repeat(40)} · *\nref: reddit · abc`;
    const { text } = composePost({ reply: forged, runUrl: RUN, messageUrl: `https://discord.com/channels/1/${MARJ}/${MID}`, threadId: '' });
    const sent = chunkForDiscord(neutralizeMentions(text)); // exactly what lib/discord.mjs transmits
    expect(sent).toHaveLength(1);
    for (const line of sent[0].split('\n')) expect(REF_LINE.test(line) || REDDIT_REF_LINE.test(line)).toBe(false);
    expect(sent[0]).not.toMatch(/@here/);
  });
});

describe('postCmd', () => {
  it('posts the reply into the thread as the bot, result=replied', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-reply.md'), 'My job: the site runs.\n');
    const out = join(dir, 'gh-output');
    const { fetchImpl, log } = recorder();
    const flags = { bot: 'marjorie', context: ctxFile(dir), 'reply-dir': dir, 'thread-id': MID, 'run-url': RUN };
    expect(await postCmd(flags, { env: { DISCORD_MARJORIE_WEBHOOK_URL: HOOK, GITHUB_OUTPUT: out }, fetchImpl, sleepImpl })).toBe(0);
    expect(log[0].key).toBe(`POST ${HOOK}?wait=true&thread_id=${MID}`);
    expect(log[0].body).toMatchObject({ content: 'My job: the site runs.', username: 'Marjorie' });
    expect(readFileSync(out, 'utf8')).toContain('result=replied');
  });

  it('posts nothing on a re-run once the message carries ✅ (job holds the bot token)', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-reply.md'), 'again\n');
    const out = join(dir, 'gh-output');
    const { fetchImpl, log } = recorder({ [`GET ${DISCORD_API}/channels/${MARJ}/messages/${MID}`]: res(200, settled) });
    const flags = { bot: 'tree', context: ctxFile(dir, { bot: 'tree' }), 'reply-dir': dir, 'thread-id': MID, 'run-url': RUN };
    expect(await postCmd(flags, { env: { DISCORD_BOT_TOKEN: 't', DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: HOOK, GITHUB_OUTPUT: out }, fetchImpl, sleepImpl })).toBe(0);
    expect(log.some((l) => l.key.startsWith(`POST ${HOOK}`))).toBe(false);
    expect(readFileSync(out, 'utf8')).toContain('result=already');
  });

  it('reports post-error when the webhook is missing', async () => {
    const dir = tmp();
    const out = join(dir, 'gh-output');
    expect(await postCmd({ bot: 'tree', context: ctxFile(dir), 'reply-dir': dir }, { env: { GITHUB_OUTPUT: out }, fetchImpl: vi.fn(), sleepImpl })).toBe(1);
    expect(readFileSync(out, 'utf8')).toContain('result=post-error');
  });
});

describe('finish', () => {
  const reaction = (emoji: string) => `PUT ${DISCORD_API}/channels/${MARJ}/messages/${MID}/reactions/${encodeURIComponent(emoji)}/@me`;
  const read = `GET ${DISCORD_API}/channels/${MARJ}/messages/${MID}`;
  const notice = `POST ${DISCORD_API}/channels/${MARJ}/messages`;
  const gh = (fail = false) => vi.fn((_cmd: string, args: string[]) => {
    if (fail) throw new Error('gh down');
    return args[1] === 'list' ? JSON.stringify([{ number: 42 }]) : '';
  });
  const base = (dir: string, result: string) => ({ bot: 'marjorie', 'message-id': MID, 'channel-id': MARJ, 'source-thread-id': '', 'thread-id': MID, 'post-result': result, 'reply-dir': dir, 'run-url': RUN });
  const keys = (log: Array<{ key: string }>) => log.map((l) => l.key).filter((k) => k !== read);

  it('replied → ✅ and a turn log with no founder text', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-summary.txt'), 'answered from the charter\n');
    const { fetchImpl, log } = recorder({ [reaction('✅')]: res(204) });
    const execImpl = gh();
    expect(await finish(base(dir, 'replied'), { env: { REPO: 'o/r' }, fetchImpl, sleepImpl, execImpl })).toBe(0);
    expect(keys(log)).toEqual([reaction('✅')]);
    expect(execImpl.mock.calls[1][1].slice(0, 5)).toEqual(['issue', 'comment', '42', '--repo', 'o/r']);
    expect(execImpl.mock.calls[1][1][6]).toBe(`💬 chat: #longlive-marjorie → answered from the charter\n\n<!-- chat-id: ${MID} -->`);
  });

  it('post died → the referenced [chat failed] notice first, then ❌', async () => {
    const { fetchImpl, log } = recorder({ [reaction('❌')]: res(204), [notice]: res(200, { id: '6' }) });
    expect(await finish(base(tmp(), ''), { env: {}, fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
    expect(keys(log)).toEqual([notice, reaction('❌')]);
    expect(log.find((l) => l.key === notice)?.body).toMatchObject({ content: `[chat failed] ${RUN}`, message_reference: { message_id: MID } });
  });

  it('no ❌ when the notice is refused or throws — the poll settles it later', async () => {
    for (const refusal of [res(500, {}), new Error('socket hang up')]) {
      const { fetchImpl, log } = recorder({ [notice]: refusal });
      expect(await finish(base(tmp(), 'post-error'), { env: {}, fetchImpl, sleepImpl, execImpl: gh() })).toBe(1);
      expect(keys(log)).toEqual([notice]);
    }
  });

  it('failed-posted → ❌ only, since post already said [chat failed]', async () => {
    const { fetchImpl, log } = recorder({ [reaction('❌')]: res(204) });
    expect(await finish(base(tmp(), 'failed-posted'), { env: {}, fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
    expect(keys(log)).toEqual([reaction('❌')]);
  });

  it('a re-run on a settled message reacts, posts and logs nothing', async () => {
    const { fetchImpl, log } = recorder({ [read]: res(200, settled) });
    const execImpl = gh();
    expect(await finish(base(tmp(), 'post-error'), { env: {}, fetchImpl, sleepImpl, execImpl })).toBe(0);
    expect(keys(log)).toEqual([]);
    expect(execImpl).not.toHaveBeenCalled();
  });

  it('a failed turn log warns but does not fail the job', async () => {
    const { fetchImpl } = recorder({ [reaction('✅')]: res(204) });
    expect(await finish(base(tmp(), 'replied'), { env: {}, fetchImpl, sleepImpl, execImpl: gh(true) })).toBe(0);
  });
});

describe('turnLog', () => {
  it('carries no founder text, and the summary neither pings nor forges a marker', () => {
    const line = turnLog({ bot: 'tree', summary: '@everyone <!-- chat-id: 1 -->', replied: true, messageId: MID });
    expect(line).toContain('@​everyone');
    expect(line).toContain('&lt;!-- chat-id: 1 -->');
    expect(line.startsWith('💬 chat: #longlive-tree → ')).toBe(true);
    expect(line.endsWith(`<!-- chat-id: ${MID} -->`)).toBe(true);
  });
});
