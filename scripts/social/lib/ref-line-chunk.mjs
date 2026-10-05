// chunkPreservingRefLine — splits an approval-prompt.mjs message into
// Discord-postable chunks the same way `chunkForDiscord` does, but
// guarantees a trailing `ref: PR #<n> · <40-hex headSha> · <file|*>` line
// always survives byte-for-byte on one chunk, never split across two.
//
// Split out of approval-prompt.mjs (Tree Overhaul S5, Codex adversarial
// review round 1 on this branch): a caption long enough to push the new
// "Tree · slot: ... · pillar: ..." identity line's message over Discord's
// 2,000-char limit could otherwise land the chunk split exactly inside the
// ref line, and social-approval-poll.mjs's REF_LINE_RE would then match
// neither resulting chunk — silently disabling that draft's ✅/❌ reaction.
//
// Mirrors social-approval-poll.mjs's own REF_LINE_RE (that script's header
// comment names it as the binding property this whole approval mechanism
// rests on). Used only to keep the line intact across chunking, never to
// change its format.
import { chunkForDiscord, DISCORD_MESSAGE_LIMIT } from '../../community/discord-delivery.mjs';

const REF_LINE_RE = /^ref: PR #\d+ · [0-9a-f]{40} · .+$/;

/**
 * Reserves the ref line's length off the body's packing budget up front so
 * it always fits appended to the last body chunk, falling back to its own
 * standalone final chunk on the rare content whose last body chunk is
 * already packed to the limit.
 */
export function chunkPreservingRefLine(content, limit = DISCORD_MESSAGE_LIMIT) {
  const lines = content.split('\n');
  const lastLine = lines[lines.length - 1];
  if (!REF_LINE_RE.test(lastLine)) return chunkForDiscord(content, limit);

  const body = lines.slice(0, -1).join('\n');
  const reserved = lastLine.length + 1; // +1 for the joining "\n" before the ref line
  const bodyChunks = chunkForDiscord(body, Math.max(1, limit - reserved));
  const lastIndex = bodyChunks.length - 1;
  const merged = `${bodyChunks[lastIndex]}\n${lastLine}`;
  if (merged.length <= limit) return [...bodyChunks.slice(0, lastIndex), merged];
  return [...bodyChunks, lastLine];
}
