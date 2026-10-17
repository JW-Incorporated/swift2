// Awareness lane — Discord message builders (pure). Two messages per
// opportunity, nothing else (owner 2026-10-05: "the link, the text to post,
// and the image"): the card — the clean thread link, plus the reaction
// legend and the reaction ref line, with a site-card PNG attached
// only when the drafting step opted that lead in (text-only is the default
// since #4767, so the card text never names an attachment either way) —
// then the reply text alone in a code box as its own message, so
// the copy button / long-press on mobile copies exactly what to post. No batch
// header, title, sub, why, rule or instructions. The owner posts the reply
// himself; nothing here sends anything (awareness-deliver.mjs does).
import {
  DISCORD_MESSAGE_LIMIT,
  DISCORD_SUPPRESS_EMBEDS,
  TREE_AVATAR_URL,
} from './discord-delivery.mjs';
import { facebookFallbackLine } from './awareness-fb-link.mjs';
import { escapeLinkBrackets, oneLine, safe, urlLine } from './reply-opportunity.mjs';
import { REACTION_FOOTER, REPLY_TRIM_NOTE, buildDraftBox } from './reply-card.mjs';
import { signalParts } from './card-signals.mjs';

const FB_NAME_SEPARATOR = ' — ';

/** `r/Sub` for Reddit; the group name for Facebook (locator prefix, else the community slug). */
function communityLabel(lead) {
  if (lead.platform === 'reddit')
    return lead.community ? `r/${oneLine(safe(lead.community), 60)}` : null;
  const locator = String(lead.locator ?? '');
  const cut = locator.indexOf(FB_NAME_SEPARATOR);
  const name =
    cut > 0 ? locator.slice(0, cut) : String(lead.community ?? '').replace(/^facebook:/, '');
  return escapeLinkBrackets(oneLine(safe(name), 60)) || null;
}

export const AWARENESS_WEBHOOK_USERNAME = 'Tree · Awareness replies';

const REDDIT_HOST_RE = /^(?:(?:www|old|new|np|m)\.)?reddit\.com$/i;
const FACEBOOK_HOST_RE = /^(?:(?:www|m|web|mbasic)\.)?(?:facebook|fb)\.com$/i;
// Facebook params that identify the post/comment; everything else
// (fbclid, __cft__[0], __tn__, mibextid, rdid, ref, …) is tracking.
const FACEBOOK_ID_PARAMS = new Set([
  'story_fbid',
  'id',
  'fbid',
  'set',
  'v',
  'comment_id',
  'reply_comment_id',
  'multi_permalinks',
  'post_id',
]);
const GENERIC_TRACKING_RE = /^(?:utm_.*|fbclid|gclid|igshid|mc_cid|mc_eid|ref|ref_source)$/i;

/**
 * The thread URL with tracking stripped: Reddit → https://www.reddit.com/<path>/
 * with no query/hash; Facebook → only post/comment-identifying params; other
 * hosts → common tracking params dropped. Malformed input comes back trimmed.
 */
export function cleanThreadUrl(url) {
  const raw = String(url ?? '').trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  if (!/^https?:$/.test(parsed.protocol)) return raw;
  parsed.hash = '';
  const host = parsed.hostname;
  if (REDDIT_HOST_RE.test(host)) {
    parsed.protocol = 'https:';
    parsed.hostname = 'www.reddit.com';
    parsed.search = '';
    if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
    return parsed.toString();
  }
  const keep = FACEBOOK_HOST_RE.test(host)
    ? (key) => FACEBOOK_ID_PARAMS.has(key)
    : (key) => !GENERIC_TRACKING_RE.test(key);
  for (const key of [...parsed.searchParams.keys()])
    if (!keep(key)) parsed.searchParams.delete(key);
  return parsed.toString();
}

export function imageFilename(ref) {
  return `${String(ref)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .slice(0, 80)}.png`;
}

/**
 * Message 2 of an awareness lead: the reply alone in a code box (the shared
 * reply-card.mjs formatter, same as the mailer lane), as its own message so
 * the copy button / long-press copies exactly what to post. `trimmed` tells
 * the card to say so.
 */
export function buildAwarenessReplyText(lead) {
  return buildDraftBox(lead.draft);
}

/**
 * One awareness opportunity's card (message 1) as Discord message text, always
 * <= 2000 units: the clean thread link (the PNG rides along as the attachment)
 * and the reaction legend. The reply itself is the next message
 * (buildAwarenessReplyText). Reddit leads keep `ref: reddit · <id>` as the
 * true last line, same as reply opportunities.
 */
export function buildAwarenessMessage(
  lead,
  { position = null, total = null, now = new Date() } = {},
) {
  const isReddit = lead.platform === 'reddit';
  const postId = oneLine(lead.id, 100);
  const refLine = isReddit && postId ? `ref: reddit · ${postId}` : null;
  const permalink = lead.url ? urlLine(cleanThreadUrl(lead.url)) : null;
  const link =
    permalink ||
    (lead.platform === 'facebook' && facebookFallbackLine(lead)) ||
    oneLine(safe(lead.locator), 160);
  // The fallback link line already carries the group and excerpt, so the
  // title and group name only head a card that has a real permalink.
  const title =
    permalink && lead.title ? `**${escapeLinkBrackets(oneLine(safe(lead.title), 150))}**` : null;
  const context = [
    permalink ? communityLabel(lead) : null,
    position && total && total > 1 ? `#${position}/${total}` : null,
    ...signalParts(lead, now),
  ]
    .filter(Boolean)
    .join(' · ');
  const { trimmed } = buildAwarenessReplyText(lead);
  const text = [
    title,
    context || null,
    link,
    ...(trimmed ? [REPLY_TRIM_NOTE] : []),
    REACTION_FOOTER,
    refLine,
  ]
    .filter(Boolean)
    .join('\n');
  if (text.length > DISCORD_MESSAGE_LIMIT)
    throw new Error(`Awareness opportunity ${postId} cannot fit Discord's limit`);
  return text;
}

/**
 * The plain-JSON webhook body for a message with nothing attached — a
 * text-only card (the default since #4767) and every reply-text message.
 */
export function buildTextPayload({ content, username = AWARENESS_WEBHOOK_USERNAME }) {
  if (content.length > DISCORD_MESSAGE_LIMIT)
    throw new Error('awareness message exceeds Discord limit');
  return {
    content,
    username,
    avatar_url: TREE_AVATAR_URL,
    allowed_mentions: { parse: [] },
    flags: DISCORD_SUPPRESS_EMBEDS,
  };
}

/**
 * The multipart webhook body: `payload_json` + `files[0]` (the PNG). fetch
 * sets the multipart boundary from the FormData itself. Only used for a lead
 * the drafting step opted into a card for.
 */
export function buildMultipartPayload({
  content,
  png,
  filename,
  username = AWARENESS_WEBHOOK_USERNAME,
}) {
  const form = new FormData();
  form.append(
    'payload_json',
    JSON.stringify({
      ...buildTextPayload({ content, username }),
      attachments: [{ id: 0, filename }],
    }),
  );
  form.append('files[0]', new Blob([png], { type: 'image/png' }), filename);
  return form;
}

/**
 * Picks this batch: image-capable subs first (then unknown, then text-only),
 * lower tier first, oldest first; at most `perSubRemaining[sub]` per sub (the
 * per-sub daily cap minus today's deliveries), `batchCap` per batch, and
 * never past `dailyCap` total for the day.
 */
export function selectBatch(
  leads,
  {
    perSubRemaining,
    deliveredToday = 0,
    batchCap = 7,
    dailyCap = 20,
    rank,
    tierOf,
    heatOf = () => null,
  },
) {
  const room = Math.max(0, Math.min(batchCap, dailyCap - deliveredToday));
  // Higher engagement heat first; a lead with no signals ranks after one with
  // them and otherwise keeps the oldest-first order.
  const heat = (lead) => heatOf(lead) ?? -1;
  const ordered = [...leads].sort(
    (a, b) =>
      rank(a.image_comments) - rank(b.image_comments) ||
      tierOf(a) - tierOf(b) ||
      heat(b) - heat(a) ||
      String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')),
  );
  const used = {};
  const picked = [];
  for (const lead of ordered) {
    if (picked.length >= room) break;
    const left =
      (perSubRemaining[lead.community] ?? perSubRemaining.default) - (used[lead.community] ?? 0);
    if (left <= 0) continue;
    used[lead.community] = (used[lead.community] ?? 0) + 1;
    picked.push(lead);
  }
  return picked;
}
