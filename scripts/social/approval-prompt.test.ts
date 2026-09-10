import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildApprovalPrompt, sendApprovalPrompt } from './approval-prompt.mjs';
// @ts-expect-error — implementation is plain .mjs
import { DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';

function pr(overrides: Record<string, unknown> = {}) {
  return { number: 4100, url: 'https://github.com/JW-Incorporated/swift2/pull/4100', ...overrides };
}

function draft(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'x',
    body: 'on this day in 2010: "mine" leaked early.',
    scheduledAt: '2026-09-11T15:00:00Z',
    campaign: 'test:campaign',
    mediaCredit: 'Photographer/Getty',
    media: '/social/library/photos/example.jpg',
    sourceRoutine: 'growth-draft',
    ...overrides,
  };
}

describe('buildApprovalPrompt', () => {
  it('includes the PR number, angle-bracket-wrapped link, and every draft field verbatim', () => {
    const content = buildApprovalPrompt(pr(), [draft()]);

    expect(content).toContain('PR #4100');
    expect(content).toContain('<https://github.com/JW-Incorporated/swift2/pull/4100>');
    expect(content).toContain('on this day in 2010: "mine" leaked early.');
    expect(content).toContain('Scheduled: 2026-09-11T15:00:00Z');
    expect(content).toContain('Campaign: test:campaign');
    expect(content).toContain('Media credit: Photographer/Getty');
    expect(content).toContain('<https://github.com/JW-Incorporated/swift2/pull/4100>');
    expect(content).toContain('Media: </social/library/photos/example.jpg>');
    expect(content).toContain('Source routine: growth-draft');
    expect(content).toContain('Merge the PR to approve. Close it to reject.');
  });

  it('neutralizes broadcast mentions in an untrusted caption body', () => {
    const content = buildApprovalPrompt(pr(), [draft({ body: '@everyone check this out' })]);
    expect(content).not.toContain('@everyone check');
  });

  it('escapes a caption body that itself contains a triple-backtick fence', () => {
    const content = buildApprovalPrompt(pr(), [draft({ body: 'before ```danger``` after' })]);
    // The escaped fence must not terminate the surrounding code block early.
    expect(content).not.toMatch(/```\n?danger/);
  });

  it('formats multiple drafts (the X+Instagram sibling pair)', () => {
    const content = buildApprovalPrompt(pr(), [
      draft({ platform: 'x' }),
      draft({ platform: 'instagram', body: 'IG sibling body' }),
    ]);
    expect(content).toContain('Draft 1 · X');
    expect(content).toContain('Draft 2 · Instagram');
    expect(content).toContain('IG sibling body');
  });
});

describe('sendApprovalPrompt', () => {
  it('chunks a long prompt at the Discord limit and sends each chunk', async () => {
    const longBody = 'word '.repeat(500); // pushes the built prompt over 2000 chars
    const content = buildApprovalPrompt(pr(), [draft({ body: longBody })]);
    expect(content.length).toBeGreaterThan(DISCORD_MESSAGE_LIMIT);

    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      return new Response(JSON.stringify({ id: `msg-${call}` }), { status: 200 });
    });

    const result = await sendApprovalPrompt(content, {
      webhook: 'https://discord.example/webhook',
      fetchImpl,
    });

    expect(result.status).toBe('delivered');
    expect(result.delivered.length).toBeGreaterThan(1);
    expect(result.failed).toEqual([]);
    for (const [, init] of fetchImpl.mock.calls) {
      const body = JSON.parse(String((init as { body: string }).body));
      expect(body.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    }
  });

  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendApprovalPrompt('short content', { webhook: '', fetchImpl });

    expect(result).toEqual({ status: 'unconfigured', delivered: [], failed: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('isolates a failed chunk send — the rest still deliver', async () => {
    const longBody = 'word '.repeat(500);
    const content = buildApprovalPrompt(pr(), [draft({ body: longBody })]);

    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      if (call === 1) return new Response('boom', { status: 500 });
      return new Response(JSON.stringify({ id: `msg-${call}` }), { status: 200 });
    });

    const result = await sendApprovalPrompt(content, {
      webhook: 'https://discord.example/webhook',
      fetchImpl,
    });

    expect(result.status).toBe('partial');
    expect(result.failed).toEqual([{ chunk: 0, message: expect.stringContaining('HTTP 500') }]);
    expect(result.delivered.length).toBeGreaterThan(0);
  });
});
