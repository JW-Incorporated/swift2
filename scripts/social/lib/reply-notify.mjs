// Pure pieces of the reply notifier: the dedupe ledger, the Discord message
// text, and the webhook send. No Graph calls (reply-sources.mjs) and no CLI
// (scripts/social/reply-notifier.mjs) in here, so every rule is unit-testable.
//
// Ledger (reply-ledger.json on the dedicated `social-reply-ledger` branch):
//   { version: 1, seeded: { <source>: <iso> }, seen: { <item id>: <iso> },
//     disabledLogged: { <source>: <iso> } }
// `seeded[source]` is set once a source has been read cleanly. Until then that
// source is on its FIRST run: only items from the last 24h notify, everything
// older is recorded silently, so turning the notifier on never floods the
// channel. After that any unseen item notifies, except one older than
// STALE_DAYS, which is recorded silently too (that bound is also what makes
// pruning `seen` after PRUNE_DAYS safe — a pruned id can never resurface).
// `disabledLogged[source]` throttles the "source disabled" log line to once a
// day (the DM source is disabled until the token carries its scope).
import {
  DISCORD_MESSAGE_LIMIT,
  DISCORD_SUPPRESS_EMBEDS,
  TREE_AVATAR_URL,
  neutralizeMentions,
} from '../../community/discord-delivery.mjs';

export const REPLIES_WEBHOOK_USERNAME = 'Tree · Replies';
export const BATCH_CAP = 15;
export const COMMENT_MAX = 300;
export const DM_MAX = 200;
export const FIRST_RUN_HOURS = 24;
export const STALE_DAYS = 7;
export const PRUNE_DAYS = 180;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export function emptyLedger() {
  return { version: 1, seeded: {}, seen: {}, disabledLogged: {} };
}

export function parseLedger(text) {
  if (!text || !text.trim()) return emptyLedger();
  const data = JSON.parse(text);
  if (data?.version !== 1 || typeof data.seen !== 'object' || data.seen === null) {
    throw new Error('reply ledger has an unexpected shape — refusing to run (would re-notify everything)');
  }
  return {
    version: 1,
    seeded: { ...(data.seeded ?? {}) },
    seen: { ...data.seen },
    disabledLogged: { ...(data.disabledLogged ?? {}) },
  };
}

export function serializeLedger(ledger, now = Date.now()) {
  const cutoff = now - PRUNE_DAYS * DAY_MS;
  const seen = Object.fromEntries(
    Object.entries(ledger.seen)
      .filter(([, at]) => !(Date.parse(at) < cutoff))
      .sort(([a], [b]) => (a < b ? -1 : 1)),
  );
  const disabledLogged = ledger.disabledLogged ?? {};
  return `${JSON.stringify({ version: 1, seeded: ledger.seeded, seen, disabledLogged }, null, 2)}\n`;
}

/**
 * Splits freshly collected items into `toNotify` (oldest first) and `silent`
 * (record in the ledger without a message). Items already in `ledger.seen`
 * are dropped. Does not mutate the ledger.
 */
export function planNotifications(items, ledger, now = Date.now()) {
  const toNotify = [];
  const silent = [];
  const queued = new Set();
  for (const item of items) {
    if (ledger.seen[item.id] || queued.has(item.id)) continue;
    queued.add(item.id);
    const age = now - Date.parse(item.timestamp ?? '');
    const known = !Number.isNaN(age);
    const firstRun = !ledger.seeded[item.source];
    const limit = firstRun ? FIRST_RUN_HOURS * HOUR_MS : STALE_DAYS * DAY_MS;
    if (known && age > limit) silent.push(item);
    else toNotify.push(item);
  }
  toNotify.sort((a, b) => (Date.parse(a.timestamp ?? '') || 0) - (Date.parse(b.timestamp ?? '') || 0));
  return { toNotify, silent };
}

// Control characters, zero-width and bidi/line-separator code points, built from
// numeric ranges so no invisible character lives in this source file.
const INVISIBLE = new RegExp(
  `[${[[0, 0x1f], [0x7f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060], [0xfeff]]
    .map((range) => range.map((code) => String.fromCharCode(code)).join('-'))
    .join('')}]`,
  'g',
);

const MARKDOWN_SPECIALS = /[\\`*_~|>#[\]()<]/g;

/**
 * Makes user-controlled text inert in a Discord message: one line (no fake
 * headers/quotes/code fences), control + zero-width characters dropped,
 * markdown and `<@id>`/`<#id>`/`<:emoji:>` syntax escaped, @everyone/@here/
 * role pings neutralised (allowed_mentions: parse [] is the second layer).
 */
export function sanitizeUserText(text, max = COMMENT_MAX) {
  let flat = String(text ?? '')
    .replace(INVISIBLE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length > max) flat = `${flat.slice(0, max - 1)}…`;
  return neutralizeMentions(flat.replace(MARKDOWN_SPECIALS, '\\$&'));
}

function safeLink(url) {
  return /^https:\/\/([a-z0-9-]+\.)?(instagram|facebook|fb)\.com\//i.test(url ?? '') ? url : '';
}

const HEADLINES = {
  ig_comment: (i) => `💬 New IG comment on "${i.post}"`,
  ig_reply: (i) => `💬 New IG reply on "${i.post}"`,
  fb_comment: (i) => `💬 New FB comment on "${i.post}"`,
  ig_mention: () => '📣 New IG mention/tag',
  ig_dm: () => '✉️ New IG DM',
};

export function formatItem(item) {
  const isDm = item.kind === 'ig_dm';
  const build = (commentMax) => {
    const parts = {
      post: sanitizeUserText(item.postSnippet, 60),
      user: sanitizeUserText(item.username, 40),
      comment: sanitizeUserText(item.text, isDm ? Math.min(commentMax, DM_MAX) : commentMax),
    };
    const headline = (HEADLINES[item.kind] ?? HEADLINES.ig_comment)(parts);
    const quoted = parts.comment ? `: "${parts.comment}"` : '';
    const link = safeLink(item.permalink);
    const who = isDm ? ` from @${parts.user}` : ` — @${parts.user}`;
    return `${headline}${who}${quoted}${link ? `\n${link}` : ''}`;
  };
  let message = build(COMMENT_MAX);
  for (let max = 200; message.length > DISCORD_MESSAGE_LIMIT && max >= 0; max -= 50) message = build(max);
  return message.slice(0, DISCORD_MESSAGE_LIMIT);
}

export function moreLine(remaining) {
  return `➕ +${remaining} more new ${remaining === 1 ? 'item' : 'items'} waiting — they post on the next run.`;
}

/** One webhook post. Returns { ok, status }; retries once on a 429. Never throws. */
export async function postDiscord(content, { webhook, fetchImpl = fetch }) {
  const send = () =>
    fetchImpl(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content,
        username: REPLIES_WEBHOOK_USERNAME,
        avatar_url: TREE_AVATAR_URL,
        allowed_mentions: { parse: [] },
        flags: DISCORD_SUPPRESS_EMBEDS,
      }),
    });
  try {
    let res = await send();
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const waitMs = Math.min(Math.max(Number(body?.retry_after ?? 1), 0.2), 10) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      res = await send();
    }
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
