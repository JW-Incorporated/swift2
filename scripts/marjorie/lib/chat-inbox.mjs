// Pure pieces of the M5 chat poll (docs/specs/marjorie-overhaul/m5-chat.md):
// which Discord messages are a founder's unanswered ask, which claims were
// never finished, what a chat routine run is called, and the context JSON its
// agent reads. No network and no env — `chat-poll.mjs` does the I/O, and
// `chat-poll.test.ts` covers both files.
import { SOCIAL_APPROVERS } from '../../social/lib/approvers.mjs';
import { authorName, hasOwnReaction, isRootOrWebhookMessage, snowflakeMs } from './discord-bot.mjs';

export const CLAIM = '👀';
export const REPLIED = '✅';
export const FAILED = '❌';
export const FAILURE_PREFIX = '[chat failed]';
export const MAX_PER_CHANNEL = 3;
export const WINDOW_MS = 24 * 60 * 60 * 1000;
export const STALE_CLAIM_MS = 45 * 60 * 1000;
export const HISTORY_LIMIT = 15;
export const SNOWFLAKE = /^\d{15,21}$/;
const HISTORY_TEXT_CAP = 1500;
const MESSAGE_TEXT_CAP = 4000;
// DEFAULT (0) and REPLY (19) are what a person types; pins, joins and
// "started a thread" notices are system types and never answered.
const HUMAN_TYPES = new Set([0, 19]);

export const BOTS = {
  marjorie: { name: 'Marjorie', channelName: 'longlive-marjorie', workflow: 'routine-marjorie-chat.yml', channelEnv: 'DISCORD_MARJORIE_CHANNEL_ID' },
  tree: { name: 'Tree', channelName: 'longlive-tree', workflow: 'routine-tree-chat.yml', channelEnv: 'DISCORD_TREE_CHANNEL_ID' },
};

/** Each chat routine sets `run-name` to exactly this, so the poll can find a claimed message's run. */
export function runTitle(bot, messageId) {
  return `${BOTS[bot].name} chat · ${messageId}`;
}

export function findRuns(runs, bot, messageId) {
  const title = runTitle(bot, messageId);
  return runs.filter((r) => r.displayTitle === title);
}

/**
 * Founder Discord ids: the `DISCORD_FOUNDER_IDS` repo variable when it holds
 * any valid id, else the ids already committed in `SOCIAL_APPROVERS` (the
 * same two founders who approve social) — so the loop needs no variable to
 * exist, and opening it wider is a one-line variable change.
 */
export function founderIds(raw = '') {
  const fromVar = String(raw || '').split(',').map((s) => s.trim()).filter((s) => SNOWFLAKE.test(s));
  if (fromVar.length) return new Set(fromVar);
  return new Set(SOCIAL_APPROVERS.map((id) => String(id).replace(/^discord:/, '')).filter((s) => SNOWFLAKE.test(s)));
}

export function messageTime(message) {
  return Date.parse(message.timestamp) || snowflakeMs(message.id);
}

/**
 * `gh run list --created >=…` value for a message: whole seconds in UTC
 * (Discord timestamps carry microseconds and `+00:00`, which GitHub's date
 * qualifier may reject), a minute early so clock skew never hides a run.
 */
export function createdSince(timestamp) {
  const ms = Date.parse(timestamp);
  return Number.isFinite(ms) ? new Date(ms - 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z') : '2015-01-01T00:00:00Z';
}

export function isFounderMessage(message, { founders, sourceId, now }) {
  if (!message || isRootOrWebhookMessage(message, sourceId)) return false;
  if (!founders.has(String(message.author?.id ?? ''))) return false;
  if (!HUMAN_TYPES.has(message.type ?? 0)) return false;
  return now - messageTime(message) <= WINDOW_MS;
}

// Without the Message Content intent Discord blanks content, embeds,
// attachments, components and polls — but not stickers.
function hasBody(m) {
  return Boolean(String(m.content || '').trim()) || [m.attachments, m.embeds, m.components].some((a) => a?.length) || Boolean(m.poll);
}

/**
 * A bot-token `[chat failed]` notice: posted by a bot account (a webhook
 * cannot reply, so a webhook post never counts) as a reply to the founder's
 * message. With `messageId`, only a notice about that message counts.
 * `selectInbox` and `lib/chat-delivery.mjs` both use this, so they agree.
 */
export function isFailureNotice(m, messageId) {
  const ref = m?.message_reference?.message_id;
  if (!m?.author?.bot || m.webhook_id || !ref || !String(m.content || '').startsWith(FAILURE_PREFIX)) return false;
  return messageId === undefined || String(ref) === String(messageId);
}

const byAge = (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || (BigInt(a.messageId) < BigInt(b.messageId) ? -1 : 1);

/**
 * `sources` = one entry per place a message can live: the channel itself
 * (`threadId: ''`) and each active thread under it. Returns
 * - `picked`: the oldest unclaimed founder messages, capped;
 * - `claimed`: founder messages carrying the bot's 👀 but neither ✅ nor ❌ —
 *   an earlier poll's handoff the poll must reconcile against the runs;
 * - `empty`: founder messages whose body came back blank — the signature of a
 *   bot without the Message Content intent, which fails the poll run.
 */
export function selectInbox(sources, { founders, now, cap = MAX_PER_CHANNEL }) {
  const picked = [];
  const claimed = [];
  const empty = [];
  for (const { channelId, threadId, messages } of sources) {
    const notices = new Set((messages || []).filter((m) => isFailureNotice(m)).map((m) => String(m.message_reference.message_id)));
    for (const m of messages || []) {
      if (!isFounderMessage(m, { founders, sourceId: threadId || channelId, now })) continue;
      const failed = hasOwnReaction(m, FAILED);
      const item = {
        messageId: m.id, channelId, threadId: threadId || '', timestamp: m.timestamp,
        length: String(m.content || '').length, failed, notified: notices.has(String(m.id)),
      };
      if (hasOwnReaction(m, CLAIM)) {
        if (!hasOwnReaction(m, REPLIED) && !failed) claimed.push(item);
      } else if (hasBody(m)) {
        picked.push(item);
      } else if (!m.sticker_items?.length) {
        empty.push(item);
      }
    }
  }
  return { picked: picked.sort(byAge).slice(0, cap), claimed: claimed.sort(byAge), empty };
}

export function dispatchArgs(repo, workflow, { messageId, channelId, threadId }) {
  return ['workflow', 'run', workflow, '--repo', repo, '--ref', 'main',
    '-f', `message_id=${messageId}`, '-f', `channel_id=${channelId}`, '-f', `thread_id=${threadId}`];
}

function clip(text, cap) {
  const s = String(text || '');
  return s.length > cap ? `${s.slice(0, cap)}…` : s;
}

function line(m) {
  return { id: m.id, author: authorName(m.author), is_bot: Boolean(m.webhook_id || m.author?.bot), at: m.timestamp, text: clip(m.content, HISTORY_TEXT_CAP) };
}

/**
 * The agent's whole view of the conversation. `history` is oldest → newest
 * and ends with the message itself. `already` is set when the bot has
 * already reacted ✅ or ❌ — a duplicate dispatch, which the chat routine's
 * context job stops before the agent runs.
 */
export function buildContext({ bot, guildId, channelId, threadId, message, history, threadRoot }) {
  const where = threadId || channelId;
  return {
    bot,
    already: hasOwnReaction(message, REPLIED) ? 'replied' : hasOwnReaction(message, FAILED) ? 'failed' : null,
    channel_id: channelId,
    thread_id: threadId || '',
    top_level: !threadId,
    message_id: message.id,
    url: `https://discord.com/channels/${guildId}/${where}/${message.id}`,
    author: authorName(message.author),
    at: message.timestamp,
    text: clip(message.content, MESSAGE_TEXT_CAP),
    replying_to: message.referenced_message ? line(message.referenced_message) : null,
    thread_root: threadRoot ? line(threadRoot) : null,
    history: history.map(line),
  };
}
