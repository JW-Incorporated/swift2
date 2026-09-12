import { describe, expect, it, vi } from 'vitest';
import { aggregateLatency, aggregateVerdicts, appendRows, capReason, classifyReaction, classifyTarget, groupTargets, isoWeek, pillarOf, PENCIL_UNSUPPORTED_ON_HEADER, pollOwnFieldChange, snowflakeTimestampMs } from './feedback.mjs';
import { SOCIAL_APPROVERS } from './approvers.mjs';

const APPROVER = SOCIAL_APPROVERS[0];
const OTHER_APPROVER = SOCIAL_APPROVERS[1];
const NON_APPROVER = 'discord:999999999999999999';

function reply(overrides = {}) {
  return { id: 'reply-1', authorId: APPROVER, content: 'the reason text', timestamp: '2026-09-17T15:42:11Z', ...overrides };
}

describe('isoWeek', () => {
  it('formats a UTC date as "<year>-W<week>"', () => {
    expect(isoWeek(new Date('2026-09-17T15:42:11Z'))).toBe('2026-W38');
  });

  it('keeps a Monday-Sunday ISO week together — the trailing Sunday is not next week', () => {
    // 2026-09-14 (Mon) .. 2026-09-20 (Sun) is one ISO week; 2026-09-17 (Thu) sits inside it.
    expect(isoWeek(new Date('2026-09-20T00:00:00Z'))).toBe(isoWeek(new Date('2026-09-17T00:00:00Z')));
    expect(isoWeek(new Date('2026-09-13T00:00:00Z'))).not.toBe(isoWeek(new Date('2026-09-17T00:00:00Z')));
  });
});

describe('pillarOf', () => {
  it('derives the pillar for each of the five queue-item families (docs/marketing/social-strategy.md §1)', () => {
    expect(pillarOf('launch:mood-chat:announce')).toBe('launch:mood-chat');
    expect(pillarOf('thread:hidden-clues:origin-story:2026-08')).toBe('thread:hidden-clues:origin-story');
    expect(pillarOf('timeline:love-story:early-solo-years:2026-09-17')).toBe('timeline:love-story:early-solo-years');
    expect(pillarOf('mood:chip-poll:2026-09')).toBe('mood:chip-poll');
    expect(pillarOf('heartbeat:on-this-day:red-announcement')).toBe('heartbeat:on-this-day');
  });

  it('returns null (and a ::warning::) for an unrecognised prefix', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(pillarOf('merch:drop-42')).toBeNull();
    expect(errorSpy.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('::warning::'))).toBe(true);
    errorSpy.mockRestore();
  });

  it('returns null with no warning for a null campaign (Human reach — not a post)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(pillarOf(null)).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  // Round 5 review: a non-string, non-nullish campaign (e.g. a plain
  // drafting bug producing `campaign: 2026`) used to throw inside
  // `.startsWith` here — crashing social-approval-poll.mjs's whole run
  // (stampRow/rejectRow both call this) or approval-prompt.mjs's identity
  // line, not just this one item's pillar.
  it('does not crash on a non-string, non-nullish campaign — coerces to string first', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => pillarOf(2026)).not.toThrow();
    expect(() => pillarOf({ a: 1 })).not.toThrow();
    expect(() => pillarOf(true)).not.toThrow();
    errorSpy.mockRestore();
  });

  it('a coercible non-string value that stringifies to a recognized prefix still derives correctly (proves coercion, not just crash-avoidance)', () => {
    const campaignLike = { toString: () => 'launch:mood-chat:announce' };
    expect(pillarOf(campaignLike)).toBe('launch:mood-chat');
  });

  // Round 5, MEDIUM: this is a GitHub Actions `::warning::` log line — a
  // raw newline in the campaign could otherwise start a second line the
  // Actions runner reads as its own workflow command (e.g. `::error::`).
  it('strips newlines from the campaign before it reaches the ::warning:: log line', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    pillarOf(`bad:x\n::error::injected workflow command`);
    const [message] = errorSpy.mock.calls[0];
    expect(message.split('\n')).toHaveLength(1);
    expect(message).toContain('::error::injected workflow command'); // present as inert text, not its own line
    errorSpy.mockRestore();
  });
});

describe('classifyReaction', () => {
  it('✅ alone -> approve, no reason, no reply', () => {
    const result = classifyReaction({ approvedBy: [APPROVER] }, []);
    expect(result).toEqual({ action: 'approve', reason: null, editedBody: null, approver: APPROVER, replyId: null });
  });

  it('✏️ with a qualifying reply -> edit, body + reason = the reply verbatim', () => {
    const result = classifyReaction({ editedBy: [APPROVER] }, [reply({ content: 'On 22 Oct 2012, Taylor...' })]);
    expect(result.action).toBe('edit');
    expect(result.editedBody).toBe('On 22 Oct 2012, Taylor...');
    expect(result.reason).toBe('On 22 Oct 2012, Taylor...');
    expect(result.approver).toBe(APPROVER);
    expect(result.replyId).toBe('reply-1');
  });

  it('DEBUG.md round-2 finding 6: an edit reply between 2001-2200 chars is NOT truncated in editedBody, but reason still caps at 2000', () => {
    const longReply = 'x'.repeat(2200);
    const result = classifyReaction({ editedBy: [APPROVER] }, [reply({ content: longReply })]);
    expect(result.action).toBe('edit');
    expect(result.editedBody).toHaveLength(2200);
    expect(result.editedBody).toBe(longReply);
    expect(result.reason).toHaveLength(2000);
  });

  it('✏️ alone (no reply) -> pending', () => {
    const result = classifyReaction({ editedBy: [APPROVER] }, []);
    expect(result.action).toBe('pending');
    expect(result.editedBody).toBeNull();
  });

  it('❌ with a qualifying reply -> reject, reason = the reply verbatim', () => {
    const result = classifyReaction({ rejectedBy: [APPROVER] }, [reply({ content: 'too salesy' })]);
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('too salesy');
    expect(result.approver).toBe(APPROVER);
    expect(result.replyId).toBe('reply-1');
  });

  it('❌ alone (no reply) -> pending', () => {
    const result = classifyReaction({ rejectedBy: [APPROVER] }, []);
    expect(result.action).toBe('pending');
  });

  it('✅ and ❌ together -> ❌ wins, and still needs a reason (no reply -> pending, not reject)', () => {
    const withReply = classifyReaction({ approvedBy: [APPROVER], rejectedBy: [APPROVER] }, [reply({ content: 'wrong photo' })]);
    expect(withReply.action).toBe('reject');
    expect(withReply.reason).toBe('wrong photo');

    const withoutReply = classifyReaction({ approvedBy: [APPROVER], rejectedBy: [APPROVER] }, []);
    expect(withoutReply.action).toBe('pending');
  });

  it('✏️ and ✅ together with a qualifying reply -> ✏️ wins (edit)', () => {
    const result = classifyReaction({ approvedBy: [APPROVER], editedBy: [APPROVER] }, [reply({ content: 'better caption' })]);
    expect(result.action).toBe('edit');
    expect(result.editedBody).toBe('better caption');
  });

  it('✏️ and ✅ together with NO reply -> ✅ wins (the founder added a fix on top of an approval)', () => {
    const result = classifyReaction({ approvedBy: [APPROVER], editedBy: [APPROVER] }, []);
    expect(result.action).toBe('approve');
  });

  it('a reply from a non-approver is ignored entirely — leaves ✏️/❌ pending, same as no reply', () => {
    const edit = classifyReaction({ editedBy: [APPROVER] }, [reply({ authorId: NON_APPROVER })]);
    expect(edit.action).toBe('pending');

    const reject = classifyReaction({ rejectedBy: [APPROVER] }, [reply({ authorId: NON_APPROVER })]);
    expect(reject.action).toBe('pending');
  });

  it('multiple qualifying replies -> the latest one wins, everywhere', () => {
    const result = classifyReaction(
      { rejectedBy: [APPROVER] },
      [
        reply({ id: 'reply-early', content: 'first reason', timestamp: '2026-09-17T10:00:00Z' }),
        reply({ id: 'reply-late', content: 'actually, this reason', timestamp: '2026-09-17T12:00:00Z', authorId: OTHER_APPROVER }),
      ],
    );
    expect(result.reason).toBe('actually, this reason');
    expect(result.replyId).toBe('reply-late');
    expect(result.approver).toBe(OTHER_APPROVER);
  });

  it('⏭️ on a reddit target -> skip, no reply required, distinct from reject', () => {
    const result = classifyReaction({ skippedBy: [APPROVER] }, [], { kind: 'reddit' });
    expect(result).toEqual({ action: 'skip', reason: null, editedBody: null, approver: APPROVER, replyId: null });
  });

  it('⏭️ on a draft/proposal target is ignored — same as no reaction at all', () => {
    const draftResult = classifyReaction({ skippedBy: [APPROVER] }, [], { kind: 'draft' });
    expect(draftResult.action).toBe('none');
    const proposalResult = classifyReaction({ skippedBy: [APPROVER] }, [], { kind: 'proposal' });
    expect(proposalResult.action).toBe('none');
  });

  it('✏️ on the * header (kind: "pr") is unsupported -> pending with the specific nudge text, even with a reply', () => {
    const result = classifyReaction({ editedBy: [APPROVER] }, [reply({ content: 'a fix for both platforms at once' })], { kind: 'pr' });
    expect(result.action).toBe('pending');
    expect(result.reason).toBe(PENCIL_UNSUPPORTED_ON_HEADER);
    expect(result.editedBody).toBeNull();
  });

  it('✅ and ❌ on the header are unchanged by the ✏️-unsupported rule', () => {
    const approve = classifyReaction({ approvedBy: [APPROVER] }, [], { kind: 'pr' });
    expect(approve.action).toBe('approve');
    const reject = classifyReaction({ rejectedBy: [APPROVER] }, [reply({ content: 'kill the whole PR' })], { kind: 'pr' });
    expect(reject.action).toBe('reject');
  });

  it('no reaction at all -> none', () => {
    expect(classifyReaction({}, []).action).toBe('none');
  });
});

describe('appendRows', () => {
  function row(overrides = {}) {
    return { ts: '2026-09-17T15:42:11Z', pr: 4130, file: 'social/queue/example-x.json', action: 'approve', messageId: '1416', ...overrides };
  }

  it('appends rows not already present, deduped on (pr, file, messageId, action)', () => {
    const rowA = row();
    const rowB = row({ file: 'social/queue/example-ig.json', messageId: '1417' });
    const appended = appendRows([], [rowA, rowB]);
    expect(appended).toEqual([rowA, rowB]);
  });

  it('is idempotent — re-appending the same rows against the prior output yields nothing new', () => {
    const rowA = row();
    const first = appendRows([], [rowA]);
    const existingLines = first.map((r) => JSON.stringify(r));
    const second = appendRows(existingLines, [rowA]);
    expect(second).toEqual([]);
  });

  it('dedupes within the same batch too', () => {
    const rowA = row();
    const appended = appendRows([], [rowA, { ...rowA }]);
    expect(appended).toEqual([rowA]);
  });

  it('a different action for the same (pr, file, messageId) is a distinct row, not a duplicate', () => {
    const approveRow = row({ action: 'approve' });
    const rejectRow = row({ action: 'reject' });
    const appended = appendRows([JSON.stringify(approveRow)], [rejectRow]);
    expect(appended).toEqual([rejectRow]);
  });
});

// Architect-directed redesign (docs/decisions.md 2026-09-12): the listening
// axis reads the UNION of every window message per target. These are the
// pure functions the poll gates that on.
describe('groupTargets', () => {
  const msg = (id: string) => ({ id, timestamp: '2026-09-19T00:00:00Z' });

  it('groups every ref for a file under its social/queue/<basename> key — any SHA, bare filename or relPath — and the header under "*"', () => {
    const refs = [
      { message: msg('h1'), sha: 'a'.repeat(40), file: '*' },
      { message: msg('f1'), sha: 'a'.repeat(40), file: 'social/queue/foo.json' },
      { message: msg('f2'), sha: 'b'.repeat(40), file: 'foo.json' },
      { message: msg('h2'), sha: 'b'.repeat(40), file: '*' },
    ];
    const targets = groupTargets(refs);
    expect([...targets.keys()]).toEqual(['*', 'social/queue/foo.json']);
    expect(targets.get('*')!.map((r) => r.message.id)).toEqual(['h1', 'h2']);
    expect(targets.get('social/queue/foo.json')!.map((r) => r.message.id)).toEqual(['f1', 'f2']);
  });
});

describe('classifyTarget (union across every message naming a target)', () => {
  const SHA_A = 'a'.repeat(40);
  const SHA_B = 'b'.repeat(40);
  const entry = (id: string, sha: string, reactions: Record<string, string[]> = {}, replies: Array<Record<string, unknown>> = [], timestamp = '2026-09-19T00:00:00Z') => ({
    message: { id, timestamp },
    sha,
    reactions,
    replies,
  });
  const aReply = (id: string, content: string, timestamp = '2026-09-19T01:00:00Z') => ({ id, authorId: APPROVER, content, timestamp });

  it('a ❌+reply on one (stale) message wins over a ✅ on another — ❌ anywhere wins; the replied-to message is the first anchor', () => {
    const r = classifyTarget([entry('current', SHA_B, { approvedBy: [APPROVER] }), entry('stale', SHA_A, { rejectedBy: [APPROVER] }, [aReply('r1', 'wrong photo')])]);
    expect(r.action).toBe('reject');
    expect(r.reason).toBe('wrong photo');
    expect(r.messageId).toBe('stale');
    expect(r.sha).toBe(SHA_A);
    expect(r.anchors[0]).toEqual({ messageId: 'stale', sha: SHA_A });
    expect(r.replyTimestamp).toBe('2026-09-19T01:00:00Z');
  });

  it('✅s spread across duplicate briefs are unioned; every ✅-bearing message is an anchor with its own SHA, the latest is the audit id', () => {
    const r = classifyTarget([
      entry('old', SHA_A, { approvedBy: [APPROVER] }, [], '2026-09-18T00:00:00Z'),
      entry('new', SHA_B, { approvedBy: [APPROVER] }, [], '2026-09-19T00:00:00Z'),
      entry('none', SHA_B),
    ]);
    expect(r.action).toBe('approve');
    expect(r.anchors).toEqual([
      { messageId: 'old', sha: SHA_A },
      { messageId: 'new', sha: SHA_B },
    ]);
    expect(r.messageId).toBe('new');
    expect(r.sha).toBe(SHA_B);
    expect(r.pending).toBeNull();
  });

  it('the latest qualifying reply anywhere wins for an edit, and its parent message is the first anchor', () => {
    const r = classifyTarget([
      entry('m1', SHA_A, { editedBy: [APPROVER] }, [aReply('r1', 'first caption', '2026-09-19T01:00:00Z')]),
      entry('m2', SHA_B, {}, [aReply('r2', 'second caption', '2026-09-19T02:00:00Z')]),
    ]);
    expect(r.action).toBe('edit');
    expect(r.editedBody).toBe('second caption');
    expect(r.replyId).toBe('r2');
    expect(r.anchors).toEqual([
      { messageId: 'm2', sha: SHA_B },
      { messageId: 'm1', sha: SHA_A },
    ]);
  });

  it('an unanswered ❌ is pending, naming the LATEST message that carries it (the one to nudge)', () => {
    const r = classifyTarget([entry('older', SHA_A, { rejectedBy: [APPROVER] }, [], '2026-09-18T00:00:00Z'), entry('newer', SHA_B, { rejectedBy: [APPROVER] }, [], '2026-09-19T00:00:00Z')]);
    expect(r.action).toBe('pending');
    expect(r.pending).toEqual({ messageId: 'newer', kind: 'reject', reason: null });
    expect(r.anchors).toEqual([]);
  });

  it('✏️ on a header target is pending with the fixed nudge text, kind pencil-header, even with a reply', () => {
    const r = classifyTarget([entry('h', SHA_A, { editedBy: [APPROVER] }, [aReply('r1', 'a fix')])], { kind: 'pr' });
    expect(r.action).toBe('pending');
    expect(r.pending).toEqual({ messageId: 'h', kind: 'pencil-header', reason: PENCIL_UNSUPPORTED_ON_HEADER });
  });

  it('no messages / no reactions -> none, with no anchors and no pending', () => {
    expect(classifyTarget([])).toMatchObject({ action: 'none', anchors: [], pending: null, messageId: null, sha: null, replyTimestamp: null });
  });
});

describe('pollOwnFieldChange', () => {
  const base = { platform: 'x', body: 'hello', scheduledAt: '2026-09-20T00:00:00Z' };

  it("a stamp (approval only) and an edit (body + edit + approval together) are the poll's own shapes", () => {
    expect(pollOwnFieldChange(base, { ...base, approval: { v: 3 } })).toBe(true);
    expect(pollOwnFieldChange(base, { ...base, body: 'new', edit: { fromBody: 'hello' }, approval: { v: 3 } })).toBe(true);
  });

  it('an unhashed field (why, mediaCredit) changing, or body moving without edit, is not', () => {
    expect(pollOwnFieldChange(base, { ...base, why: 'x', approval: { v: 3 } })).toBe(false);
    expect(pollOwnFieldChange(base, { ...base, mediaCredit: 'x' })).toBe(false);
    expect(pollOwnFieldChange(base, { ...base, body: 'new' })).toBe(false);
  });

  it("M2 (round 4): a re-mint that only bumps edit.at (body unchanged) is the poll's own shape too; any other edit-only change is not", () => {
    const edited = { ...base, body: 'new', edit: { by: 'discord:1', at: 'T1', message: 'm', reply: 'r', fromBody: 'hello' }, approval: { v: 3, at: 'T1' } };
    expect(pollOwnFieldChange(edited, { ...edited, edit: { ...edited.edit, at: 'T2' }, approval: { v: 3, at: 'T2' } })).toBe(true);
    expect(pollOwnFieldChange(edited, { ...edited, edit: { ...edited.edit, fromBody: 'forged' } })).toBe(false);
    expect(pollOwnFieldChange(edited, { ...edited, edit: { ...edited.edit, message: 'other' } })).toBe(false);
    expect(pollOwnFieldChange(base, { ...base, edit: { by: 'discord:1', at: 'T1', message: 'm', fromBody: 'hello' } })).toBe(false); // an edit appearing with no body change is not a re-mint
  });
});

describe('capReason', () => {
  it('caps at 2000 characters and leaves shorter text alone', () => {
    expect(capReason('x'.repeat(2500))).toHaveLength(2000);
    expect(capReason('short')).toBe('short');
    expect(capReason(null)).toBe('');
  });
});

// T4 (docs/specs/tree-overhaul/t4-weekly-brief.md §Data): weekly-scorecard.mjs
// lines 4-5's aggregation helpers.
describe('snowflakeTimestampMs', () => {
  it("decodes a Discord snowflake id to its creation time (Discord's own documented example)", () => {
    expect(snowflakeTimestampMs('175928847299117063')).toBe(Date.parse('2016-04-30T11:18:25.796Z'));
  });

  it('returns null for anything that is not a bare numeric snowflake, never a thrown error', () => {
    expect(snowflakeTimestampMs(null)).toBeNull();
    expect(snowflakeTimestampMs(undefined)).toBeNull();
    expect(snowflakeTimestampMs('not-a-snowflake')).toBeNull();
  });
});

describe('aggregateVerdicts', () => {
  it('counts social/queue/** rows by action and computes the needs-a-change percentage', () => {
    const rows = [
      { file: 'social/queue/a.json', action: 'approve' },
      { file: 'social/queue/b.json', action: 'approve' },
      { file: 'social/queue/c.json', action: 'edit' },
      { file: 'social/queue/d.json', action: 'reject' },
      { file: 'proposal:1', action: 'approve' }, // a plan verdict, not a draft one — excluded
    ];
    expect(aggregateVerdicts(rows)).toEqual({ approve: 2, edit: 1, reject: 1, total: 4, needsChangePct: 50 });
  });

  it('needsChangePct is null (never 0 or NaN) when there is nothing to divide by', () => {
    expect(aggregateVerdicts([])).toEqual({ approve: 0, edit: 0, reject: 0, total: 0, needsChangePct: null });
    expect(aggregateVerdicts([{ file: 'brief', action: 'approve' }])).toEqual({ approve: 0, edit: 0, reject: 0, total: 0, needsChangePct: null });
  });

  // LOW (Codex round 3): `action in counts` walks the prototype chain -- a
  // ledger row with action: "toString" (the ledger lives on the
  // unprotected social-ledger branch) must not be able to corrupt the
  // counts object with an inherited Object.prototype method.
  it('a row with a prototype-chain action name (e.g. "toString") is never counted and never corrupts the totals object', () => {
    const rows = [
      { file: 'social/queue/a.json', action: 'approve' },
      { file: 'social/queue/b.json', action: 'toString' },
      { file: 'social/queue/c.json', action: 'hasOwnProperty' },
      { file: 'social/queue/d.json', action: 'constructor' },
    ];
    const result = aggregateVerdicts(rows);
    expect(result).toEqual({ approve: 1, edit: 0, reject: 0, total: 1, needsChangePct: 0 });
    expect(typeof result.toString).toBe('function'); // untouched, still the real Object.prototype method
    expect(typeof result.hasOwnProperty).toBe('function');
  });
});

describe('aggregateLatency', () => {
  const POSTED_1 = '1548996732518400000'; // 2026-09-14T10:00:00.000Z
  const POSTED_2 = '1549208125440000000'; // 2026-09-15T00:00:00.000Z

  it('measures brief-message-timestamp -> ledger-row-timestamp and reports median/slowest', () => {
    const rows = [
      { file: 'social/queue/a.json', messageId: POSTED_1, ts: '2026-09-14T13:10:00.000Z' }, // 3h10m
      { file: 'social/queue/b.json', messageId: POSTED_2, ts: '2026-09-15T19:00:00.000Z' }, // 19h
    ];
    const latency = aggregateLatency(rows);
    expect(latency?.slowest).toBe(19 * 60 * 60 * 1000);
    expect(latency?.median).toBe((3 * 60 * 60 * 1000 + 10 * 60 * 1000 + 19 * 60 * 60 * 1000) / 2);
  });

  it('skips rows with no decodable messageId or a non-draft file, returning null with no samples', () => {
    expect(aggregateLatency([])).toBeNull();
    expect(aggregateLatency([{ file: 'social/queue/a.json', messageId: null, ts: '2026-09-14T13:10:00.000Z' }])).toBeNull();
    expect(aggregateLatency([{ file: 'proposal:1', messageId: POSTED_1, ts: '2026-09-14T13:10:00.000Z' }])).toBeNull();
  });

  // S8 (docs/plans/tree-overhaul PLAN.md, S6+S8 task): weekly-scorecard.mjs
  // needs the identical median/slowest computation over reddit-scoped rows
  // instead of draft ones — a second filter argument (default draftRows,
  // unchanged for every caller above) rather than a second implementation
  // of the same aggregation.
  it('accepts an optional row filter, so a caller can measure a different row family than drafts', () => {
    const rows = [
      { file: 'reddit:abc123', messageId: POSTED_1, ts: '2026-09-14T13:10:00.000Z' }, // 3h10m
      { file: 'social/queue/a.json', messageId: POSTED_2, ts: '2026-09-15T19:00:00.000Z' }, // excluded by the reddit filter
    ];
    const redditOnly = (candidates) => candidates.filter((row) => typeof row.file === 'string' && row.file.startsWith('reddit:'));
    const latency = aggregateLatency(rows, redditOnly);
    const expectedMs = 3 * 60 * 60 * 1000 + 10 * 60 * 1000;
    expect(latency).toEqual({ median: expectedMs, slowest: expectedMs });
  });
});
