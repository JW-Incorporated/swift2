import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs module, no type declarations
import {
  approvalMarker,
  hasApproval,
  parseApprovalComment,
  renderAmbiguousApproval,
  renderApproval,
  renderLinkOnlyRelay,
  resolveChatApproval,
  resolveReactionApproval,
} from './build-ticket.mjs';

const messageId = '1549104718482116722';
const messageUrl = `https://discord.com/channels/1542316443264360448/1548350324891328562/${messageId}`;
const build = { number: 4324, state: 'OPEN', labels: [{ name: 'marjorie-filed' }, { name: 'desk:build' }] };

describe('approval comments', () => {
  it('renders and recognizes only the exact marker, URL, template and typed author', () => {
    const body = renderApproval({ messageId, messageUrl });
    expect(body.endsWith(approvalMarker(messageId))).toBe(true);
    expect(parseApprovalComment({ body, author: { login: 'app/claude', __typename: 'Bot' } })).toMatchObject({ messageId, source: 'chat' });
    expect(parseApprovalComment({ body, author: { login: 'github-actions[bot]', type: 'Bot' } })).toMatchObject({ messageId, source: 'reaction' });
    expect(parseApprovalComment({ body, author: { login: 'outsider', type: 'Bot' } })).toBeNull();
    expect(parseApprovalComment({ body, author: { login: 'claude', type: 'User' } })).toBeNull();
    expect(parseApprovalComment({ body: `prefix\n${body}`, author: { login: 'app/claude', __typename: 'Bot' } })).toBeNull();
    expect(() => renderApproval({ messageId, messageUrl: messageUrl.replace(messageId, `${messageId}9`) })).toThrow();
  });

  it('deduplicates only the same Discord message id', () => {
    const comments = [{ body: renderApproval({ messageId, messageUrl }), user: { login: 'claude[bot]', type: 'Bot' } }];
    expect(hasApproval(comments, messageId)).toBe(true);
    expect(hasApproval(comments, '1549104718482116723')).toBe(false);
  });
});

describe('approval target resolution', () => {
  const context = { bot: 'marjorie', already: null, message_id: messageId, url: messageUrl, text: `yes, do #${build.number}`, replying_to: null, thread_root: null };

  it('resolves one open Marjorie build issue and ignores HA references', () => {
    expect(resolveChatApproval({ ...context, text: `HA #76 is done; yes, do #${build.number}` }, [build])).toMatchObject({ ok: true, issue: build });
  });

  it('refuses zero or multiple eligible issue references', () => {
    const second = { ...build, number: 4325 };
    expect(resolveChatApproval({ ...context, text: 'yes' }, [build])).toMatchObject({ ok: false, reason: 'ambiguous' });
    expect(resolveChatApproval({ ...context, text: 'yes, do #4324 and #4325' }, [build, second])).toMatchObject({ ok: false, reason: 'ambiguous', candidates: [4324, 4325] });
    expect(resolveChatApproval({ ...context, text: 'yes #4324 and #9999' }, [build])).toMatchObject({ ok: false, reason: 'ambiguous', candidates: [4324, 9999] });
    expect(resolveChatApproval({ ...context, text: 'yes https://github.com/other/repo/issues/4324' }, [build], { repo: 'JW-Incorporated/swift2' })).toMatchObject({ ok: false });
  });

  it('uses one referenced bot target when the founder reply has no number', () => {
    const replying_to = { text: `Build item #${build.number}` };
    expect(resolveChatApproval({ ...context, text: 'yes', replying_to }, [build])).toMatchObject({ ok: true, issue: build });
  });

  it('requires a founder reactor on one Marjorie webhook brief target', () => {
    const message = { id: messageId, webhook_id: '9', author: { username: 'Marjorie' }, content: `- dispatched #${build.number}` };
    expect(resolveReactionApproval({ message, deliveredMessageId: messageId, messageUrl, reactorIds: ['7'], founderIds: new Set(['7']), issues: [build] })).toMatchObject({ ok: true, issue: build });
    expect(resolveReactionApproval({ message, deliveredMessageId: '1549104718482116723', messageUrl, reactorIds: ['7'], founderIds: new Set(['7']), issues: [build] })).toMatchObject({ ok: false, reason: 'not-marjorie-brief' });
    expect(resolveReactionApproval({ message, deliveredMessageId: messageId, messageUrl, reactorIds: ['8'], founderIds: new Set(['7']), issues: [build] })).toMatchObject({ ok: false, reason: 'no-founder-reaction' });
  });
});

describe('public relay metadata', () => {
  it('contains links and ids without founder message content', () => {
    expect(renderLinkOnlyRelay({ messageId, messageUrl })).toBe(`💬 Founder reply in Discord: ${messageUrl}\n\n<!-- relay-id: ${messageId} -->`);
    expect(renderAmbiguousApproval({ messageId, messageUrl, candidates: [4325, 4324, 4324] })).toContain('candidates: #4324, #4325');
  });
});
