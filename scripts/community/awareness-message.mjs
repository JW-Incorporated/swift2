// Awareness lane — Discord message builders (pure). Two messages per
// opportunity, nothing else (owner 2026-10-05: "the link, the text to post,
// and the image"): the card — the clean thread link with the site card
// ATTACHED as a PNG upload, plus the signed Posted/Skip links and the
// reaction ref line — then the reply text alone as a plain message, so
// long-press "Copy Text" on mobile copies exactly what to post. No batch
// header, title, sub, why, rule or instructions. The owner posts the reply
// himself; nothing here sends anything (awareness-deliver.mjs does).
import {
  DISCORD_MESSAGE_LIMIT,
  DISCORD_SUPPRESS_EMBEDS,
  TREE_AVATAR_URL,
} from './discord-delivery.mjs';
import { facebookFallbackLine } from './awareness-fb-link.mjs';
import { clipUnits, oneLine, safe, urlLine } from './reply-opportunity.mjs';

export const AWARENESS_WEBHOOK_USERNAME = 'Tree · Awareness replies';
const MAX_ACK_URL_UNITS = 450;
const TRIM_NOTE = '(Reply trimmed to fit Discord.)';

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
 * The reply text exactly as the owner pastes it, sent as its own message so
 * long-press "Copy Text" on mobile copies nothing else. Clipped to the
 * Discord limit; `trimmed` tells the card to say so.
 */
export function buildAwarenessReplyText(lead) {
  const reply = safe(lead.draft).trim();
  if (reply.length <= DISCORD_MESSAGE_LIMIT) return { text: reply, trimmed: false };
  return { text: clipUnits(reply, DISCORD_MESSAGE_LIMIT).trimEnd(), trimmed: true };
}

/**
 * One awareness opportunity's card as Discord message text, always <= 2000
 * units: the clean thread link (the PNG rides along as the attachment), then
 * the Posted/Skip links. The reply itself is the next message
 * (buildAwarenessReplyText), kept free of anything but the reply. Reddit leads
 * keep `ref: reddit · <id>` as the true last line, same as reply
 * opportunities, so a ✅/⏭️ reaction on the card still routes.
 */
export function buildAwarenessMessage(lead, { postedUrl = null, skipUrl = null } = {}) {
  const isReddit = lead.platform === 'reddit';
  const acks =
    postedUrl &&
    skipUrl &&
    postedUrl.length <= MAX_ACK_URL_UNITS &&
    skipUrl.length <= MAX_ACK_URL_UNITS;
  const footer = acks
    ? `[✅ Posted](<${postedUrl}>) · [Skip](<${skipUrl}>)`
    : 'React ✅ posted · ⏭️ skip';
  const postId = oneLine(lead.id, 100);
  const refLine = isReddit && postId ? `ref: reddit · ${postId}` : null;
  const link =
    (lead.url && urlLine(cleanThreadUrl(lead.url))) ||
    (lead.platform === 'facebook' && facebookFallbackLine(lead)) ||
    oneLine(safe(lead.locator), 160);
  const { trimmed } = buildAwarenessReplyText(lead);
  const text = [link, ...(trimmed ? [TRIM_NOTE] : []), footer, refLine].filter(Boolean).join('\n');
  if (text.length > DISCORD_MESSAGE_LIMIT)
    throw new Error(`Awareness opportunity ${postId} cannot fit Discord's limit`);
  return text;
}

/**
 * The multipart webhook body: `payload_json` + `files[0]` (the PNG). fetch
 * sets the multipart boundary from the FormData itself.
 */
export function buildMultipartPayload({
  content,
  png,
  filename,
  username = AWARENESS_WEBHOOK_USERNAME,
}) {
  if (content.length > DISCORD_MESSAGE_LIMIT)
    throw new Error('awareness message exceeds Discord limit');
  const form = new FormData();
  form.append(
    'payload_json',
    JSON.stringify({
      content,
      username,
      avatar_url: TREE_AVATAR_URL,
      allowed_mentions: { parse: [] },
      flags: DISCORD_SUPPRESS_EMBEDS,
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
  { perSubRemaining, deliveredToday = 0, batchCap = 7, dailyCap = 20, rank, tierOf },
) {
  const room = Math.max(0, Math.min(batchCap, dailyCap - deliveredToday));
  const ordered = [...leads].sort(
    (a, b) =>
      rank(a.image_comments) - rank(b.image_comments) ||
      tierOf(a) - tierOf(b) ||
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
