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
// An unfinished 👀 claim outlives the fresh-message window: a message claimed
// at 23h58m whose dispatch then failed must still be reconciled.
export const CLAIM_WINDOW_MS = 7 * WINDOW_MS;
export const STALE_CLAIM_MS = 45 * 60 * 1000;
export const HISTORY_LIMIT = 15;
export const SNOWFLAKE = /^\d{15,21}$/;
// M7 (m7-doorbell.md Mechanics 5): the poll watches the doorbell only once its
// live proof is on #4180. A committed constant flipped by PR — `gh variable`
// is founder-only.
export const DOORBELL_LIVE = true;
// M7 operational clock gate; the installed tag pins its dispatch authority.
export const CLOCK_LIVE = true;
export const CLOCK_LIVE_SINCE = '2026-09-15T02:21:13Z';
export const DOORBELL_GRACE_MS = 60 * 1000;
export const ALARM_WORKFLOW = 'bot-chat-alarm.yml';
const HISTORY_TEXT_CAP = 1500;
const MESSAGE_TEXT_CAP = 4000;
// DEFAULT (0) and REPLY (19) are what a person types; pins, joins and
// "started a thread" notices are system types and never answered.
const HUMAN_TYPES = new Set([0, 19]);

export const BOTS = {
  marjorie: { name: 'Marjorie', channelName: 'marjorie', channelId: '1548350324891328562', workflow: 'routine-marjorie-chat.yml', channelEnv: 'DISCORD_MARJORIE_CHANNEL_ID' },
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
 * The owner's Discord id: the one founder who makes decisions (Joey; CLAUDE.md: the other founder takes
 * none). Owner direction in the growth strategy counts only from this id, never from "any founder".
 * SOCIAL_APPROVERS holds both founders and cannot separate them, so this is its own constant (the id
 * Joey's chat fixtures and docs/social/RULINGS-SOCIAL-2.md list first), overridable by the
 * `OWNER_DISCORD_ID` repo variable. A set but invalid override yields '' (no owner: nothing is recorded),
 * never a fall back to a founder.
 */
export const OWNER_DISCORD_ID = '338508192755482626';
export function ownerId(raw = '') {
  const v = String(raw || '').trim();
  if (!v) return OWNER_DISCORD_ID;
  return SNOWFLAKE.test(v) ? v : '';
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

export function isFounderMessage(message, { founders, sourceId, now, windowMs = WINDOW_MS }) {
  if (!message || isRootOrWebhookMessage(message, sourceId)) return false;
  if (!founders.has(String(message.author?.id ?? ''))) return false;
  if (!HUMAN_TYPES.has(message.type ?? 0)) return false;
  return now - messageTime(message) <= windowMs;
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

// A social approval post (scripts/social/approval-prompt.mjs): a webhook
// message whose LAST non-empty line is `ref: PR #n · <sha> · <file[,file…]|*>`
// (the same grammar social-approval-poll.mjs's REF_LINE_RE reads, narrowed to
// queue files — the weekly brief's plan-scope refs are not approval posts). An
// owner reply to one is a REJECTION the poll acts on (Bots v2 W2), not a chat ask.
// A community reply-opportunity message (`ref: reddit · <id>`, scripts/community/
// discord-delivery.mjs) is the same kind of poll target: the owner's reply to it
// is read by the poll, never by chat (W8, W2 review LOW).
const APPROVAL_POST_REF = /^ref: (?:PR #\d+ · [0-9a-f]{40} · (?:\*|.+\.json)|reddit · .+)$/;

export function isApprovalPost(m) {
  if (!m?.webhook_id) return false;
  const lines = String(m.content ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  return APPROVAL_POST_REF.test(lines[lines.length - 1] ?? '');
}

const byAge = (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || (BigInt(a.messageId) < BigInt(b.messageId) ? -1 : 1);

/**
 * `sources` = one entry per place a message can live: the channel itself
 * (`threadId: ''`) and each active thread under it. Returns
 * - `picked`: the oldest unclaimed founder messages, capped;
 * - `claimed`: founder messages carrying the bot's 👀 but neither ✅ nor ❌ —
 *   an earlier poll's handoff the poll must reconcile against the runs, kept
 *   for CLAIM_WINDOW_MS within the pages read, not just the fresh window;
 * - `empty`: founder messages whose body came back blank — the signature of a
 *   bot without the Message Content intent, which fails the poll run.
 */
export function selectInbox(sources, { founders, now, cap = MAX_PER_CHANNEL, parents }) {
  const picked = [];
  const claimed = [];
  const empty = [];
  const unresolved = [];
  const byId = new Map();
  for (const { messages } of sources) for (const m of messages || []) byId.set(String(m.id), m);
  const parentOf = (m) => {
    const parentId = m.message_reference?.message_id;
    return parentId ? (m.referenced_message ?? byId.get(String(parentId)) ?? parents?.get(String(parentId))) : undefined;
  };
  for (const { channelId, threadId, messages } of sources) {
    // A thread started from an approval post is the owner's rejection channel for it.
    if (threadId && isApprovalPost(byId.get(String(threadId)))) continue;
    const notices = new Set((messages || []).filter((m) => isFailureNotice(m)).map((m) => String(m.message_reference.message_id)));
    for (const m of messages || []) {
      const windowMs = hasOwnReaction(m, CLAIM) ? CLAIM_WINDOW_MS : WINDOW_MS;
      if (!isFounderMessage(m, { founders, sourceId: threadId || channelId, now, windowMs })) continue;
      const parentId = m.message_reference?.message_id;
      const parent = parentOf(m);
      if (parent && isApprovalPost(parent)) continue; // a rejection reply, not a chat ask
      // `parents` is passed by the poll after its bounded fetch of out-of-window
      // parents; a reply whose parent is still unknown then cannot be shown NOT
      // to be a reply to an approval post, so it is conservatively not chat (W8).
      if (parentId && !parent && parents && !hasOwnReaction(m, CLAIM)) {
        unresolved.push(String(m.id));
        continue;
      }
      const failed = hasOwnReaction(m, FAILED);
      const item = {
        messageId: m.id, channelId, threadId: threadId || '', timestamp: m.timestamp,
        length: String(m.content || '').length, failed, notified: notices.has(String(m.id)),
        doorbell: hasOthersReaction(m, CLAIM), sticker: Boolean(m.sticker_items?.length),
      };
      // Settled without a claim (e.g. a force_fail smoke run): never re-claim.
      if (!hasOwnReaction(m, CLAIM) && (failed || hasOwnReaction(m, REPLIED))) continue;
      if (hasOwnReaction(m, CLAIM)) {
        if (!hasOwnReaction(m, REPLIED) && !failed) claimed.push(item);
      } else if (hasBody(m)) {
        picked.push(item);
      } else if (!m.sticker_items?.length) {
        empty.push(item);
      }
    }
  }
  return { picked: picked.sort(byAge).slice(0, cap), claimed: claimed.sort(byAge), empty, unresolved };
}

/**
 * Founder messages in the window that reply to a message no source holds and
 * Discord did not embed — the poll fetches these parents (bounded) before
 * `selectInbox`, so an old approval post's reply is recognised as a rejection.
 * Returns `{ id, where }` (`where` = the thread or channel to GET it from).
 */
export function missingParents(sources, { founders, now }) {
  const known = new Set();
  for (const { messages } of sources) for (const m of messages || []) known.add(String(m.id));
  const out = [];
  for (const { channelId, threadId, messages } of sources) {
    for (const m of messages || []) {
      const parentId = m.message_reference?.message_id;
      if (!parentId || m.referenced_message || known.has(String(parentId))) continue;
      if (!isFounderMessage(m, { founders, sourceId: threadId || channelId, now })) continue;
      if (!out.some((o) => o.id === String(parentId))) out.push({ id: String(parentId), where: threadId || channelId });
    }
  }
  return out;
}

export function dispatchArgs(repo, workflow, { messageId, channelId, threadId }) {
  return ['workflow', 'run', workflow, '--repo', repo, '--ref', 'main',
    '-f', `message_id=${messageId}`, '-f', `channel_id=${channelId}`, '-f', `thread_id=${threadId}`];
}

/**
 * Someone other than this bot reacted `emoji`. On a message the poll has not
 * claimed, a 👀 like that is the doorbell's (or, rarely, a founder's own).
 */
export function hasOthersReaction(message, emoji) {
  const r = Array.isArray(message?.reactions) ? message.reactions.find((x) => x?.emoji?.name === emoji) : null;
  return Boolean(r) && Number(r.count ?? 1) > (r.me ? 1 : 0);
}

export function alarmArgs(repo, stage, { bot = '', messageId = '', channelId = '', threadId = '' } = {}) {
  return ['workflow', 'run', ALARM_WORKFLOW, '--repo', repo, '--ref', 'main', '-f', `stage=${stage}`,
    '-f', `bot=${bot}`, '-f', `message_id=${messageId}`, '-f', `channel_id=${channelId}`, '-f', `thread_id=${threadId}`];
}

/**
 * m7-doorbell.md Mechanics 5, for one message the poll would claim while
 * DOORBELL_LIVE. `runs` = this message's chat runs (only read when the
 * doorbell's 👀 is on it). Returns one of
 * - `{ action: 'skip', why }`: the doorbell's run is still going, or it rang
 *   under a minute ago;
 * - `{ action: 'claim-only', why }`: its run ended before `context` claimed
 *   the message (cancelled, say). Claim it so the 45-minute reconcile settles
 *   it, and never start agent work for it twice;
 * - `{ action: 'claim', alarm }`: claim, raise `alarm` if set, then dispatch.
 * A sticker message raises no alarm: the doorbell skips stickers by design.
 */
export function doorbellWatch(item, { now, runs = [] }) {
  const young = now - messageTime(item) < DOORBELL_GRACE_MS;
  if (item.doorbell) {
    if (runs.some((run) => run.status !== 'completed')) return { action: 'skip', why: 'the doorbell dispatched it and its run is still going' };
    if (runs.length) return { action: 'claim-only', why: 'its run ended before context claimed it' };
    if (young) return { action: 'skip', why: 'the doorbell rang under a minute ago with no run yet' };
    return { action: 'claim', alarm: 'doorbell-dispatch-failed' };
  }
  return { action: 'claim', alarm: young || item.sticker ? null : 'doorbell-missed' };
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
