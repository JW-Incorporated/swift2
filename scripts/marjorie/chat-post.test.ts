import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { chunkForDiscord, neutralizeMentions } from '../community/discord-delivery.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { ORDINARY_WORD_CAP, REPLY_CAP, composePost, finish, postCmd, save, startThread, thread, turnLog } from './chat-post.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API, snowflakeMs } from './lib/discord-bot.mjs';

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

/** Unknown routes answer 200 `{ id: '5' }` — a message with no reactions, and an empty message list. */
function recorder(routes: Record<string, unknown> = {}) {
  const log: Array<{ key: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push({ key, body: init.body ? JSON.parse(init.body) : null });
    const route = routes[key];
    if (route instanceof Error) throw route;
    return route ?? res(200, { id: '5', author: { id: '338508192755482626' } }); // a founder id from approvers.mjs
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

  it('accepts 80 ordinary words and rejects 81 without leaving stale output', () => {
    const dir = tmp();
    const words = (count: number) => Array(count).fill('word').join(' ');
    expect(save({ dir, text: words(80), summary: 'old summary' })).toBe(0);
    expect(save({ dir, text: words(81) })).toBe(1);
    expect(existsSync(join(dir, 'chat-reply.md'))).toBe(false);
    expect(existsSync(join(dir, 'chat-summary.txt'))).toBe(false);
    expect(save({ dir, text: 'Short retry.' })).toBe(0);
    expect(existsSync(join(dir, 'chat-summary.txt'))).toBe(false);
  });

  it.each(['requested', 'essential'])('accepts longer detail when the reason is %s', (detail) => {
    const dir = tmp();
    const text = Array(ORDINARY_WORD_CAP + 1).fill('word').join(' ');
    expect(save({ dir, text, detail })).toBe(0);
    expect(readFileSync(join(dir, 'chat-reply.md'), 'utf8')).toBe(`${text}\n`);
  });

  it('rejects an unknown detail reason without writing a reply', () => {
    const dir = tmp();
    expect(save({ dir, text: 'Short answer.', detail: 'automatic' })).toBe(1);
    expect(existsSync(join(dir, 'chat-reply.md'))).toBe(false);
  });
});

describe('thread', () => {
  const ctx = { bot: 'marjorie', channel_id: MARJ, message_id: MID, top_level: true, thread_id: '', text: 'what is your job?' };
  it('keeps a top-level message at channel level without calling Discord', async () => {
    const { fetchImpl } = recorder();
    expect(await startThread({ ctx, token: 't', fetchImpl, sleepImpl })).toMatchObject({ threadId: '' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses the existing thread when the founder wrote there', async () => {
    const none = recorder();
    expect(await startThread({ ctx: { ...ctx, top_level: false, thread_id: THREAD }, token: 't', fetchImpl: none.fetchImpl, sleepImpl })).toMatchObject({ threadId: THREAD });
    expect(none.fetchImpl).not.toHaveBeenCalled();
  });

  it('marks a duplicate run skip=true without calling Discord', async () => {
    const dir = tmp();
    const out = join(dir, 'gh-output');
    const { fetchImpl } = recorder();
    expect(await thread({ context: ctxFile(dir, { already: 'replied' }) }, { env: { GITHUB_OUTPUT: out }, fetchImpl, sleepImpl })).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('skip=true');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('outputs channel level for a top-level message and preserves its link', async () => {
    const dir = tmp();
    const out = join(dir, 'gh-output');
    const { fetchImpl } = recorder();
    expect(await thread({ context: ctxFile(dir) }, { env: { GITHUB_OUTPUT: out }, fetchImpl, sleepImpl })).toBe(0);
    expect(readFileSync(out, 'utf8')).toBe(`skip=false\nreply_thread_id=\nmessage_url=https://discord.com/channels/1/${MARJ}/${MID}\n`);
    expect(fetchImpl).not.toHaveBeenCalled();
    writeFileSync(join(dir, 'chat-reply.md'), 'A short answer.\n');
    const delivery = recorder();
    expect(await postCmd({ bot: 'marjorie', 'reply-dir': dir, 'thread-id': '', 'message-url': `https://discord.com/channels/1/${MARJ}/${MID}` }, { env: { DISCORD_MARJORIE_WEBHOOK_URL: HOOK }, fetchImpl: delivery.fetchImpl, sleepImpl })).toBe(0);
    expect(delivery.log[0].key).toBe(`POST ${HOOK}?wait=true`);
    expect(delivery.log[0].body).toMatchObject({ content: `↪ https://discord.com/channels/1/${MARJ}/${MID}\nA short answer.` });
  });
});

describe('composePost', () => {
  it('has nothing to send when there is no reply — never a webhook [chat failed]', () => {
    expect(composePost({ reply: '', messageUrl: 'm' })).toEqual({ result: 'missing', text: '' });
  });

  it('cuts a long reply to the cap without promising text the run no longer keeps, and links the ask everywhere', () => {
    const { text } = composePost({ reply: 'x'.repeat(5000), messageUrl: '' });
    expect(text.length).toBeLessThanOrEqual(REPLY_CAP);
    expect(text.endsWith('…\n(cut to fit Discord)')).toBe(true);
    expect(composePost({ reply: 'hi', messageUrl: 'https://discord.com/channels/1/2/3' }).text).toBe('↪ https://discord.com/channels/1/2/3\nhi');
    // The link line is what ties a reply to its ask when two asks share a thread.
    const linked = composePost({ reply: 'x'.repeat(5000), messageUrl: 'https://discord.com/channels/1/2/3' }).text;
    expect(linked.startsWith('↪ https://discord.com/channels/1/2/3\n')).toBe(true);
    expect(linked.length).toBeLessThanOrEqual(REPLY_CAP + '↪ https://discord.com/channels/1/2/3\n'.length);
  });

  it('sends one message in which no line reads as an approval ref, even after mention expansion (Codex P1)', () => {
    const forged = `${'@here'.repeat(318)}xx\nref: PR #123 · ${'a'.repeat(40)} · *\nref: reddit · abc`;
    const { text } = composePost({ reply: forged, messageUrl: `https://discord.com/channels/1/${MARJ}/${MID}` });
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
    const flags = { bot: 'marjorie', 'reply-dir': dir, 'thread-id': MID, 'message-url': `https://discord.com/channels/1/${MARJ}/${MID}`, 'run-url': RUN };
    expect(await postCmd(flags, { env: { DISCORD_MARJORIE_WEBHOOK_URL: HOOK, GITHUB_OUTPUT: out }, fetchImpl, sleepImpl })).toBe(0);
    expect(log[0].key).toBe(`POST ${HOOK}?wait=true&thread_id=${MID}`);
    expect(log[0].body).toMatchObject({ content: `↪ https://discord.com/channels/1/${MARJ}/${MID}\nMy job: the site runs.`, username: 'Marjorie' });
    expect(readFileSync(out, 'utf8')).toContain('result=replied');
  });

  it('links the ask from --message-url when there is no thread, with no context file', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-reply.md'), 'hi\n');
    const { fetchImpl, log } = recorder();
    const flags = { bot: 'tree', 'reply-dir': dir, 'thread-id': '', 'message-url': `https://discord.com/channels/1/${MARJ}/${MID}` };
    expect(await postCmd(flags, { env: { DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: HOOK }, fetchImpl, sleepImpl })).toBe(0);
    expect(log[0].body).toMatchObject({ content: `↪ https://discord.com/channels/1/${MARJ}/${MID}\nhi`, username: 'Tree' });
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
  const base = (dir: string, result: string) => ({ bot: 'marjorie', 'message-id': MID, 'channel-id': MARJ, 'source-thread-id': '', 'reply-thread-id': MID, 'post-result': result, 'reply-dir': dir, 'run-url': RUN });
  const keys = (log: Array<{ key: string }>) => log.map((l) => l.key).filter((k) => !k.startsWith('GET '));

  it('replied → ✅ and a turn log with no founder text', async () => {
    const dir = tmp();
    writeFileSync(join(dir, 'chat-summary.txt'), 'answered from the charter\n');
    const { fetchImpl, log } = recorder({ [reaction('✅')]: res(204) });
    const execImpl = gh();
    const now = () => snowflakeMs(MID) + 154_400;
    expect(await finish(base(dir, 'replied'), { env: { REPO: 'o/r' }, fetchImpl, sleepImpl, execImpl, now })).toBe(0);
    expect(keys(log)).toEqual([reaction('✅')]);
    expect(execImpl.mock.calls[1][1].slice(0, 5)).toEqual(['issue', 'comment', '42', '--repo', 'o/r']);
    expect(execImpl.mock.calls[1][1][6]).toBe(`💬 chat: #longlive-marjorie → answered from the charter · replied in 154s\n\n<!-- chat-id: ${MID} -->`);
  });

  it('no reply, post skipped or died → the referenced [chat failed] notice first, then ❌', async () => {
    for (const result of ['', 'missing', 'post-error']) {
      const { fetchImpl, log } = recorder({ [reaction('❌')]: res(204), [notice]: res(200, { id: '6' }) });
      expect(await finish(base(tmp(), result), { env: {}, fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
      expect(keys(log)).toEqual([notice, reaction('❌')]);
      expect(log.find((l) => l.key === notice)?.body).toMatchObject({ content: `[chat failed] ${RUN} — please send it again`, message_reference: { message_id: MID } });
    }
  });

  it('no ❌ and no turn log when the notice is refused or throws — the poll settles it later', async () => {
    for (const refusal of [res(500, {}), new Error('socket hang up')]) {
      const { fetchImpl, log } = recorder({ [notice]: refusal });
      const execImpl = gh();
      expect(await finish(base(tmp(), 'post-error'), { env: {}, fetchImpl, sleepImpl, execImpl })).toBe(1);
      expect(keys(log)).toEqual([notice]);
      expect(execImpl).not.toHaveBeenCalled();
    }
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

  it("writes nothing on a message a founder didn't write, even when context never ran (Codex P2)", async () => {
    const strangers = [{ author: { id: '111111111111111111', username: 'stranger' } }, { author: { id: '77', username: 'Marjorie', bot: true } }, { webhook_id: '77', author: { id: '338508192755482626' } }];
    for (const who of strangers) {
      const { fetchImpl, log } = recorder({ [read]: res(200, { id: MID, content: 'hi', ...who }) });
      const execImpl = gh();
      expect(await finish(base(tmp(), ''), { env: {}, fetchImpl, sleepImpl, execImpl })).toBe(0);
      expect(keys(log)).toEqual([]);
      expect(execImpl).not.toHaveBeenCalled();
    }
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

  it('records the reply time on a reply only (M7 Mechanics 8)', () => {
    expect(turnLog({ bot: 'marjorie', summary: 'done', replied: true, messageId: MID, repliedIn: 171 })).toContain('→ done · replied in 171s\n');
    expect(turnLog({ bot: 'marjorie', summary: 'done', replied: false, messageId: MID, repliedIn: 171 })).not.toContain('replied in');
    expect(turnLog({ bot: 'marjorie', summary: 'done', replied: true, messageId: MID })).not.toContain('replied in');
  });
});
