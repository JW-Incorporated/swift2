// Shared reply-lead formatter (#5987, #5988): every reply lead, Reddit or
// Facebook, mailer lane or awareness lane, is TWO Discord messages. Message 1
// is the card (title/link/why, built per lane); message 2, posted right below,
// is ONLY the drafted reply inside a triple-backtick box, so it has the copy
// button on desktop and is its own long-press-copy message on mobile.
// Pure; no posting here.
import { neutralizeMentions } from './discord-delivery.mjs';

export const DISCORD_LIMIT = 2_000;
export const REPLY_TRIM_NOTE = '(Reply trimmed to fit Discord.)';

/** The one reaction legend every card carries (replaces the signed Posted/Skip links). */
export const REACTION_FOOTER = 'Done? React ✅ posted · ❌ skip. Nothing posts automatically.';

const BOX_OVERHEAD = '```\n'.length + '\n```'.length;

/** Longest prefix of `text` within `units` UTF-16 units, never splitting a surrogate pair. */
export function clipUnits(text, units) {
  let out = '';
  for (const ch of text) {
    if (out.length + ch.length > units) break;
    out += ch;
  }
  return out;
}

/** Breaks every run of 3+ backticks with zero-width spaces so a draft can never close the box early. */
export function escapeBackticks(text) {
  return String(text ?? '').replace(/`{3,}/g, (run) => [...run].join('​'));
}

/**
 * The draft alone in a code box, always <= 2000 units. `trimmed` tells the
 * card to say so. `text` is '' for an empty draft (callers treat that as
 * not sendable).
 */
export function buildDraftBox(draft) {
  const reply = escapeBackticks(neutralizeMentions(draft).trim());
  if (!reply) return { text: '', trimmed: false };
  const room = DISCORD_LIMIT - BOX_OVERHEAD;
  const trimmed = reply.length > room;
  const body = trimmed ? clipUnits(reply, room).trimEnd() : reply;
  return { text: `\`\`\`\n${body}\n\`\`\``, trimmed };
}
