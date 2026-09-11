// Pure helpers behind the S3 reason protocol (docs/specs/tree-overhaul/
// s3-reason-protocol.md) — no I/O, no Discord, no filesystem. The only
// caller today is scripts/social/social-approval-poll.mjs, but
// classifyReaction is written generic-first (spec §3: "generic — reused by
// S6 and T4") so a later reddit/proposal `kind` plugs in without a rewrite.
// Everything worth a unit test lives here rather than in the poll script,
// per the precedent in lib/queue.mjs's own header comment.
import { neutralizeMentions } from '../../community/discord-delivery.mjs';
import { SOCIAL_APPROVERS } from './approvers.mjs';

const REASON_MAX_LENGTH = 2000; // spec §Data-1 field rules: "reason ... capped at 2000 characters"

/** spec §3, last bullet under "Rules holding for every kind" — the fixed
 * nudge text for a ✏️ landing on the PR header ("*"), which can never be
 * acted on (one reply can't be two platforms' captions at once). Exported
 * so the poll script and its tests share one literal, never two. */
export const PENCIL_UNSUPPORTED_ON_HEADER = '✏️ only works on a single draft — react on the draft you want to change.';

/** family shape (spec §Data-1): how many `:`-separated segments of a
 * `campaign` value belong to its `pillar`. A real campaign may carry extra
 * trailing segments (a phase, a date) beyond this arity — pillarOf keeps
 * only the first N. */
const PILLAR_ARITY = {
  'launch:': 2, // launch:<feature-slug>
  'thread:': 3, // thread:<lensId>:<angle>
  'timeline:': 3, // timeline:love-story:<chapter>
  'mood:': 2, // mood:<format>
  'heartbeat:': 2, // heartbeat:<pillar>
};

/** ISO-8601 week (UTC), e.g. "2026-W38" — the ledger's one-file-per-week
 * naming (spec §1). Standard ISO week algorithm: shift to the Thursday of
 * the same week, then count from that Thursday's own year start. */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Monday=1 .. Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** The campaign *family* a ledger row buckets under — derived, never
 * authored (spec §Data-1). `null` for a `null`/`undefined` campaign (the
 * expected shape for a non-post row) with no warning; `null` **with** a
 * `::warning::` for a campaign whose prefix isn't in the family table,
 * since that silently mis-buckets every downstream metric otherwise. */
export function pillarOf(campaign) {
  if (campaign === null || campaign === undefined) return null;
  const prefix = Object.keys(PILLAR_ARITY).find((p) => campaign.startsWith(p));
  if (!prefix) {
    console.error(`::warning::feedback: unrecognised campaign prefix in "${campaign}" — pillar set to null; check the family table in docs/marketing/social-strategy.md §1`);
    return null;
  }
  return campaign.split(':').slice(0, PILLAR_ARITY[prefix]).join(':');
}

function cleanReplyText(content) {
  const trimmed = String(content ?? '').trim();
  const neutralized = neutralizeMentions(trimmed);
  return neutralized.length > REASON_MAX_LENGTH ? neutralized.slice(0, REASON_MAX_LENGTH) : neutralized;
}

function filterApprovers(ids) {
  return Array.isArray(ids) ? ids.filter((id) => SOCIAL_APPROVERS.includes(id)) : [];
}

/** spec §4 conditions 2+3 (approver identity, non-empty) — conditions 1
 * (message_reference match) and 4 (after the brief's timestamp) are the
 * caller's job when building the candidate `replies` array, since only the
 * caller knows which message is the brief. Re-checked here anyway (this
 * function does not trust its caller, matching stamp-approval.mjs's own
 * rule) so "non-approver reply" is directly unit-testable at this layer. */
function isQualifyingReply(reply) {
  return Boolean(reply) && typeof reply.authorId === 'string' && SOCIAL_APPROVERS.includes(reply.authorId) && typeof reply.content === 'string' && reply.content.trim() !== '';
}

/** spec §4: "If several qualifying replies exist, the latest one wins,
 * everywhere." Ties (or missing timestamps) fall to whichever qualifying
 * reply appears last in the given array. */
function latestQualifyingReply(replies) {
  const qualifying = (replies ?? []).filter(isQualifyingReply);
  if (qualifying.length === 0) return null;
  return qualifying.reduce((latest, r) => {
    if (!latest) return r;
    const rTime = Date.parse(r.timestamp ?? '') || 0;
    const latestTime = Date.parse(latest.timestamp ?? '') || 0;
    return rTime >= latestTime ? r : latest;
  }, null);
}

/**
 * The single reaction -> action resolver (spec §3, reused by S6/T4).
 * `reactions`: `{ approvedBy, rejectedBy, editedBy, skippedBy }` — arrays
 * of `discord:<id>` reactors (defensively re-filtered to SOCIAL_APPROVERS
 * here; the caller, e.g. getMessageApprovals, already filters too).
 * `replies`: candidate replies already scoped to this target's message,
 * `{ id, authorId, content, timestamp }[]`.
 * `opts.kind`: `'draft' | 'reddit' | 'proposal' | 'pr'` — `'pr'` is the `*`
 * header; defaults to `'draft'`, the only kind S3's poll script ever passes.
 *
 * Priority (❌ "wins" over everything — spec §3's "Rules holding for every
 * kind" — then the header's ✏️-unsupported rule, then ✏️, then ✅):
 */
export function classifyReaction(reactions = {}, replies = [], { kind = 'draft' } = {}) {
  const approvedBy = filterApprovers(reactions.approvedBy);
  const rejectedBy = filterApprovers(reactions.rejectedBy);
  const editedBy = filterApprovers(reactions.editedBy);
  const skippedBy = filterApprovers(reactions.skippedBy);
  const qualifyingReply = latestQualifyingReply(replies);

  // ⏭️ is only meaningful for a reddit prompt (S6) — ignored (as if absent)
  // for every other kind (spec §3's reaction table + the ⏭️ footnote).
  if (kind === 'reddit' && skippedBy.length > 0) {
    return { action: 'skip', reason: null, editedBody: null, approver: skippedBy[0], replyId: null };
  }

  if (rejectedBy.length > 0) {
    if (qualifyingReply) {
      const reason = cleanReplyText(qualifyingReply.content);
      return { action: 'reject', reason, editedBody: null, approver: qualifyingReply.authorId, replyId: qualifyingReply.id };
    }
    return { action: 'pending', reason: null, editedBody: null, approver: rejectedBy[0], replyId: null };
  }

  // ✏️ on the header is never actionable, independent of a reply — a single
  // reply cannot be the new caption for two different-platform siblings.
  if (kind === 'pr' && editedBy.length > 0) {
    return { action: 'pending', reason: PENCIL_UNSUPPORTED_ON_HEADER, editedBody: null, approver: editedBy[0], replyId: null };
  }

  if (editedBy.length > 0) {
    if (qualifyingReply) {
      const text = cleanReplyText(qualifyingReply.content);
      return { action: 'edit', reason: text, editedBody: text, approver: qualifyingReply.authorId, replyId: qualifyingReply.id };
    }
    // ✏️ with no reply yet: ✅ also present -> the founder's approval still
    // stands (spec: "treat as ✏️ if a qualifying reply exists, else ✅").
    if (approvedBy.length > 0) {
      return { action: 'approve', reason: null, editedBody: null, approver: approvedBy[0], replyId: null };
    }
    return { action: 'pending', reason: null, editedBody: null, approver: editedBy[0], replyId: null };
  }

  if (approvedBy.length > 0) {
    return { action: 'approve', reason: null, editedBody: null, approver: approvedBy[0], replyId: null };
  }

  return { action: 'none', reason: null, editedBody: null, approver: null, replyId: null };
}

function dedupeKey(row) {
  return JSON.stringify([row.pr, row.file, row.messageId, row.action]);
}

/**
 * Idempotent JSONL append: given the raw lines already on disk
 * (`existingLines`, one JSON object per line — callers combine the current
 * *and* previous week's file for the dedupe universe per spec §Mechanics-8)
 * and candidate `rows` (objects), returns only the rows from `rows` not
 * already present by `(pr, file, messageId, action)`, deduped against
 * `existingLines` AND against each other within this same batch. Returns
 * row OBJECTS, not serialized lines — the caller decides formatting/where
 * to write (always the CURRENT week's file, never a past week's).
 */
export function appendRows(existingLines, rows) {
  const seen = new Set();
  for (const line of existingLines ?? []) {
    if (!line || !String(line).trim()) continue;
    try {
      seen.add(dedupeKey(JSON.parse(line)));
    } catch {
      // a malformed existing line carries no dedupe key — left alone, not thrown away
    }
  }
  const appended = [];
  for (const row of rows ?? []) {
    const key = dedupeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    appended.push(row);
  }
  return appended;
}
