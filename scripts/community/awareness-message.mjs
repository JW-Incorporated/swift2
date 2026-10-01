// Awareness lane — Discord message builders (pure). One message per
// opportunity with the site card ATTACHED as a PNG upload (multipart webhook
// post, not an embed URL), thread title + link, sub, why, the reply text in a
// copy block, and the existing signed Posted/Skip links. The owner posts the
// reply himself; nothing here sends anything (awareness-deliver.mjs does).
import {
  DISCORD_MESSAGE_LIMIT,
  DISCORD_SUPPRESS_EMBEDS,
  TREE_AVATAR_URL,
} from './discord-delivery.mjs';
import { clipUnits, escapeLinkBrackets, oneLine, safe, urlLine } from './reply-opportunity.mjs';
import { imageCommentsLabel } from './awareness-eligibility.mjs';

export const AWARENESS_WEBHOOK_USERNAME = 'Tree · Awareness replies';
const MAX_ACK_URL_UNITS = 450;
const TRIM_NOTE = '(Reply trimmed to fit Discord.)';
const WHY_BY_TYPE = {
  ranking: 'Era/ranking debate, so a site card fits the conversation',
  timeline: 'Timeline question, so a moment card answers it at a glance',
  easter_egg: 'Easter-egg/theory thread, so a card for the moment fits',
  nostalgia: 'Nostalgia/anniversary thread, so an era card lands',
  news: 'News reaction thread, so a card shows the story behind it',
  facebook: 'Facebook group post, so a site card fits',
};

export function whyFor(lead) {
  const own = oneLine(safe(lead.why), 160);
  return own || WHY_BY_TYPE[lead.thread_type] || 'Thread where a picture of the site fits';
}

export function imageFilename(ref) {
  return `${String(ref)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .slice(0, 80)}.png`;
}

/** Header posted once per batch; `totalToday` counts every awareness opportunity delivered today including this batch. */
export function buildAwarenessHeader(totalToday, batchCount) {
  const noun = batchCount === 1 ? 'opportunity' : 'opportunities';
  return `🎯 **Awareness replies — ${totalToday} today**\nThis batch: ${batchCount} new ${noun}. Reply with the attached picture only (no link), then tap Posted or Skip.`;
}

/**
 * One awareness opportunity as Discord message text, always <= 2000 units.
 * Only the reply copy is elastic. Reddit leads keep `ref: reddit · <id>` as the
 * true last line, same as reply opportunities, so a ✅/⏭️ reaction still routes.
 */
export function buildAwarenessMessage(
  lead,
  { postedUrl = null, skipUrl = null, rule = null } = {},
) {
  const isReddit = lead.platform === 'reddit';
  const where = escapeLinkBrackets(
    oneLine(safe(isReddit ? `r/${lead.community}` : lead.community), 80),
  );
  const title = lead.title ? `**${escapeLinkBrackets(oneLine(safe(lead.title), 200))}**` : null;
  const acks =
    postedUrl &&
    skipUrl &&
    postedUrl.length <= MAX_ACK_URL_UNITS &&
    skipUrl.length <= MAX_ACK_URL_UNITS;
  const footer = acks
    ? `Done? [✅ Posted](<${postedUrl}>) · [Skip](<${skipUrl}>)`
    : 'Done? React ✅ posted · ⏭️ skip. Nothing posts automatically.';
  const postId = oneLine(lead.id, 100);
  const refLine = isReddit && postId ? `ref: reddit · ${postId}` : null;
  const label = imageCommentsLabel(lead.image_comments);
  const head = [
    `🎯 **Awareness reply · ${where}** · ${label}`,
    title,
    lead.url
      ? urlLine(lead.url)
      : lead.locator
        ? `Find it in: ${oneLine(safe(lead.locator), 160)}`
        : null,
    `Why: ${whyFor(lead)}`,
    `Image: attached card (${oneLine(safe(lead.image_ref), 90)}). Post it with the reply, no link.`,
    rule ? `Sub rule: ${oneLine(safe(rule), 140)}` : null,
  ].filter(Boolean);
  const tail = [footer, refLine].filter(Boolean);
  const reply = safe(lead.draft).replace(/```/g, '``​`').trim();
  const render = (body, note) =>
    [...head, '```', body, '```', ...(note ? [note] : []), ...tail].join('\n');

  const whole = render(reply, null);
  if (whole.length <= DISCORD_MESSAGE_LIMIT) return whole;
  const room = DISCORD_MESSAGE_LIMIT - render('', TRIM_NOTE).length;
  if (room < 120) throw new Error(`Awareness opportunity ${postId} cannot fit Discord's limit`);
  return render(clipUnits(reply, room).trimEnd(), TRIM_NOTE);
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
