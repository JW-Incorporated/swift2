// The doorbell's pure half (Marjorie Overhaul M7,
// docs/specs/marjorie-overhaul/m7-doorbell.md). No network, no env reads, no
// timers — `doorbell.mjs` does the I/O. Which founder messages ring the bell
// (the poll's own `isFounderMessage`, so the two selections cannot drift),
// where each channel and thread lives, what a dispatch says, and whether a
// rung message is stuck. Tests: `doorbell-core.test.ts`.
import { BOTS, SNOWFLAKE, founderIds, isFounderMessage } from '../../marjorie/lib/chat-inbox.mjs';

export const REPO = 'JW-Incorporated/swift2';
export const GITHUB_API = 'https://api.github.com';
export const ALARM_WORKFLOW = 'bot-chat-alarm.yml';
// GUILDS (1 << 0) | GUILD_MESSAGES (1 << 9), no privileged intent. Without
// Message Content the gateway still sends every MESSAGE_CREATE with its ids,
// author, type and stickers; the doorbell never needs the text.
export const INTENTS = (1 << 0) | (1 << 9);
export const STUCK = '⚠️';
// A normal reply takes 2.5–3.5 minutes. After a week of `finish`'s
// `replied in <n>s` records this becomes the slowest normal reply plus a
// margin (spec Mechanics 8): one constant, one PR.
export const STUCK_MS = 6 * 60 * 1000;
export const SEEN_CAP = 500;
// PUBLIC_THREAD (11), PRIVATE_THREAD (12), ANNOUNCEMENT_THREAD (10).
const THREAD_TYPES = new Set([10, 11, 12]);

/** The env file's two tokens, plus optional pins. Never returns a token in `problems`. */
export function parseConfig(env = {}) {
  const problems = [];
  const discordToken = String(env.DOORBELL_DISCORD_TOKEN || '').trim();
  const githubToken = String(env.DOORBELL_GITHUB_TOKEN || '').trim();
  if (!discordToken) problems.push('DOORBELL_DISCORD_TOKEN is not set');
  if (!githubToken) problems.push('DOORBELL_GITHUB_TOKEN is not set');
  const guildId = String(env.DOORBELL_GUILD_ID || '').trim();
  if (guildId && !SNOWFLAKE.test(guildId)) problems.push('DOORBELL_GUILD_ID is not a Discord id');
  const founders = founderIds(env.DOORBELL_FOUNDER_IDS);
  if (!founders.size) problems.push('no founder Discord ids');
  return { ok: problems.length === 0, problems, discordToken, githubToken, guildId, founders };
}

/** Insertion-ordered set of the last `cap` rung message ids. */
export function createSeen(cap = SEEN_CAP) {
  const ids = new Set();
  return {
    has: (id) => ids.has(String(id)),
    add(id) {
      ids.add(String(id));
      if (ids.size > cap) ids.delete(ids.values().next().value);
    },
    get size() {
      return ids.size;
    },
  };
}

/**
 * Where a message can live. The two chat channels are found by name
 * (`BOTS[bot].channelName`); threads by their parent, from GUILD_CREATE, the
 * thread events and a `GET /channels/{id}` fallback. `resolve` returns the
 * place for one of ours, `null` for a channel or thread known to be elsewhere,
 * and `undefined` for an id never seen.
 */
export function createChannelMap({ guildId = '' } = {}) {
  const byName = new Map(Object.entries(BOTS).map(([bot, cfg]) => [cfg.channelName, bot]));
  const channels = new Map(); // channel id → bot, or null for any other channel
  const threads = new Map(); // thread id → parent channel id
  const inGuild = (item) => !guildId || !item?.guild_id || String(item.guild_id) === guildId;
  const map = {
    channel(c) {
      if (!c?.id || !inGuild(c)) return;
      if (THREAD_TYPES.has(c.type)) {
        map.thread(c);
        return;
      }
      channels.set(String(c.id), byName.get(c.name) || null);
    },
    thread(t) {
      if (t?.id && t.parent_id && inGuild(t)) threads.set(String(t.id), String(t.parent_id));
    },
    forget(id) {
      channels.delete(String(id));
      threads.delete(String(id));
    },
    guild(g) {
      if (!g?.id || (guildId && String(g.id) !== guildId)) return;
      for (const c of g.channels || []) map.channel({ ...c, guild_id: g.id });
      for (const t of g.threads || []) map.thread({ ...t, guild_id: g.id });
    },
    threadListSync(d) {
      for (const t of d?.threads || []) map.thread({ ...t, guild_id: d.guild_id });
    },
    resolve(id) {
      const key = String(id);
      if (channels.has(key)) {
        const bot = channels.get(key);
        return bot ? { bot, channelId: key, threadId: '' } : null;
      }
      if (threads.has(key)) {
        const parent = threads.get(key);
        const bot = channels.get(parent);
        if (bot) return { bot, channelId: parent, threadId: key };
        return channels.has(parent) ? null : undefined;
      }
      return undefined;
    },
    /** `{ marjorie: id|null, tree: id|null }` */
    ids() {
      const out = Object.fromEntries(Object.keys(BOTS).map((bot) => [bot, null]));
      for (const [id, bot] of channels) if (bot) out[bot] = id;
      return out;
    },
  };
  return map;
}

/**
 * One MESSAGE_CREATE → what the doorbell does:
 *   { ring: { bot, channelId, threadId } }  react 👀 and dispatch
 *   { lookup: channelId }                   a founder wrote in a place never seen:
 *                                           GET /channels/{id}, then decide again
 *   { skip: reason }                        everything else — every bot, webhook,
 *                                           thread-root, non-founder and sticker message
 */
export function ringDecision(message, { channels, founders, seen, now, guildId = '' }) {
  if (!message?.id || !message.channel_id) return { skip: 'malformed' };
  if (!message.guild_id) return { skip: 'not in a guild' };
  if (guildId && String(message.guild_id) !== guildId) return { skip: 'another guild' };
  if (seen.has(message.id)) return { skip: 'already rung' };
  const place = channels.resolve(message.channel_id);
  if (place === null) return { skip: 'another channel' };
  // The poll skips sticker-only messages, and without Message Content a
  // sticker with text looks the same as one without.
  if (message.sticker_items?.length) return { skip: 'sticker' };
  const sourceId = place ? place.threadId || place.channelId : String(message.channel_id);
  if (!isFounderMessage(message, { founders, sourceId, now })) return { skip: 'not a founder message' };
  if (place === undefined) return { lookup: String(message.channel_id) };
  return { ring: place };
}

export function readyLine(ids, founders) {
  const missing = Object.entries(BOTS).filter(([bot]) => !ids[bot]).map(([, cfg]) => `#${cfg.channelName}`);
  if (missing.length) return `not ready: ${missing.join(' and ')} not found in the guild`;
  const names = Object.entries(BOTS).map(([bot, cfg]) => `#${cfg.channelName} (${ids[bot]})`);
  return `ready: ${names.join(' and ')}; ${founders.size} founder id(s)`;
}

/** `POST …/actions/workflows/<file>/dispatches` on `main`; every input is sent as a string. */
export function workflowDispatch(workflow, inputs = {}, repo = REPO) {
  const strings = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, String(v ?? '')]));
  return {
    method: 'POST',
    url: `${GITHUB_API}/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    body: { ref: 'main', inputs: strings },
  };
}

/** The same inputs the poll sends (`dispatchArgs`), so doorbell- and poll-started runs are alike. */
export function chatDispatch({ bot, channelId, threadId }, messageId) {
  return workflowDispatch(BOTS[bot].workflow, { message_id: messageId, channel_id: channelId, thread_id: threadId || '' });
}

export function stuckDispatch({ bot, channelId, threadId }, messageId) {
  return workflowDispatch(ALARM_WORKFLOW, { bot, message_id: messageId, channel_id: channelId, thread_id: threadId || '', stage: 'stuck' });
}

/**
 * After STUCK_MS, from the two `GET …/reactions/{emoji}` reads (✅ then ❌):
 *   settled  a bot account put either on the message — founders are not bots,
 *            and the doorbell never adds either
 *   gone     the message was deleted
 *   unknown  a read failed; the alarm's `check` job re-reads before alerting
 *   stuck    neither is there
 */
export function stuckDecision(replied, failed) {
  const reads = [replied, failed];
  if (reads.some((r) => r?.ok && Array.isArray(r.data) && r.data.some((user) => user?.bot))) return 'settled';
  if (reads.some((r) => r?.status === 404)) return 'gone';
  if (reads.some((r) => !r?.ok)) return 'unknown';
  return 'stuck';
}
