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
} from './build-approval.mjs';

const messageId = '1549104718482116722';
const messageUrl = `https://discord.com/channels/1542316443264360448/1548350324891328562/${messageId}`;
const build = { number: 4324, state: 'OPEN', labels: [{ name: 'marjorie-filed' }, { name: 'desk:build' }] };

describe('approval comments', () => {
  it('renders and recognizes only the exact marker, URL, template and typed author', () => {
    const body = renderApproval({ messageId, messageUrl });
    expect(body.endsWith(approvalMarker(messageId))).toBe(true);
    expect(parseApprovalComment({ body, author: { login: 'app/claude' } })).toMatchObject({ messageId, source: 'chat' });
    expect(parseApprovalComment({ body, author: { login: 'github-actions[bot]' } })).toMatchObject({ messageId, source: 'reaction' });
    expect(parseApprovalComment({ body, author: { login: 'outsider' } })).toBeNull();
    expect(parseApprovalComment({ body: `prefix\n${body}`, author: { login: 'app/claude' } })).toBeNull();
    expect(() => renderApproval({ messageId, messageUrl: messageUrl.replace(messageId, `${messageId}9`) })).toThrow();
  });

  it('deduplicates only the same Discord message id', () => {
    const comments = [{ body: renderApproval({ messageId, messageUrl }), user: { login: 'claude[bot]' } }];
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
  });

  it('uses one referenced bot target when the founder reply has no number', () => {
    const replying_to = { text: `Build item #${build.number}` };
    expect(resolveChatApproval({ ...context, text: 'yes', replying_to }, [build])).toMatchObject({ ok: true, issue: build });
  });

  it('requires a founder reactor on one Marjorie webhook brief target', () => {
    const message = { id: messageId, webhook_id: '9', author: { username: 'Marjorie' }, content: `- dispatched #${build.number}` };
    expect(resolveReactionApproval({ message, messageUrl, reactorIds: ['7'], founderIds: new Set(['7']), issues: [build] })).toMatchObject({ ok: true, issue: build });
    expect(resolveReactionApproval({ message, messageUrl, reactorIds: ['8'], founderIds: new Set(['7']), issues: [build] })).toMatchObject({ ok: false, reason: 'no-founder-reaction' });
  });
});

describe('public relay metadata', () => {
  it('contains links and ids without founder message content', () => {
    expect(renderLinkOnlyRelay({ messageId, messageUrl })).toBe(`💬 Founder reply in Discord: ${messageUrl}\n\n<!-- relay-id: ${messageId} -->`);
    expect(renderAmbiguousApproval({ messageId, messageUrl, candidates: [4325, 4324, 4324] })).toContain('candidates: #4324, #4325');
  });
});
