import { runMain } from '../lib/cli.mjs';
import { discordBotToken, routedPost } from '../lib/discord-route.mjs';

export const DISCORD_MESSAGE_LIMIT = 2_000;

/** Webhook display identity (Tree Overhaul S5) — matches approval-prompt.mjs's
 * TREE_WEBHOOK_USERNAME/TREE_AVATAR_URL so every message this repo posts to
 * a Discord social channel, community prompts included, shows as "Tree"
 * with the same stable avatar. `apps/web/public/social/tree-avatar.png` is a
 * placeholder (see MAP.md), served from the same host post-queue.mjs
 * publishes media from. */
export const TREE_WEBHOOK_USERNAME = 'Tree';
export const TREE_AVATAR_URL = 'https://www.longlivets.com/social/tree-avatar.png';

/** Discord message flag SUPPRESS_EMBEDS (1 << 2) — C6 in docs/plans/bots-v2/PLAN.md:
 * every webhook post turns link previews off in code, not channel permissions. */
export const DISCORD_SUPPRESS_EMBEDS = 4;

// Code spans/fences are left verbatim: a URL inside them never unfurls, and
// wrapping it would change text a founder is reading (e.g. a draft caption).
const CODE_SEGMENT_RE = /(```[\s\S]*?(?:```|$)|`[^`\n]+`)/;
const MARKDOWN_LINK_RE = /\]\((https?:\/\/[^\s()<>]+)\)/g;
const BARE_URL_RE = /(^|[^<\w/])(https?:\/\/[^\s<>]+)/g;
const TRAILING_PUNCT_RE = /[.,;:!?'"\])]+$/;

function wrapUrl(url) {
  let trail = url.match(TRAILING_PUNCT_RE)?.[0] ?? '';
  // Keep a closing paren the URL itself opened (e.g. a Wikipedia path).
  if (trail.startsWith(')') && url.slice(0, -trail.length).includes('(')) trail = trail.slice(1);
  const core = url.slice(0, url.length - trail.length);
  return core ? `<${core}>${trail}` : url;
}

/** Wraps every bare `http(s)://` URL (and plain markdown link target) outside
 * code in `<…>`, which Discord never unfurls. Already-wrapped URLs are left. */
export function angleWrapBareUrls(text) {
  return String(text ?? '')
    .split(CODE_SEGMENT_RE)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(MARKDOWN_LINK_RE, '](<$1>)')
            .replace(BARE_URL_RE, (_, lead, url) => `${lead}${wrapUrl(url)}`),
    )
    .join('');
}

/**
 * The one place every Discord message payload this repo sends turns link
 * previews off (owner 2026-10-05: "turn off link previews in all discord
 * responses"). No deliberate `embeds` → OR in SUPPRESS_EMBEDS, keeping any
 * other flag bits. With `embeds` the flag would hide them too, so it is
 * cleared and bare URLs in `content` are angle-wrapped instead. Pure.
 */
export function suppressPreviews(payload) {
  const flags = Number(payload?.flags) || 0;
  const hasEmbeds = Array.isArray(payload?.embeds) && payload.embeds.length > 0;
  if (!hasEmbeds) return { ...payload, flags: flags | DISCORD_SUPPRESS_EMBEDS };
  const rest = { ...payload };
  delete rest.flags;
  const kept = flags & ~DISCORD_SUPPRESS_EMBEDS;
  return {
    ...rest,
    ...(typeof payload.content === 'string' ? { content: angleWrapBareUrls(payload.content) } : {}),
    ...(kept ? { flags: kept } : {}),
  };
}

export function neutralizeMentions(text) {
  return String(text ?? '')
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .replace(/<@&/g, '<@\u200b&');
}

function fenceTogglesIn(str) {
  const matches = str.match(/```/g);
  return matches ? matches.length : 0;
}

// Headroom for a fence marker `balanceFences` may need to add on either end
// of a chunk \u2014 `'```\n'`/`'\n```'` are both 4 chars, so 8 covers the
// worst case (a chunk that both reopens AND has to re-close a fence).
const FENCE_MARKER_COST = 4;

/**
 * Given a run of raw chunks that may split a triple-backtick fence across a
 * boundary, closes an open fence at the end of a chunk and reopens it at
 * the start of the next so every chunk is independently valid Markdown.
 * Safe to call on chunks produced by `chunkForDiscord`'s packer, which
 * reserves `FENCE_MARKER_COST * 2` headroom on every chunk whenever the
 * content contains any fence marker at all \u2014 see its comment for why a
 * blanket reservation, not a per-chunk prediction, is what's actually safe.
 */
function balanceFences(chunks) {
  const result = [];
  let openFence = false;
  for (const chunk of chunks) {
    const prefix = openFence ? '```\n' : '';
    let body = prefix + chunk;
    let stateAfter = openFence;
    const toggles = fenceTogglesIn(chunk);
    for (let i = 0; i < toggles; i += 1) stateAfter = !stateAfter;
    if (stateAfter) body += '\n```';
    result.push(body);
    openFence = stateAfter;
  }
  return result;
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Largest cut index `<= max` (UTF-16 units, so the budget stays conservative
 * for however Discord counts) that does not split a grapheme cluster. A plain
 * `slice(0, max)` can cut an emoji's surrogate pair or a ZWJ sequence in half;
 * `JSON.stringify` then emits a lone `\uXXXX` escape, which RFC 8259 forbids.
 * If the first cluster alone exceeds `max`, falls back to a code-point-safe cut.
 */
function graphemeSafeCut(str, max) {
  let cut = 0;
  for (const { index, segment } of graphemes.segment(str)) {
    const end = index + segment.length;
    if (end > max) break;
    cut = end;
  }
  if (cut > 0) return cut;
  const code = str.charCodeAt(max - 1);
  return code >= 0xd800 && code <= 0xdbff ? max - 1 : max;
}

/**
 * Splits `content` into Discord-postable chunks, each `<= limit` chars even
 * after fence-balancing. Prefers paragraph (`\n\n`) boundaries; a single
 * paragraph that alone exceeds the pack budget falls back to a hard split
 * (rare path \u2014 most captions don't have a single >2000-char paragraph, so a
 * plain word-boundary-aware cut, not full re-wrapping, is good enough here).
 *
 * Fence safety: rather than predicting exactly which chunk boundary will
 * land inside an open fence (a per-chunk prediction that a round 1 review
 * found could still overflow `limit` by a few characters \u2014 reserving only
 * where a fence was PREDICTED open missed cases where packing multiple
 * small paragraphs together left the fence open at the end of a chunk that
 * was never separately budget-checked), this reserves `FENCE_MARKER_COST *
 * 2` off every packing decision UP FRONT, for the whole call, whenever the
 * content contains any triple-backtick fence at all. That is provably
 * enough headroom for `balanceFences` to add both a reopening prefix and a
 * closing suffix to any one chunk and still fit `limit` \u2014 simpler and
 * always correct, at the cost of possibly one extra chunk in a rare
 * long-fenced caption, which is a fine trade for a Discord message.
 */
export function chunkForDiscord(content, limit = DISCORD_MESSAGE_LIMIT) {
  const text = String(content ?? '');
  if (text.length <= limit) return [text];

  const packLimit = text.includes('```') ? limit - FENCE_MARKER_COST * 2 : limit;

  const paragraphs = text.split('\n\n');
  const rawChunks = [];
  let current = '';
  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (candidate.length <= packLimit) {
      current = candidate;
      continue;
    }
    if (current) rawChunks.push(current);
    if (para.length <= packLimit) {
      current = para;
      continue;
    }
    // Hard-split fallback: word-boundary-aware where cheap (lastIndexOf a
    // space within the budget), plain char-split otherwise.
    let remaining = para;
    while (remaining.length > packLimit) {
      let cut = remaining.lastIndexOf(' ', packLimit);
      if (cut <= 0) cut = graphemeSafeCut(remaining, packLimit);
      rawChunks.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut).replace(/^ /, '');
    }
    current = remaining;
  }
  if (current) rawChunks.push(current);

  return balanceFences(rawChunks);
}

/**
 * Sends every prompt to the configured Discord webhook one at a time,
 * never throwing on an individual failure — a transient Discord error on
 * prompt 3 of 5 must not lose the confirmed message ids for prompts 1-2.
 * `onDelivered` fires synchronously right after each confirmed send so a
 * caller (mailer.mjs) can persist that single lead's delivered status
 * immediately, before moving on to the next prompt (Fable ruling: "persist
 * each confirmed Discord message to its lead immediately").
 */
export async function postCommunityPrompts(
  prompts,
  {
    webhook = process.env.DISCORD_SOCIAL_WEBHOOK,
    fetchImpl = fetch,
    onDelivered = null,
    username = TREE_WEBHOOK_USERNAME,
    route = null,
    env = process.env,
  } = {},
) {
  if (!webhook && !(route && discordBotToken(env)))
    return { status: 'unconfigured', delivered: [], failed: [] };
  const delivered = [];
  const failed = [];
  for (const prompt of prompts) {
    try {
      if (prompt.content.length > DISCORD_MESSAGE_LIMIT) {
        throw new Error(
          `Community prompt ${prompt.id} exceeds Discord's ${DISCORD_MESSAGE_LIMIT}-character limit`,
        );
      }
      const init = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          suppressPreviews({
            content: prompt.content,
            username,
            avatar_url: TREE_AVATAR_URL,
            allowed_mentions: { parse: [] },
          }),
        ),
      };
      const response = route
        ? await routedPost(route, init, { env, webhook, fetchImpl })
        : await fetchImpl(`${webhook}?wait=true`, init);
      if (!response.ok)
        throw new Error(`Discord social-channel delivery failed with HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload?.id) throw new Error('Discord social-channel delivery returned no message id');
      const record = { leadId: prompt.id, messageId: payload.id };
      delivered.push(record);
      if (onDelivered) await onDelivered(record);
    } catch (err) {
      failed.push({ leadId: prompt.id, message: String(err?.message ?? err) });
    }
  }
  return { status: failed.length === 0 ? 'delivered' : 'partial', delivered, failed };
}

/** Best-effort one-line lead-in before a batch; never throws, never blocks the batch. */
export async function postBatchHeader(
  content,
  {
    webhook = process.env.DISCORD_SOCIAL_WEBHOOK,
    fetchImpl = fetch,
    username = TREE_WEBHOOK_USERNAME,
    route = null,
    env = process.env,
  } = {},
) {
  if (!webhook && !(route && discordBotToken(env))) return false;
  try {
    const init = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(
        suppressPreviews({ content, username, avatar_url: TREE_AVATAR_URL, allowed_mentions: { parse: [] } }),
      ),
    };
    const response = route
      ? await routedPost(route, init, { env, webhook, fetchImpl })
      : await fetchImpl(webhook, init);
    return response.ok;
  } catch {
    return false;
  }
}

export function deliveryStatusFromResult(result) {
  if (result.status === 'unconfigured') return 'unconfigured';
  if (result.status === 'delivered') return 'delivered';
  return result.failed?.length ? 'partial' : 'missing';
}

async function main() {
  throw new Error(
    'This module is called by community/mailer.mjs; it does not accept direct input.',
  );
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'discord-delivery.mjs') {
  runMain(main, { name: 'community-discord-delivery' });
}
