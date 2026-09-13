// Has this founder message already been answered? (Marjorie Overhaul M5,
// docs/specs/marjorie-overhaul/m5-chat.md, Mechanics 1 and 3.) One check,
// shared by the chat routines' `finish` step and the poll's reconcile, so a
// failure notice goes out only when no reply or notice is already there.
// Discord shows `<!-- -->` as literal text, so the check reads what is
// actually in the channel and adds no hidden markers:
//
//   settled   the founder message carries the bot's own ✅ or ❌
//   replied   a webhook post under the bot's name that answers it:
//             - anywhere in the reply thread started on the message
//               (that thread's id is the message's id), or
//             - in the message's own thread, after it and before the next
//               human message there, or
//             - at channel top level, starting `↪ <link to the message>`
//               (the fallback when Discord refused a thread)
//   notified  a bot-token `[chat failed]` notice that replies to it
//             (lib/chat-inbox.mjs isFailureNotice, which the poll also uses)
//   open      none of the above
//
// A read that fails returns `ok: false`, and callers then send nothing. The
// one exception is a 404 on the reply thread: it was never created, so it is
// empty. The bot token is used only in `run:` steps and never in an agent step.
import { BOTS, FAILED, FAILURE_PREFIX, REPLIED, founderIds, isFailureNotice } from './chat-inbox.mjs';
import { DISCORD_API, defaultSleep, discordRequest, hasOwnReaction } from './discord-bot.mjs';

/**
 * True only for a message a founder typed: not a webhook post, not a bot, and
 * authored by one of the poll's founder ids (`DISCORD_FOUNDER_IDS`, else
 * approvers.mjs). A write path checks this even when `context` never ran
 * (Codex review of the allowed_bots fix).
 */
export function writtenByFounder(message, rawFounderIds = '') {
  const author = message?.author;
  return Boolean(message) && !message.webhook_id && !author?.bot && founderIds(rawFounderIds).has(String(author?.id ?? ''));
}

const PAGE = 100;
const MAX_PAGES = 10;
// DEFAULT (0) and REPLY (19): what a person types (as in chat-inbox.mjs).
const HUMAN_TYPES = new Set([0, 19]);
const LINK_LINE = /^↪ https:\/\/discord\.com\/channels\/[^/\s]+\/\d+\/(\d+)$/;

const newer = (id) => (m) => { try { return BigInt(m.id) > BigInt(id); } catch { return false; } };
const ascending = (a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0);

function isHuman(m) {
  return !m.webhook_id && !m.author?.bot && HUMAN_TYPES.has(m.type ?? 0);
}

// Assumes only chat-post.mjs sends webhook posts under the bot's name into a
// founder's thread; nothing else carries a correlation id. A new automation
// that posts as Marjorie or Tree with `thread_id` would read as a reply here
// (reviewer note on the M5 routines PR).
export function isBotReply(m, bot) {
  return Boolean(m?.webhook_id) && m.author?.username === BOTS[bot]?.name;
}

/**
 * A top-level reply's first line links the founder message. Match the id at
 * the end of the link as well as the full URL, because the context job writes
 * guild `@me` when its channel read fails and the poll uses the real guild id.
 */
export function linksTo(content, messageId, messageUrl = '') {
  const first = String(content || '').split('\n', 1)[0].trim();
  if (messageUrl && first === `↪ ${messageUrl}`) return true;
  return LINK_LINE.exec(first)?.[1] === String(messageId);
}

/**
 * Pure: the state of one founder message. `sourceMessages` are the messages in
 * the place the founder wrote (its thread, or the channel). `replyMessages`
 * are the messages in the reply thread when that is a different place.
 */
export function classifyDelivery({ bot, messageId, message, sourceThreadId = '', replyThreadId = '', messageUrl = '', sourceMessages = [], replyMessages = [] }) {
  if (hasOwnReaction(message, REPLIED) || hasOwnReaction(message, FAILED)) return 'settled';
  const after = sourceMessages.filter(newer(messageId)).sort(ascending);
  const inReplyThread = String(replyThreadId) === String(messageId) ? replyMessages : [];
  let replied = inReplyThread.some((m) => isBotReply(m, bot));
  if (sourceThreadId) {
    const next = after.findIndex(isHuman);
    replied ||= (next < 0 ? after : after.slice(0, next)).some((m) => isBotReply(m, bot));
  } else {
    replied ||= after.some((m) => isBotReply(m, bot) && linksTo(m.content, messageId, messageUrl));
  }
  if (replied) return 'replied';
  if ([...after, ...replyMessages].some((m) => isFailureNotice(m, messageId))) return 'notified';
  return 'open';
}

/** Every message after `messageId` in `where`, walking forward in pages of 100. */
async function readAfter(where, messageId, { token, opts, missingIsEmpty = false }) {
  const messages = [];
  let cursor = String(messageId);
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const r = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages?after=${cursor}&limit=${PAGE}`, token, opts);
    if (r.status === 404 && missingIsEmpty && page === 0) return { ok: true, messages };
    if (!r.ok) return { ok: false, detail: `read of ${where} -> HTTP ${r.status}` };
    const batch = Array.isArray(r.data) ? r.data : [];
    messages.push(...batch);
    if (batch.length < PAGE) return { ok: true, messages };
    cursor = batch.reduce((max, m) => (BigInt(m.id) > BigInt(max) ? m.id : max), cursor);
  }
  return { ok: false, detail: `read of ${where} hit ${MAX_PAGES} pages` };
}

/**
 * I/O: reads the founder message and what came after it, then classifies.
 * For a top-level message with no `replyThreadId`, the thread a reply would
 * be in is the one with the message's id; a 404 there means none was made.
 * Resolves `{ ok: true, state }` or `{ ok: false, detail }`, and never throws.
 */
export async function readDeliveryState({ bot, messageId, channelId, sourceThreadId = '', replyThreadId = '', messageUrl = '', token, fetchImpl = fetch, sleepImpl = defaultSleep }) {
  const opts = { fetchImpl, sleepImpl };
  const where = sourceThreadId || channelId;
  const replyIn = replyThreadId || (sourceThreadId ? '' : messageId);
  try {
    const own = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages/${messageId}`, token, opts);
    if (!own.ok) return { ok: false, detail: `message ${messageId} -> HTTP ${own.status}` };
    // `message` lets a caller check who wrote it before writing anything.
    if (hasOwnReaction(own.data, REPLIED) || hasOwnReaction(own.data, FAILED)) return { ok: true, state: 'settled', message: own.data };
    const source = await readAfter(where, messageId, { token, opts });
    if (!source.ok) return source;
    const reply = replyIn && replyIn !== where ? await readAfter(replyIn, messageId, { token, opts, missingIsEmpty: true }) : { ok: true, messages: [] };
    if (!reply.ok) return reply;
    const state = classifyDelivery({
      bot, messageId, message: own.data, sourceThreadId, replyThreadId: replyIn === where ? '' : replyIn, messageUrl,
      sourceMessages: source.messages, replyMessages: reply.messages,
    });
    return { ok: true, state, message: own.data };
  } catch (err) {
    return { ok: false, detail: `Discord read failed: ${err.message}` };
  }
}

/** The bot-token notice: a reply to the founder's message (a webhook cannot reply). */
export function failureBody(messageId, runUrl = '') {
  return {
    content: `${FAILURE_PREFIX} ${runUrl ? `${runUrl} ` : ''}— please send it again`,
    allowed_mentions: { parse: [] },
    message_reference: { message_id: messageId, fail_if_not_exists: false },
  };
}

export async function postFailure({ where, messageId, runUrl, token, fetchImpl = fetch, sleepImpl = defaultSleep }) {
  return discordRequest('POST', `${DISCORD_API}/channels/${where}/messages`, token, { fetchImpl, sleepImpl, body: failureBody(messageId, runUrl) });
}
