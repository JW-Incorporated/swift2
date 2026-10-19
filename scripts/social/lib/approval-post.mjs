// Builds ONE Discord message per POST for the founder approval prompt
// (docs/plans/bots-v2/PLAN.md W2, C3/C4/C6; owner 2026-09-30: "I just want to
// know what we're posting"). A post is a campaign's IG+X pair, or a lone item.
// Layout (minimal, #5989): the image(s), then each caption in its own code box
// (labelled IG / X only when a pair). The trusted ref rides invisibly in the
// image embed `url`. Every message is <= DISCORD_MESSAGE_HARD_CAP: captions are
// truncated to fit, never chunked. See scripts/social/approval-prompt.mjs for the sender.
import { neutralizeMentions } from '../../community/discord-delivery.mjs';
import { mediaUrlsFor, MEDIA_BASE_URL } from './queue.mjs';
import {
  DISCORD_MESSAGE_HARD_CAP,
  asArray,
  clip,
  escapeFences,
  buildRefUrl,
  neutralizeRefLikeLines,
  sanitizeInlineField,
} from './approval-text.mjs';

const PLATFORM_LABEL_MAX_CHARS = 24;
// The ref line is never truncated (the poll must read it intact); a post whose
// file names make it longer than this is refused instead — see buildPostMessage.
const REF_LINE_MAX_CHARS = 700;
const MAX_FILES_PER_POST = 4;
// A file name is only ever combined into a multi-file ref line (comma-joined,
// see social-approval-poll.mjs) when it cannot contain the separator or any
// character that could break the line.
const SAFE_FILE_RE = /^social\/queue\/[A-Za-z0-9_.-]+\.json$/;

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

function preparedBody(draft) {
  return neutralizeRefLikeLines(escapeFences(neutralizeMentions(draft.body ?? '(no body on file)')));
}

/** Builds the one message for `post` (an array of drafts from groupPosts).
 * Minimal by owner decision (#5989): only the image(s) and each caption in its
 * own code box (labelled IG / X only for a pair). The machine-read `ref:` line
 * is carried in the image embed's `url` (no title/footer/author, so nothing
 * renders for it), never in the visible content. */
export function buildPostMessage(post, pr, { headSha }) {
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
  const refFiles = post.map((d) => d.file).join(',');
  const refLine = `ref: PR #${sanitizeInlineField(pr.number)} · ${headSha} · ${refFiles}`;
  if (refLine.length > REF_LINE_MAX_CHARS) {
    throw new Error(`approval post ref line is ${refLine.length} characters (max ${REF_LINE_MAX_CHARS}) — file names too long to bind safely`);
  }

  const images = [];
  for (const d of post) {
    const url = mediaUrlsFor({ media: asArray(d.media) }, MEDIA_BASE_URL)[0];
    if (url && !images.includes(url)) images.push(url);
  }
  // Every image embed gets the SAME ref url on purpose: Discord merges embeds
  // that share a url into one gallery, which suits a pair; the ref is still on
  // embed[0], and the array keeps one entry per image so approval-prompt.mjs's
  // embeds.length === accepted check stays exact. A post with no image gets a
  // url-only embed with a zero-width description: Discord may drop a fully
  // empty embed, and U+200B is the least visible content it accepts.
  if (!/^[0-9a-f]{40}$/.test(String(headSha))) throw new Error('approval post needs a 40-hex head sha');
  const refUrl = buildRefUrl(pr.number, headSha, post.map((d) => d.file));
  const embeds = images.length
    ? images.map((url) => ({ url: refUrl, image: { url } }))
    : [{ url: refUrl, description: '​' }];

  const pair = post.length > 1;
  const blocks = post.map((draft) => {
    const account = ACCOUNT_BY_PLATFORM[draft.platform];
    const label = draft.platform === 'x' ? 'X' : draft.platform === 'instagram' ? 'IG' : clip(sanitizeInlineField(account?.label ?? draft.platform), PLATFORM_LABEL_MAX_CHARS);
    return { label, text: preparedBody(draft), isX: draft.platform === 'x' };
  });

  const render = (budgets) => blocks
    .flatMap((b, i) => [...(pair ? [b.label] : []), '```', clip(b.text, budgets[i]), '```'])
    .join('\n');

  // Truncate (never chunk) until it fits: non-X captions first, then X — X is
  // cut last because it is the text the owner is approving word for word.
  const budgets = blocks.map((b) => b.text.length);
  let content = render(budgets);
  for (const isX of [false, true]) {
    for (let guard = 0; content.length > DISCORD_MESSAGE_HARD_CAP && guard < 20; guard += 1) {
      const idx = blocks.map((b, i) => (b.isX === isX && budgets[i] > 0 ? i : -1)).filter((i) => i >= 0);
      if (idx.length === 0) break;
      const cut = Math.ceil((content.length - DISCORD_MESSAGE_HARD_CAP + 2) / idx.length);
      for (const i of idx) budgets[i] = Math.max(0, budgets[i] - cut);
      content = render(budgets);
    }
  }
  if (content.length > DISCORD_MESSAGE_HARD_CAP) {
    throw new Error(`approval post for ${refFiles} cannot fit ${DISCORD_MESSAGE_HARD_CAP} characters even with every caption cut`);
  }

  return { content, embeds };
}
