// The third Discord message: `-# Qwen` subtext, then ONLY the alternative reply in a code box.
import { neutralizeMentions } from '../../community/discord-delivery.mjs';
import { DISCORD_LIMIT, clipUnits, escapeBackticks } from '../../community/reply-card.mjs';

export const HEADER = '-# Qwen';
const PREAMBLE = /^(here(?:'s|\s+is|\s+are)\b|sure\b|certainly\b|of course\b|okay\b|ok\b|alternative\b|draft\b|reply\b|response\b)/i;
const QUOTE_PAIRS = [['"', '"'], ["'", "'"], ['“', '”'], ['‘', '’']];

/** Strips preamble, wrapping fences/quotes and light markdown from raw model output. */
export function cleanReply(raw) {
  let text = String(raw ?? '').replace(/\r/g, '').trim();
  const fenced = text.match(/^```[a-z]*\n([\s\S]*?)\n?```$/i);
  if (fenced) text = fenced[1].trim();
  let lines = text.split('\n');
  if (lines.length > 1 && PREAMBLE.test(lines[0].trim()) && (/:\s*$/.test(lines[0]) || lines[0].length < 80)) {
    lines = lines.slice(1);
    text = lines.join('\n').trim();
  }
  text = text.replace(/^(draft|alternative(?: reply)?|reply|response)\s*:\s*/i, '');
  text = text.replace(/\*\*(.+?)\*\*/gs, '$1').replace(/^>\s?/gm, '').trim();
  for (const [open, close] of QUOTE_PAIRS) {
    if (text.length > 1 && text.startsWith(open) && text.endsWith(close)) {
      text = text.slice(open.length, text.length - close.length).trim();
      break;
    }
  }
  return text;
}

/** `-# Qwen` + a code box, always <= 2000 UTF-16 units. '' when nothing is left to send. */
export function buildQwenMessage(raw) {
  const reply = escapeBackticks(neutralizeMentions(cleanReply(raw)));
  if (!reply) return '';
  const room = DISCORD_LIMIT - `${HEADER}\n\`\`\`\n`.length - '\n```'.length;
  const body = reply.length > room ? clipUnits(reply, room).trimEnd() : reply;
  return `${HEADER}\n\`\`\`\n${body}\n\`\`\``;
}
