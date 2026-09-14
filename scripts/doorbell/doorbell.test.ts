import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { createDoorbell, main } from './doorbell.mjs';

const JOEY = '338508192755482626';
const GUILD = '900000000000000001';
const MARJ = '900000000000000010';
const TREE = '900000000000000020';
const NEW_THREAD = '900000000000000070';
const ID = '1000000000000000001';
const NOW = Date.parse('2026-09-14T18:00:00.000Z');
const API = 'https://discord.com/api/v10';
const WORKFLOWS = 'https://api.github.com/repos/JW-Incorporated/swift2/actions/workflows';
const enc = encodeURIComponent;
const react = (where: string, emoji: string) => `PUT ${API}/channels/${where}/messages/${ID}/reactions/${enc(emoji)}/@me`;
const users = (where: string, emoji: string) => `GET ${API}/channels/${where}/messages/${ID}/reactions/${enc(emoji)}?limit=100`;

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
type Call = { key: string; auth: string; body: { ref?: string; inputs?: Record<string, string> } | null };

function bell(routes: Record<string, unknown> = {}) {
  const calls: Call[] = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    calls.push({ key, auth: init.headers?.Authorization || '', body: init.body ? JSON.parse(init.body) : null });
    if (key in routes) return routes[key];
    return init.method && init.method !== 'GET' ? res(204) : res(200, []);
  });
  const lines: string[] = [];
  const config = { ok: true, problems: [], discordToken: 'discord-secret', githubToken: 'github-secret', guildId: '', founders: new Set([JOEY]) };
  const doorbell = createDoorbell({ config, fetchImpl, sleepImpl: vi.fn().mockResolvedValue(undefined), log: (l: string) => lines.push(l), now: () => NOW });
  doorbell.onDispatch('GUILD_CREATE', { id: GUILD, channels: [{ id: MARJ, name: 'longlive-marjorie', type: 0 }, { id: TREE, name: 'longlive-tree', type: 0 }], threads: [] });
  return { doorbell, calls, lines, keys: () => calls.map((c) => c.key) };
}
const founderMessage = (over: Record<string, unknown> = {}) => ({
  id: ID, channel_id: MARJ, guild_id: GUILD, type: 0, author: { id: JOEY, username: 'joey' }, content: '', timestamp: '2026-09-14T17:59:59.000Z', ...over,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the doorbell rings', () => {
  it('logs ready with both channel names', () => {
    expect(bell().lines).toContain(`ready: #longlive-marjorie (${MARJ}) and #longlive-tree (${TREE}); 1 founder id(s)`);
  });

  it('adds 👀 as the doorbell bot, then dispatches the chat routine on main with the poll\'s inputs', async () => {
    const { doorbell, calls } = bell();
    await doorbell.onMessage(founderMessage());
    expect(calls.map((c) => c.key)).toEqual([react(MARJ, '👀'), `POST ${WORKFLOWS}/routine-marjorie-chat.yml/dispatches`]);
    expect(calls[0].auth).toBe('Bot discord-secret');
    expect(calls[1].auth).toBe('Bearer github-secret');
    expect(calls[1].body).toEqual({ ref: 'main', inputs: { message_id: ID, channel_id: MARJ, thread_id: '' } });
  });

  it('rings a thread message under its parent, once per message, even through the gateway handler', async () => {
    const { doorbell, calls } = bell();
    doorbell.onDispatch('THREAD_CREATE', { id: NEW_THREAD, type: 11, parent_id: TREE, guild_id: GUILD });
    doorbell.onDispatch('MESSAGE_CREATE', founderMessage({ channel_id: NEW_THREAD }));
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    await doorbell.onMessage(founderMessage({ channel_id: NEW_THREAD }));
    expect(calls.map((c) => c.key)).toEqual([react(NEW_THREAD, '👀'), `POST ${WORKFLOWS}/routine-tree-chat.yml/dispatches`]);
    expect(calls[1].body?.inputs).toEqual({ message_id: ID, channel_id: TREE, thread_id: NEW_THREAD });
  });

  it('still dispatches when 👀 is refused, and survives a failed dispatch', async () => {
    const { doorbell, keys, lines } = bell({
      [react(MARJ, '👀')]: res(403, { code: 50013 }),
      [`POST ${WORKFLOWS}/routine-marjorie-chat.yml/dispatches`]: res(422, {}),
    });
    await doorbell.onMessage(founderMessage());
    expect(keys()).toHaveLength(2);
    expect(lines.some((l) => l.includes('refused (HTTP 403); dispatching anyway'))).toBe(true);
    expect(lines.some((l) => l.includes('failed (HTTP 422); the poll picks it up'))).toBe(true);
  });

  it('looks up a place it has never seen only for a founder message', async () => {
    const lookup = `GET ${API}/channels/${NEW_THREAD}`;
    const stranger = bell();
    await stranger.doorbell.onMessage(founderMessage({ channel_id: NEW_THREAD, author: { id: '111111111111111111' } }));
    expect(stranger.calls).toEqual([]);
    const { doorbell, keys } = bell({ [lookup]: res(200, { id: NEW_THREAD, type: 11, parent_id: TREE, guild_id: GUILD }) });
    await doorbell.onMessage(founderMessage({ channel_id: NEW_THREAD }));
    expect(keys()).toEqual([lookup, react(NEW_THREAD, '👀'), `POST ${WORKFLOWS}/routine-tree-chat.yml/dispatches`]);
  });

  it('touches no bot, webhook or thread-root message', async () => {
    const { doorbell, calls } = bell();
    for (const m of [founderMessage({ author: { id: JOEY, bot: true } }), founderMessage({ webhook_id: '9' }), founderMessage({ id: MARJ })]) {
      await doorbell.onMessage(m);
    }
    expect(calls).toEqual([]);
  });
});

describe('the stuck alarm', () => {
  async function rung(routes: Record<string, unknown> = {}) {
    vi.useFakeTimers();
    const b = bell(routes);
    await b.doorbell.onMessage(founderMessage());
    return b;
  }

  it('after 6 minutes with no bot ✅/❌: adds ⚠️ and dispatches bot-chat-alarm.yml', async () => {
    const { calls, keys } = await rung();
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000 - 1);
    expect(keys()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => expect(keys()).toHaveLength(6));
    expect(keys().slice(2)).toEqual([users(MARJ, '✅'), users(MARJ, '❌'), react(MARJ, '⚠️'), `POST ${WORKFLOWS}/bot-chat-alarm.yml/dispatches`]);
    expect(calls[5].body?.inputs).toEqual({ bot: 'marjorie', message_id: ID, channel_id: MARJ, thread_id: '', stage: 'stuck' });
  });

  it('does nothing more once a bot account has reacted ✅', async () => {
    const { keys } = await rung({ [users(MARJ, '✅')]: res(200, [{ id: '77', username: 'Long Live', bot: true }]) });
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    await vi.waitFor(() => expect(keys()).toHaveLength(4));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(keys()).toHaveLength(4);
  });

  it("only ever adds 👀 or ⚠️ on Discord and only ever dispatches on GitHub", async () => {
    const { calls } = await rung({ [users(MARJ, '❌')]: res(500, {}) });
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    await vi.waitFor(() => expect(calls.some((c) => c.key.includes('bot-chat-alarm'))).toBe(true));
    for (const { key } of calls) {
      if (key.startsWith('GET ')) continue;
      const discordWrite = key.startsWith(`PUT ${API}/channels/`) && /^\d+\/messages\/\d+\/reactions\/[^/]+\/@me$/.test(key.slice(`PUT ${API}/channels/`.length));
      const emoji = discordWrite ? key.split('/reactions/')[1].split('/')[0] : '';
      const githubWrite = key.startsWith(`POST ${WORKFLOWS}/`) && /^[\w.-]+\/dispatches$/.test(key.slice(`POST ${WORKFLOWS}/`.length));
      expect(githubWrite || (discordWrite && [enc('👀'), enc('⚠️')].includes(emoji)), key).toBe(true);
    }
  });
});

describe('--check and the bare clone', () => {
  it('prints the config and exits without a request or a connection, never echoing a token', async () => {
    const lines: string[] = [];
    const fetchImpl = vi.fn();
    const WebSocketImpl = vi.fn();
    const env = { DOORBELL_DISCORD_TOKEN: 'tok-discord', DOORBELL_GITHUB_TOKEN: 'tok-github' };
    expect(await main(['--check'], { env, fetchImpl, WebSocketImpl, log: (l: string) => lines.push(l) })).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(WebSocketImpl).not.toHaveBeenCalled();
    expect(lines).toContain('config OK');
    expect(lines.filter((line) => /^  20\d\d-/.test(line))).toHaveLength(10);
    expect(lines.join('\n')).not.toContain('tok-');
    expect(await main(['--check'], { env: {}, fetchImpl, WebSocketImpl, log: () => {} })).toBe(1);
    expect(await main([], { env: {}, fetchImpl, WebSocketImpl, log: () => {} })).toBe(1);
    expect(WebSocketImpl).not.toHaveBeenCalled();
  });

  it('runs --check as a plain node process', () => {
    const out = execFileSync(process.execPath, ['scripts/doorbell/doorbell.mjs', '--check'], {
      encoding: 'utf8', env: { PATH: process.env.PATH, DOORBELL_DISCORD_TOKEN: 'x', DOORBELL_GITHUB_TOKEN: 'y' },
    });
    expect(out).toContain('config OK');
  });

  const DIR = resolve('scripts/doorbell');
  const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : /\.(mjs|service)$/.test(e.name) ? [join(dir, e.name)] : []);

  it('never posts a message and never adds ✅ or ❌ (text test)', () => {
    for (const file of sources(DIR)) {
      // Code only: the headers name what the doorbell never does.
      const text = readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*|#)/.test(l)).join('\n');
      const name = relative(DIR, file);
      expect(text, name).not.toMatch(/[✅❌]/u);
      expect(text, name).not.toMatch(/postFailure|chat-delivery|lib\/discord\.mjs|webhook/i);
      for (const line of text.split('\n').filter((l) => l.includes('/messages'))) expect(line, name).toContain('/reactions');
      for (const m of text.matchAll(/'POST'/g)) expect(text.slice(m.index, m.index + 200), name).toContain('/dispatches');
    }
  });

  it('imports only node: builtins and repo files, so a bare clone needs no npm install', () => {
    const visited = new Set<string>();
    const walk = (file: string) => {
      if (visited.has(file)) return;
      visited.add(file);
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        const spec = m[1] || m[2];
        if (spec.startsWith('node:')) continue;
        expect(spec, `${relative(process.cwd(), file)} imports ${spec}`).toMatch(/^\.\.?\//);
        const target = resolve(dirname(file), spec);
        expect(existsSync(target), target).toBe(true);
        walk(target);
      }
    };
    walk(join(DIR, 'doorbell.mjs'));
    const graph = [...visited].map((f) => relative(process.cwd(), f).replace(/\\/g, '/')).sort();
    expect(graph).toEqual([
      'scripts/doorbell/doorbell.mjs',
      'scripts/doorbell/lib/clock-core.mjs',
      'scripts/doorbell/lib/clock.mjs',
      'scripts/doorbell/lib/doorbell-core.mjs',
      'scripts/doorbell/lib/gateway.mjs',
      'scripts/doorbell/lib/github-rest.mjs',
      'scripts/marjorie/lib/chat-inbox.mjs',
      'scripts/marjorie/lib/discord-bot.mjs',
      'scripts/social/lib/approvers.mjs',
    ]);
  });
});
