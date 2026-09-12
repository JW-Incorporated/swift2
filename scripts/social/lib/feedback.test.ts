import { describe, expect, it, vi } from 'vitest';
import { appendRows, classifyReaction, isoWeek, pillarOf, PENCIL_UNSUPPORTED_ON_HEADER, resolveGoverningRef } from './feedback.mjs';
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

describe('resolveGoverningRef', () => {
  function fileRef(file: string, id: string) {
    return { message: { id }, sha: 'a'.repeat(40), file };
  }

  it('a file with its own per-file ref resolves to that ref, not the header', () => {
    const refs = [fileRef('*', 'header-msg'), fileRef('social/queue/foo.json', 'foo-msg')];
    expect(resolveGoverningRef('social/queue/foo.json', refs)).toEqual(fileRef('social/queue/foo.json', 'foo-msg'));
  });

  it('DEBUG.md round-2 finding 2: still resolves to the file\'s own ref even when the file was already stamped via the header (never falls back to the header for a file that has its own brief)', () => {
    // The scenario finding 2 reproduced: approval.message on disk names the
    // HEADER's id (a past header-driven stamp), but the file's own per-file
    // brief message still exists among this run's refs — resolution must
    // still prefer it, which is what lets a later reaction on the file's
    // OWN message keep being read on subsequent runs once the stamp path
    // uses this resolution instead of the reacted-on message's id.
    const refs = [fileRef('*', 'header-msg'), fileRef('social/queue/foo.json', 'foo-own-msg')];
    const resolved = resolveGoverningRef('foo.json', refs);
    expect(resolved?.message.id).toBe('foo-own-msg');
  });

  it('falls back to the header when the file has no per-file ref of its own', () => {
    const refs = [fileRef('*', 'header-msg')];
    expect(resolveGoverningRef('social/queue/foo.json', refs)?.message.id).toBe('header-msg');
  });

  it('returns null when neither a per-file ref nor a header ref exists', () => {
    expect(resolveGoverningRef('social/queue/foo.json', [])).toBeNull();
  });

  it('matches by basename, tolerating a full relPath vs. a bare filename on either side', () => {
    const refs = [fileRef('foo.json', 'foo-own-msg')];
    expect(resolveGoverningRef('social/queue/foo.json', refs)?.message.id).toBe('foo-own-msg');
  });
});
