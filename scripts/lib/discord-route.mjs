// One place that decides WHERE a Tree Discord message goes and WHICH credential
// sends it (TREE-MARJORIE-AGENTS Phase 1). Before this, every Tree sender posted
// through the single DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL webhook, which is bound
// to one channel (tree-ig-x). Routes are channel ids, sent with a bot token.
//
// - Channel ids are not secrets: each is a repo VARIABLE (env name below) with
//   the committed id as the default, so a missing variable never breaks a send.
// - Token: DISCORD_TREE_BOT_TOKEN when set (Tree's own bot, later), else
//   DISCORD_BOT_TOKEN. This is the ONLY place that picks it.
// - Senders keep building the same webhook-shaped request (`init`); `routedPost`
//   adapts it (drops the webhook-only `username` / `avatar_url`, which a bot post
//   ignores) so card format stays byte-for-byte what it was.
// - No bot token or no channel id -> the caller's webhook (tree-ig-x, the old
//   behaviour) with a loud warning, so cards keep flowing instead of vanishing.
//
// Stay on the webhook (deliberately NOT routed): IG/X approval prompts, the weekly
// brief, IG/X reply pings and posted notices. social-approval-poll.mjs trusts a
// message only when `webhook_id` matches its own webhook; a bot post has no
// webhook_id, so moving those would silently stop approvals.
export const DISCORD_API = 'https://discord.com/api/v10';
export const SNOWFLAKE = /^\d{15,21}$/;

export const ROUTES = {
  'tree-main': { env: 'DISCORD_TREE_MAIN_CHANNEL_ID', id: '1558093607393562644' },
  'tree-ig-x': { env: 'DISCORD_TREE_IG_X_CHANNEL_ID', id: '1544065811143196833' },
  'tree-reddit': { env: 'DISCORD_TREE_REDDIT_CHANNEL_ID', id: '1558093079351787580' },
  'tree-facebook': { env: 'DISCORD_TREE_FACEBOOK_CHANNEL_ID', id: '1558093113807999026' },
  marjorie: { env: 'DISCORD_MARJORIE_CHANNEL_ID', id: '1548350324891328562' },
};

/** The one credential picker: Tree's own bot when configured, else the shared bot. */
export function discordBotToken(env = process.env) {
  return String(env.DISCORD_TREE_BOT_TOKEN || env.DISCORD_BOT_TOKEN || '').trim();
}

/** A route's channel id: its repo variable when it is a valid snowflake, else the committed id. */
export function routeChannelId(route, env = process.env) {
  const cfg = ROUTES[route];
  if (!cfg) return '';
  const fromEnv = String(env[cfg.env] ?? '').trim();
  return SNOWFLAKE.test(fromEnv) ? fromEnv : cfg.id;
}

/** Awareness lead platform -> route. Anything that is not Reddit or Facebook goes to tree-main. */
export function routeForPlatform(platform) {
  if (platform === 'reddit') return 'tree-reddit';
  if (platform === 'facebook') return 'tree-facebook';
  return 'tree-main';
}

const WEBHOOK_ONLY_FIELDS = ['username', 'avatar_url'];

function stripWebhookFields(payload) {
  const out = { ...payload };
  for (const f of WEBHOOK_ONLY_FIELDS) delete out[f];
  return out;
}

function botBody(init) {
  const body = init?.body;
  if (typeof body === 'string') {
    return { body: JSON.stringify(stripWebhookFields(JSON.parse(body))), headers: { 'content-type': 'application/json' } };
  }
  if (body && typeof body.get === 'function' && typeof body.set === 'function') {
    const form = new FormData();
    for (const [k, v] of body.entries()) {
      if (k === 'payload_json') form.append(k, JSON.stringify(stripWebhookFields(JSON.parse(String(v)))));
      else form.append(k, v);
    }
    return { body: form, headers: {} };
  }
  throw new Error('routedPost: unsupported request body');
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST `init` (a webhook-shaped fetch init: JSON string body or FormData with a
 * `payload_json` field) to `route`. Resolves the fetch Response (`{ id }` body,
 * same as a `?wait=true` webhook). `threadId` posts inside that thread. A 429
 * with a short `retry_after` is retried once.
 */
export async function routedPost(route, init, { env = process.env, webhook = '', threadId = '', fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  const token = discordBotToken(env);
  const channelId = route ? routeChannelId(route, env) : '';
  if (!token || !channelId) {
    if (!webhook) throw new Error(`routedPost: no bot token or channel for "${route}" and no webhook fallback`);
    if (route) console.log(`::warning::discord-route: no bot token/channel id for "${route}" — falling back to the webhook channel`);
    const url = `${webhook}?wait=true${threadId ? `&thread_id=${threadId}` : ''}`;
    return fetchImpl(url, init);
  }
  const target = threadId || channelId;
  const send = () => {
    const { body, headers } = botBody(init);
    return fetchImpl(`${DISCORD_API}/channels/${target}/messages`, { method: 'POST', headers: { ...headers, Authorization: `Bot ${token}` }, body });
  };
  let res = await send();
  if (res.status === 429) {
    const retry = await res.json().catch(() => ({}));
    const wait = typeof retry.retry_after === 'number' ? retry.retry_after : 1;
    if (wait <= 10) {
      await sleepImpl(Math.ceil(wait * 1000));
      res = await send();
    }
  }
  return res;
}
