// Builds ONE Discord message per POST for the founder approval prompt
// (docs/plans/bots-v2/PLAN.md W2, C3/C4/C6; owner 2026-09-30: "I just want to
// know what we're posting"). A post is a campaign's IG+X pair, or a lone item.
// Layout: label, schedule, X text in full, IG caption trimmed with a link to
// the full draft, one-line why, the trusted `ref:` line LAST. Every message is
// guaranteed <= DISCORD_MESSAGE_HARD_CAP: fields are truncated to fit, never
// chunked. See scripts/social/approval-prompt.mjs for the sender.
import { neutralizeMentions } from '../../community/discord-delivery.mjs';
import { mediaUrlsFor, MEDIA_BASE_URL, hoursOverdue } from './queue.mjs';
import { PLATFORM_RULES, FAST_LANE_LANES } from './queue-schema.mjs';
import { pillarOf } from './feedback.mjs';
import {
  DISCORD_MESSAGE_HARD_CAP,
  angleUrl,
  asArray,
  clip,
  compactUtcStamp,
  escapeFences,
  neutralizeRefLikeLines,
  sanitizeInlineField,
  stringOrNull,
} from './approval-text.mjs';

const IG_PREVIEW_CHARS = 350;
const WHY_PREVIEW_CHARS = 180;
const LABEL_MAX_CHARS = 120;
const REASON_MAX_CHARS = 200;
const LINK_MAX_CHARS = 400;
const PLATFORM_LABEL_MAX_CHARS = 24;
// The ref line is never truncated (the poll must read it intact); a post whose
// file names make it longer than this is refused instead — see buildPostMessage.
const REF_LINE_MAX_CHARS = 700;
const MAX_FILES_PER_POST = 4;
// A file name is only ever combined into a multi-file ref line (comma-joined,
// see social-approval-poll.mjs) when it cannot contain the separator or any
// character that could break the line.
const SAFE_FILE_RE = /^[A-Za-z0-9_./-]+$/;

// Null prototype, same reasoning as queue-schema.mjs's PLATFORM_RULES:
// `draft.platform: "constructor"` must fall through to the fallback below.
const ACCOUNT_BY_PLATFORM = Object.assign(Object.create(null), {
  x: { label: 'X', handle: '@longlivetscom' },
  instagram: { label: 'Instagram', handle: '@longlivetscom' },
});

/** A post = every draft sharing a non-empty `campaign` (the poster pairs by the
 * same key, post-queue.mjs), else the draft alone. X first, then the rest. */
export function groupPosts(drafts) {
  const groups = new Map();
  let lone = 0;
  for (const draft of drafts) {
    const campaign = typeof draft?.campaign === 'string' ? draft.campaign.trim() : '';
    const safeFile = typeof draft?.file === 'string' && SAFE_FILE_RE.test(draft.file);
    const key = campaign && safeFile ? `campaign:${campaign}` : `lone:${lone++}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(draft);
  }
  const posts = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => Number(b?.platform === 'x') - Number(a?.platform === 'x'));
    for (let i = 0; i < ordered.length; i += MAX_FILES_PER_POST) posts.push(ordered.slice(i, i + MAX_FILES_PER_POST));
  }
  return posts;
}

function scheduleLine(post, now) {
  const valid = post
    .map((d) => new Date(d.scheduledAt))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (valid.length === 0) return `Posts at: ${clip(sanitizeInlineField(post[0]?.scheduledAt ?? 'n/a'), 60)} — invalid scheduledAt.`;
  const scheduled = valid[0];
  const overdue = hoursOverdue({ scheduledAt: scheduled.toISOString() }, now);
  if (overdue > 0) {
    return `Posts: ${compactUtcStamp(scheduled)} UTC — OVERDUE by ${Math.round(overdue)}h (posts on the first run after approval, retired at 48h)`;
  }
  const totalHours = Math.round((scheduled.getTime() - now.getTime()) / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const relative = days > 0 ? `in ${days}d ${totalHours - days * 24}h` : `in ${totalHours}h`;
  return `Posts: ${compactUtcStamp(scheduled)} UTC (${relative})`;
}

function lengthLabel(draft) {
  const rules = PLATFORM_RULES[draft.platform];
  const body = draft.body ?? '';
  if (!rules) return `${String(body).length} chars`;
  const approx = rules.unit.startsWith('weighted') ? '~' : '';
  return `${approx}${rules.measure(body).toLocaleString('en-US')}/${rules.maxBody.toLocaleString('en-US')}`;
}

function fullDraftLink(draft, { headSha, repo }) {
  if (!headSha || !repo || typeof draft.file !== 'string' || !SAFE_FILE_RE.test(draft.file)) return null;
  const link = angleUrl(`https://github.com/${repo}/blob/${headSha}/${draft.file}`);
  return link.length <= LINK_MAX_CHARS ? link : null;
}

function preparedBody(draft) {
  return neutralizeRefLikeLines(escapeFences(neutralizeMentions(draft.body ?? '(no body on file)')));
}

function singlePlatformLine(post) {
  if (post.length !== 1) return null;
  const reason = typeof post[0].singlePlatformReason === 'string' ? sanitizeInlineField(post[0].singlePlatformReason) : '';
  if (reason) return `Single platform: ${clip(reason, REASON_MAX_CHARS)}`;
  const account = ACCOUNT_BY_PLATFORM[post[0].platform];
  return `Only the ${account ? account.label : 'listed'} half is in this post.`;
}

/** Builds the one message for `post` (an array of drafts from groupPosts). */
export function buildPostMessage(post, pr, { now, headSha, repo, facebookCrosspost }) {
  // Fail closed BEFORE anything is built: the ref line comma-joins file names
  // and the poll splits on that comma, so a name that is not strictly safe (a
  // comma, a second path, whitespace…) could make one ✅ stamp a file the owner
  // never saw. Such a draft gets no approval post at all (buildApprovalPrompt
  // reports it) rather than a sanitized one.
  for (const d of post) {
    if (typeof d?.file !== 'string' || !SAFE_FILE_RE.test(d.file)) {
      throw new Error(`refusing to build an approval post for unsafe file name ${JSON.stringify(String(d?.file).slice(0, 120))}`);
    }
  }
  const first = post[0];
  const pillar = sanitizeInlineField(pillarOf(stringOrNull(first.campaign)) ?? 'unspecified');
  const fast = post.find((d) => FAST_LANE_LANES.includes(d.lane));
  const accounts = post.map((d) => ACCOUNT_BY_PLATFORM[d.platform]?.label ?? clip(sanitizeInlineField(d.platform), PLATFORM_LABEL_MAX_CHARS));
  const label = clip(`Tree · ${pillar}${fast ? ` · fast lane (${sanitizeInlineField(fast.lane)})` : ''}`, LABEL_MAX_CHARS);
  const titleLine = `**${label}** · ${[...new Set(accounts)].join(' + ')} · PR #${clip(sanitizeInlineField(pr.number), 12)}`;

  const mediaByDraft = post.map((d) => mediaUrlsFor({ media: asArray(d.media) }, MEDIA_BASE_URL));
  const imageUrl = mediaByDraft.find((urls) => urls.length > 0)?.[0] ?? null;
  const distinctFirst = new Set(mediaByDraft.filter((u) => u.length > 0).map((u) => u[0]));
  const extraImages = Math.max(0, ...mediaByDraft.map((u) => u.length)) - 1;
  const mediaNote = !imageUrl
    ? 'No image attached.'
    : distinctFirst.size > 1
      ? 'The halves use different images (the first is shown) — see the full drafts.'
      : extraImages > 0
        ? `+${extraImages} more image${extraImages === 1 ? '' : 's'} in the full draft.`
        : null;

  const rationale = first.critique?.rationale || first.why;
  const why = rationale ? sanitizeInlineField(rationale) : '';
  const refFiles = post.map((d) => d.file).join(',');
  const refLine = `ref: PR #${sanitizeInlineField(pr.number)} · ${headSha} · ${refFiles}`;
  if (refLine.length > REF_LINE_MAX_CHARS) {
    throw new Error(`approval post ref line is ${refLine.length} characters (max ${REF_LINE_MAX_CHARS}) — file names too long to bind safely`);
  }

  const blocks = post.map((draft) => {
    const account = ACCOUNT_BY_PLATFORM[draft.platform];
    const isX = draft.platform === 'x';
    const link = isX ? null : fullDraftLink(draft, { headSha, repo });
    const fb = facebookCrosspost && draft.platform === 'instagram' ? ' · also → your Facebook Page' : '';
    const head = `**${account ? account.label : clip(sanitizeInlineField(draft.platform), PLATFORM_LABEL_MAX_CHARS)}** · ${lengthLabel(draft)}${fb}${link ? ` · full: ${link}` : ''}`;
    return { head, text: preparedBody(draft), pref: isX ? Infinity : IG_PREVIEW_CHARS, isX };
  });

  const render = (budgets, whyMax) => {
    const lines = [titleLine, scheduleLine(post, now)];
    const single = singlePlatformLine(post);
    if (single) lines.push(single);
    if (mediaNote) lines.push(mediaNote);
    blocks.forEach((b, i) => lines.push(b.head, '```', clip(b.text, budgets[i]), '```'));
    if (why && whyMax > 0) lines.push(`Why: ${clip(why, whyMax)}`);
    lines.push(refLine);
    return lines.join('\n');
  };

  // Truncate (never chunk) until it fits: the "why" goes first, then the
  // trimmed (non-X) captions, then X — and X is cut last because it is the
  // text the owner is actually approving word for word.
  const budgets = blocks.map((b) => b.text.length).map((len, i) => Math.min(len, blocks[i].pref));
  let whyMax = WHY_PREVIEW_CHARS;
  const steps = [
    [() => whyMax, (v) => { whyMax = v; }, 0],
    ...[80, 0].flatMap((floor) => [
      [() => Math.max(0, ...budgets.filter((_, i) => !blocks[i].isX)), (v) => blocks.forEach((b, i) => { if (!b.isX) budgets[i] = Math.min(budgets[i], v); }), floor],
      [() => Math.max(0, ...budgets.filter((_, i) => blocks[i].isX)), (v) => blocks.forEach((b, i) => { if (b.isX) budgets[i] = Math.min(budgets[i], v); }), floor === 80 ? 120 : 0],
    ]),
  ];
  let content = render(budgets, whyMax);
  for (const [get, set, floor] of steps) {
    for (let guard = 0; content.length > DISCORD_MESSAGE_HARD_CAP && get() > floor && guard < 20; guard += 1) {
      set(Math.max(floor, get() - (content.length - DISCORD_MESSAGE_HARD_CAP) - 2));
      content = render(budgets, whyMax);
    }
  }
  if (content.length > DISCORD_MESSAGE_HARD_CAP) {
    throw new Error(`approval post for ${refFiles} cannot fit ${DISCORD_MESSAGE_HARD_CAP} characters even with every field cut (ref line is ${refLine.length})`);
  }

  const embeds = imageUrl ? [{ image: { url: imageUrl } }] : [];
  return { content, embeds, ...(embeds.length ? {} : { flags: 4 }) };
}
