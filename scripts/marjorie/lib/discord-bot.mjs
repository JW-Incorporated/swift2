// Discord REST calls on the bot token, shared by `reply-poll.mjs` (M2) and
// the M5 chat loop (`chat-poll.mjs`, `chat-post.mjs` —
// docs/specs/marjorie-overhaul/m5-chat.md). Moved here from
// `reply-poll.mjs`'s own `discordGet()` when the chat loop became its third
// and fourth consumer; behavior is unchanged for that caller (its tests are
// the regression gate). Never import this from an agent step —
// DISCORD_BOT_TOKEN only exists in `run:` steps under `environment: social`.
export const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_MIN_INTERVAL_MS = 350;
const DISCORD_MAX_ATTEMPTS = 3;

export function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastDiscordCallAt = 0;

async function discordThrottle(sleepImpl) {
  const wait = lastDiscordCallAt + DISCORD_MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleepImpl(wait);
  lastDiscordCallAt = Date.now();
}

async function readBody(res) {
  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Any-method request with the same 429/`retry_after` handling
 * `social-approval-poll.mjs`'s `discordGet()` uses. Never throws on an HTTP
 * status — resolves `{ ok, status, data }` so callers can branch on 403/404
 * (a missing channel permission is a warning, not a crash). A network-level
 * rejection still propagates.
 */
export async function discordRequest(method, url, token, { body, fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  let res;
  for (let attempt = 1; attempt <= DISCORD_MAX_ATTEMPTS; attempt += 1) {
    await discordThrottle(sleepImpl);
    const init = { method, headers: { Authorization: `Bot ${token}` } };
    if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    res = await fetchImpl(url, init);
    if (res.status !== 429) break;
    const retryBody = await res.json().catch(() => ({}));
    const retryAfterSec = typeof retryBody.retry_after === 'number' ? retryBody.retry_after : 1;
    if (attempt < DISCORD_MAX_ATTEMPTS) await sleepImpl(retryAfterSec * 1000);
  }
  if (res.status === 429) return { ok: false, status: 429, data: null };
  return { ok: res.ok, status: res.status, data: res.ok ? await readBody(res) : await readBody(res) };
}

/**
 * GET that returns `null` on a 404 and throws on any other non-2xx — the
 * exact contract `reply-poll.mjs` was written against.
 */
export async function discordGet(url, token, { fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= DISCORD_MAX_ATTEMPTS; attempt += 1) {
    await discordThrottle(sleepImpl);
    const res = await fetchImpl(url, { headers: { Authorization: `Bot ${token}` } });
    if (res.status === 404) return null;
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const retryAfterSec = typeof body.retry_after === 'number' ? body.retry_after : 1;
      lastErr = new Error(`Discord GET ${url} -> 429 rate limited (retry_after ${retryAfterSec}s)`);
      if (attempt < DISCORD_MAX_ATTEMPTS) {
        await sleepImpl(retryAfterSec * 1000);
        continue;
      }
      throw lastErr;
    }
    if (!res.ok) {
      throw new Error(`Discord GET ${url} -> ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
  throw lastErr;
}

// The thread root is a webhook post: its id equals the thread id, and/or it
// carries a `webhook_id` field. Either signal alone is enough to exclude it.
// An ordinary bot account (no `webhook_id`) is excluded too — only a human
// founder's message is ever relayed or answered.
export function isRootOrWebhookMessage(message, threadId) {
  return message.id === threadId || Boolean(message.webhook_id) || Boolean(message.author?.bot);
}

export function authorName(author) {
  return (author && (author.global_name || author.username)) || 'a founder';
}

/** Discord snowflake → epoch ms (the id encodes its own creation time). */
export function snowflakeMs(id) {
  try {
    return Number((BigInt(id) >> 22n) + 1420070400000n);
  } catch {
    return 0;
  }
}

/** True when the bot itself (`me`) already reacted with `emoji`. */
export function hasOwnReaction(message, emoji) {
  return Array.isArray(message?.reactions) && message.reactions.some((r) => r?.me && r?.emoji?.name === emoji);
}

export function reactionUrl(channelId, messageId, emoji) {
  return `${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`;
}
