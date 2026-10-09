import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { ROUTES, discordBotToken, routeChannelId, routeForPlatform, routedPost } from './discord-route.mjs';

const ok = (id = '99') => ({ ok: true, status: 200, json: async () => ({ id }) });
const env = { DISCORD_BOT_TOKEN: 'b' };

describe('discord-route', () => {
  it('picks the token in one place: Tree bot first, else the shared bot', () => {
    expect(discordBotToken({ DISCORD_TREE_BOT_TOKEN: 't', DISCORD_BOT_TOKEN: 'b' })).toBe('t');
    expect(discordBotToken({ DISCORD_BOT_TOKEN: 'b' })).toBe('b');
    expect(discordBotToken({})).toBe('');
  });

  it('uses the repo variable when it is a snowflake, else the committed id', () => {
    expect(routeChannelId('tree-reddit', {})).toBe('1558093079351787580');
    expect(routeChannelId('tree-reddit', { DISCORD_TREE_REDDIT_CHANNEL_ID: '123456789012345678' })).toBe('123456789012345678');
    expect(routeChannelId('tree-reddit', { DISCORD_TREE_REDDIT_CHANNEL_ID: 'oops' })).toBe('1558093079351787580');
    expect(ROUTES['tree-ig-x'].id).toBe('1544065811143196833');
  });

  it('routes platforms: reddit, facebook, everything else to tree-main', () => {
    expect(routeForPlatform('reddit')).toBe('tree-reddit');
    expect(routeForPlatform('facebook')).toBe('tree-facebook');
    expect(routeForPlatform('x')).toBe('tree-main');
  });

  it('posts JSON by channel id with the bot token and drops webhook-only fields', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const init = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: 'hi', username: 'Tree', avatar_url: 'x', flags: 4 }) };
    await routedPost('tree-facebook', init, { env, webhook: 'https://hook', fetchImpl });
    const [url, sent] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://discord.com/api/v10/channels/1558093113807999026/messages');
    expect(sent.headers.Authorization).toBe('Bot b');
    expect(JSON.parse(sent.body)).toEqual({ content: 'hi', flags: 4 });
  });

  it('keeps multipart PNG uploads and strips username from payload_json', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ content: 'c', username: 'Tree', attachments: [{ id: 0, filename: 'a.png' }] }));
    form.append('files[0]', new Blob([Buffer.from([1, 2])], { type: 'image/png' }), 'a.png');
    await routedPost('tree-reddit', { method: 'POST', body: form }, { env, fetchImpl });
    const sent = fetchImpl.mock.calls[0][1].body as FormData;
    expect(JSON.parse(String(sent.get('payload_json')))).toEqual({ content: 'c', attachments: [{ id: 0, filename: 'a.png' }] });
    expect((sent.get('files[0]') as File).name).toBe('a.png');
  });

  it('posts into a thread by its id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    await routedPost('tree-main', { method: 'POST', body: '{"content":"x"}' }, { env, threadId: '777', fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toContain('/channels/777/messages');
  });

  it('falls back to the webhook (loudly) with no token, and throws with neither', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await routedPost('tree-main', { method: 'POST', body: '{}' }, { env: {}, webhook: 'https://hook', fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://hook?wait=true');
    expect(log.mock.calls.flat().join()).toContain('::warning::');
    await expect(routedPost('tree-main', { method: 'POST', body: '{}' }, { env: {}, fetchImpl })).rejects.toThrow();
    log.mockRestore();
  });

  it('retries once via the webhook when the bot is refused (401/403/404), with a warning', async () => {
    for (const status of [401, 403, 404]) {
      const fetchImpl = vi.fn().mockResolvedValueOnce({ ok: false, status, json: async () => ({ code: 50013 }) }).mockResolvedValueOnce(ok('hook'));
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const res = await routedPost('tree-main', { method: 'POST', body: '{"content":"x"}' }, { env, webhook: 'https://hook', threadId: '5', fetchImpl });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      expect(fetchImpl.mock.calls[1][0]).toBe('https://hook?wait=true&thread_id=5');
      expect(await res.json()).toEqual({ id: 'hook' });
      expect(log.mock.calls.flat().join()).toContain(`HTTP ${status}`);
      log.mockRestore();
    }
  });

  it('returns a refusal as is when there is no webhook, and does not fall back on a 5xx', async () => {
    const refused = { ok: false, status: 403, json: async () => ({}) };
    expect(await routedPost('tree-main', { method: 'POST', body: '{}' }, { env, fetchImpl: vi.fn().mockResolvedValue(refused) })).toBe(refused);
    const boom = { ok: false, status: 500, json: async () => ({}) };
    const fetchImpl = vi.fn().mockResolvedValue(boom);
    expect(await routedPost('tree-main', { method: 'POST', body: '{}' }, { env, webhook: 'https://hook', fetchImpl })).toBe(boom);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns a 429 untouched with its body unread (callers own the retry)', async () => {
    const json = vi.fn();
    const limited = { ok: false, status: 429, json };
    const fetchImpl = vi.fn().mockResolvedValue(limited);
    expect(await routedPost('tree-main', { method: 'POST', body: '{}' }, { env, webhook: 'https://hook', fetchImpl })).toBe(limited);
    expect(json).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
