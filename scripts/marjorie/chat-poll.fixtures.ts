// Shared fixtures for chat-poll.test.ts and chat-poll-doorbell.test.ts: a
// Discord stand-in keyed by exact `METHOD url`, a `gh` stand-in, and the
// guild the poll reads.
import { vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

export const NOW = Date.parse('2026-09-13T18:00:00.000Z');
export const JOEY = '338508192755482626';
export const STRANGER = '111111111111111111';
export const GUILD = '900000000000000001';
export const MARJ = '900000000000000010';
export const TREE = '900000000000000020';
export const THREAD = '900000000000000030';
export const HOOK = 'https://discord.com/api/webhooks/1/secret-token';
export const EYES = encodeURIComponent('👀');
export const CROSS = encodeURIComponent('❌');
export const REPO = 'JW-Incorporated/swift2';
export const snow = (ms: number) => String((BigInt(ms) - 1420070400000n) << 22n);
export function msg(id: string, over: Record<string, unknown> = {}) {
  return { id, type: 0, author: { id: JOEY, username: 'joey', global_name: 'Joey' }, content: 'what is your job?', timestamp: '2026-09-13T17:00:00.000Z', ...over };
}
export const mine = (...emoji: string[]) => ({ reactions: emoji.map((name) => ({ me: true, emoji: { name } })) });
export function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}
/** Exact `METHOD url` → response. Unknown routes 404. `log` records every call in order. */
export function discord(routes: Record<string, unknown>, log: string[] = []) {
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push(init.body ? `${key} ${init.body}` : key);
    return key in routes ? routes[key] : res(404, {});
  });
  return { fetchImpl, log };
}
/** `gh` stand-in: `run list` answers with `runs`, `workflow run` is recorded. */
export function gh(runs: unknown[] = [], log: string[] = []) {
  return vi.fn((_cmd: string, args: string[]) => {
    log.push(`gh ${args.join(' ')}`);
    return args[0] === 'run' ? JSON.stringify(runs) : '';
  });
}
export const sleepImpl = vi.fn().mockResolvedValue(undefined);
export const founders = new Set([JOEY]);
export const onlyMarjorie = (wf: string) => wf === 'routine-marjorie-chat.yml';
export function baseRoutes(marjMessages: unknown[], threadMessages: unknown[] = []) {
  const exact = (where: string, messages: unknown[]) => Object.fromEntries((messages as Array<{ id: string }>).flatMap((item) => [
    [`GET ${DISCORD_API}/channels/${where}/messages/${item.id}`, res(200, item)],
    [`GET ${DISCORD_API}/channels/${where}/messages?after=${item.id}&limit=100`, res(200, (messages as Array<{ id: string }>).filter((m) => BigInt(m.id) > BigInt(item.id)))],
  ]));
  return {
    [`GET ${HOOK}`]: res(200, { guild_id: GUILD, channel_id: TREE }),
    [`GET ${DISCORD_API}/guilds/${GUILD}/channels`]: res(200, [{ id: MARJ, name: 'longlive-marjorie' }, { id: TREE, name: 'longlive-tree' }]),
    [`GET ${DISCORD_API}/guilds/${GUILD}/threads/active`]: res(200, { threads: [{ id: THREAD, parent_id: MARJ, last_message_id: snow(NOW - 3_600_000) }] }),
    [`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100`]: res(200, marjMessages),
    [`GET ${DISCORD_API}/channels/${THREAD}/messages?limit=100`]: res(200, threadMessages),
    [`GET ${DISCORD_API}/channels/${TREE}/messages?limit=100`]: res(200, []),
    ...exact(MARJ, marjMessages),
    ...exact(THREAD, threadMessages),
  };
}
export const env = { DISCORD_BOT_TOKEN: 'bot', DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: HOOK, REPO };
