import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs
import { actionMarker, resolveChaseAction } from './chase-action.mjs';

const MID = '900000000000000001';
const context = { bot: 'marjorie', already: null, message_id: MID, url: `https://discord.com/channels/900000000000000002/900000000000000003/${MID}`, text: 'assign', replying_to: { text: 'HA #76 for issue #4324' } };
const openMd = `## #76 🟡 [DECIDE] #4324 has had no activity\n<!-- ha filed=2026-09-14 -->\n<!-- marjorie-chase: 96h issue=4324 -->`;
const issue = { number: 4324, state: 'OPEN', labels: [{ name: 'marjorie-filed' }] };

describe('resolveChaseAction', () => {
  it('distinguishes HA and issue ids and plans an assignment', () => {
    expect(resolveChaseAction({ context, issues: [issue], openMd, doneMd: '' })).toMatchObject({ ok: true, ha: 76, issue: 4324, action: 'assign', label: 'founder-assigned', haOutcome: 'done' });
  });

  it('refuses ambiguous one-word targets', () => {
    const two = `${openMd}\n## #77 🟡 [DECIDE] #4325 stale\n<!-- marjorie-chase: 96h issue=4325 -->`;
    expect(resolveChaseAction({ context: { ...context, replying_to: null }, issues: [issue], openMd: two, doneMd: '' })).toMatchObject({ ok: false, reason: 'ambiguous' });
  });

  it('rejects a direct issue reference that conflicts with the replied-to chase action', () => {
    const conflicting = { ...context, text: 'assign #9999' };
    expect(
      resolveChaseAction({ context: conflicting, issues: [issue], openMd, doneMd: '' }),
    ).toMatchObject({ ok: false, reason: 'target-mismatch' });
  });

  it('treats a skipped chase as final and never resurrects it', () => {
    const doneMd = `- #76 · 2026-09-14 · skip · stale — "deferred" · by chat · <!-- marjorie-chase: 96h issue=4324 -->`;
    expect(resolveChaseAction({ context, issues: [issue], openMd: '', doneMd })).toMatchObject({ ok: true, noop: true, final: true, ha: 76 });
  });

  it('accepts only typed Marjorie bot markers for per-message idempotency', () => {
    const marker = actionMarker({ ha: 76, issue: 4324, action: 'assign', messageId: MID });
    const human = [{ body: marker, user: { login: 'claude', type: 'User' } }];
    expect(resolveChaseAction({ context, issues: [issue], openMd, doneMd: '', comments: human })).toMatchObject({ duplicate: false });
    const bot = [{ body: marker, user: { login: 'claude[bot]', type: 'Bot' } }];
    expect(resolveChaseAction({ context, issues: [issue], openMd, doneMd: '', comments: bot })).toMatchObject({ duplicate: true });
  });

  it.each([
    'defer 4324', '4324 defer', '#4324 defer', 'Defer #4324.', '  #4324   DEFER!  ', 'HA #76: defer', 'defer HA #76', 'HA 76 - defer', '#4324: defer',
  ])('accepts %j in either word order', (text) => {
    const bare = { ...context, text, replying_to: null };
    expect(resolveChaseAction({ context: bare, issues: [issue], openMd, doneMd: '' })).toMatchObject({ ok: true, ha: 76, issue: 4324, action: 'defer', label: 'deferred', haOutcome: 'skip' });
  });

  describe('with two open items', () => {
    const two = `${openMd}\n## #77 🟡 [DECIDE] #4325 stale\n<!-- marjorie-chase: 96h issue=4325 -->`;
    const issues = [issue, { number: 4325, state: 'OPEN', labels: [{ name: 'marjorie-filed' }] }];
    const run = (text: string, md = two) => resolveChaseAction({ context: { ...context, text, replying_to: null }, issues, openMd: md, doneMd: '' });

    it.each([['HA 76 - defer', 76, 4324], ['HA76 defer', 76, 4324], ['77 defer', 77, 4325], ['defer 4325', 77, 4325], ['4324 defer', 76, 4324]])('%j targets exactly one item', (text, ha, target) => {
      expect(run(text)).toMatchObject({ ok: true, ha, issue: target, action: 'defer' });
    });

    it('never acts untargeted when a number does not resolve', () => {
      expect(run('999 defer')).toMatchObject({ ok: false, reason: 'ambiguous' });
      expect(run('HA 999 defer')).toMatchObject({ ok: false });
      expect(run('HA 999 defer', openMd)).toMatchObject({ ok: false });
    });

    it('refuses a bare number that is both an HA and an issue', () => {
      const both = `${two}\n## #5000 🟡 [DECIDE] #76 stale\n<!-- marjorie-chase: 96h issue=76 -->`;
      expect(run('76 defer', both)).toMatchObject({ ok: false, reason: 'ambiguous' });
    });
  });

  it('refuses a reply naming two numbers or two actions', () => {
    const run = (text: string) => resolveChaseAction({ context: { ...context, text, replying_to: null }, issues: [issue], openMd, doneMd: '' });
    expect(run('#4324 defer #4325')).toMatchObject({ ok: false, reason: 'ambiguous' });
    expect(run('4324 defer 4325')).toMatchObject({ ok: false, reason: 'ambiguous' });
    expect(run('#4324 defer close')).toMatchObject({ ok: false });
    expect(run('defer close #4324')).toMatchObject({ ok: false });
  });

  it('does not reopen a deferred issue', () => {
    const deferred = { ...issue, labels: [...issue.labels, { name: 'deferred' }] };
    expect(resolveChaseAction({ context, issues: [deferred], openMd, doneMd: '' })).toMatchObject({ ok: true, noop: true, final: true });
  });
});
