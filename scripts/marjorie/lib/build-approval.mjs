const SNOWFLAKE = /^\d{15,21}$/;
const DISCORD_URL = /^https:\/\/discord\.com\/channels\/(?:\d+|@me)\/\d+\/(\d{15,21})$/;

export const APPROVAL_AUTHORS = Object.freeze({
  chat: new Set(['app/claude', 'claude[bot]', 'claude']),
  reaction: new Set(['app/github-actions', 'github-actions[bot]', 'github-actions']),
});

function login(author) {
  return typeof author === 'string' ? author : author?.login || '';
}

function labels(issue) {
  return new Set((issue?.labels || []).map((label) => (typeof label === 'string' ? label : label?.name)));
}

export function isOpenBuildTicket(issue) {
  const found = labels(issue);
  return String(issue?.state || '').toLowerCase() === 'open' && found.has('marjorie-filed') && found.has('desk:build');
}

export function approvalMarker(messageId) {
  if (!SNOWFLAKE.test(String(messageId || ''))) throw new Error('approval needs a Discord message id');
  return `<!-- marjorie-approval: ${messageId} -->`;
}

export function renderApproval({ messageId, messageUrl }) {
  const match = DISCORD_URL.exec(String(messageUrl || ''));
  if (!match || match[1] !== String(messageId)) throw new Error('approval message URL and id must match');
  return [
    `Founder approved this in Discord: ${messageUrl}`,
    'Plan approved — ready for the build lane.',
    approvalMarker(messageId),
  ].join('\n');
}

export function parseApprovalComment(comment) {
  const body = String(comment?.body || '').replace(/\r\n/g, '\n').trimEnd();
  const match = /^Founder approved this in Discord: (https:\/\/discord\.com\/channels\/(?:\d+|@me)\/\d+\/(\d{15,21}))\nPlan approved — ready for the build lane\.\n<!-- marjorie-approval: (\d{15,21}) -->$/.exec(body);
  if (!match || match[2] !== match[3]) return null;
  const author = login(comment?.author || comment?.user);
  const source = Object.entries(APPROVAL_AUTHORS).find(([, authors]) => authors.has(author))?.[0];
  return source ? { messageUrl: match[1], messageId: match[2], source, author } : null;
}

export function hasApproval(comments, messageId) {
  return (comments || []).some((comment) => parseApprovalComment(comment)?.messageId === String(messageId));
}

function issueRefs(text) {
  const safe = String(text || '').replace(/\bHA\s*#\s*\d+/gi, '');
  const refs = new Set();
  for (const match of safe.matchAll(/(?:\/issues\/|(?:^|\s)#)(\d+)\b/g)) refs.add(Number(match[1]));
  return refs;
}

function directOrReplyRefs(context) {
  const direct = issueRefs(context?.text);
  if (direct.size) return direct;
  const reply = issueRefs(context?.replying_to?.text);
  if (reply.size) return reply;
  return issueRefs(context?.thread_root?.text);
}

export function resolveChatApproval(context, issues) {
  if (context?.bot !== 'marjorie' || context?.already || !SNOWFLAKE.test(String(context?.message_id || ''))) {
    return { ok: false, reason: 'untrusted-context', candidates: [] };
  }
  const url = DISCORD_URL.exec(String(context?.url || ''));
  if (!url || url[1] !== String(context.message_id)) return { ok: false, reason: 'untrusted-context', candidates: [] };
  const refs = directOrReplyRefs(context);
  const candidates = (issues || []).filter((issue) => refs.has(Number(issue.number)) && isOpenBuildTicket(issue));
  if (candidates.length !== 1) return { ok: false, reason: 'ambiguous', candidates: candidates.map((issue) => Number(issue.number)) };
  return { ok: true, issue: candidates[0], messageId: String(context.message_id), messageUrl: context.url };
}

export function resolveReactionApproval({ message, messageUrl, reactorIds, founderIds, issues }) {
  if (!message?.webhook_id || message?.author?.username !== 'Marjorie') return { ok: false, reason: 'not-marjorie-brief', candidates: [] };
  const url = DISCORD_URL.exec(String(messageUrl || ''));
  if (!SNOWFLAKE.test(String(message.id || '')) || !url || url[1] !== String(message.id)) return { ok: false, reason: 'untrusted-message', candidates: [] };
  if (!reactorIds.some((id) => founderIds.has(String(id)))) return { ok: false, reason: 'no-founder-reaction', candidates: [] };
  const refs = issueRefs(message.content);
  const candidates = (issues || []).filter((issue) => refs.has(Number(issue.number)) && isOpenBuildTicket(issue));
  if (candidates.length !== 1) return { ok: false, reason: 'ambiguous', candidates: candidates.map((issue) => Number(issue.number)) };
  return { ok: true, issue: candidates[0], messageId: String(message.id), messageUrl };
}

export function renderLinkOnlyRelay({ messageId, messageUrl }) {
  const match = DISCORD_URL.exec(String(messageUrl || ''));
  if (!match || match[1] !== String(messageId)) throw new Error('relay message URL and id must match');
  return `💬 Founder reply in Discord: ${messageUrl}\n\n<!-- relay-id: ${messageId} -->`;
}

export function renderAmbiguousApproval({ messageId, messageUrl, candidates = [] }) {
  const match = DISCORD_URL.exec(String(messageUrl || ''));
  if (!match || match[1] !== String(messageId)) throw new Error('ambiguous approval URL and id must match');
  const ids = [...new Set(candidates.map(Number).filter(Number.isInteger))].sort((a, b) => a - b);
  return `Approval reaction needs an issue number: ${messageUrl}${ids.length ? ` (candidates: ${ids.map((id) => `#${id}`).join(', ')})` : ''}\n\n<!-- marjorie-approval-ambiguous: ${messageId} -->`;
}
