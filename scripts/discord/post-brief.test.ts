// @ts-expect-error — Node file imports are not typed in this isolated test project
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { labelDiscordParts, postDiscordPayload, splitDiscordContent } from './post-brief.mjs';
// @ts-expect-error — implementation is plain .mjs
import { deliveryStatusFromLog } from './delivery-status.mjs';

describe('splitDiscordContent', () => {
  it('preserves a long brief in ordered parts below Discord’s limit', () => {
    const body = `${'A'.repeat(1_950)}\n\n${'B'.repeat(1_950)}\n\n${'C'.repeat(1_950)}`;
    const parts = splitDiscordContent(body, 2_000);

    expect(parts.length).toBe(3);
    expect(parts.every((part: string) => part.length <= 2_000)).toBe(true);
    expect(parts.join('')).toBe(body);
  });

  it('does not allow broadcast mentions through the delivery payload', () => {
    const [part] = splitDiscordContent('@everyone @here <@&123456789> Founder update', 2_000);

    expect(part).not.toContain('@everyone');
    expect(part).not.toContain('@here');
    expect(part).not.toContain('<@&');
  });

  it('numbers multi-part briefs while retaining every message below Discord’s limit', () => {
    const parts = labelDiscordParts('A'.repeat(4_100));

    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^\[Part 1\/3\]\n\n/);
    expect(parts[1]).toMatch(/^\[Part 2\/3\]\n\n/);
    expect(parts[2]).toMatch(/^\[Part 3\/3\]\n\n/);
    expect(parts.every((part: string) => part.length <= 2_000)).toBe(true);
  });
});

describe('deliveryStatusFromLog', () => {
  it('treats the explicit delivered marker as delivered', () => {
    expect(deliveryStatusFromLog("Delivered [Founders' Brief — 2026-09-09] to Discord")).toBe(
      'delivered',
    );
  });

  it('surfaces an unconfigured webhook without scheduling a retry', () => {
    expect(deliveryStatusFromLog('SKIPPED: DISCORD_BRIEF_WEBHOOK not configured')).toBe(
      'unconfigured',
    );
  });

  it('returns missing when no conclusive marker exists', () => {
    expect(deliveryStatusFromLog('workflow failed before delivery')).toBe('missing');
  });
});

describe('brief-mailer Discord cutover', () => {
  it('retains the established email path until Discord delivery succeeds', () => {
    const workflow = readFileSync(
      new URL('../../.github/workflows/brief-mailer.yml', import.meta.url),
      'utf8',
    );

    expect(workflow).toContain('if [ -z "${DISCORD_BRIEF_WEBHOOK:-}" ]; then');
    expect(workflow).toContain(
      'FALLBACK_EMAIL: retaining morning email until Discord delivery succeeds',
    );
    expect(workflow).toContain('elif node scripts/discord/post-brief.mjs payload.json; then');
    expect(workflow).toContain('Discord delivery verified; morning email withheld.');
    expect(workflow).toContain('FALLBACK_EMAIL: Discord delivery failed; retaining morning email');
  });
});

describe('postDiscordPayload', () => {
  it('uses a webhook without permitting Discord mentions and attaches the full brief', async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = async (_url: string, init: RequestInit) => {
      calls.push(init);
      return new Response(null, { status: 204 });
    };

    const result = await postDiscordPayload(
      {
        subject: 'Founders’ Brief',
        body: '@everyone body',
        url: 'https://github.com/JW-Incorporated/swift2/issues/1',
      },
      { webhook: 'https://discord.example/webhook', fetchImpl },
    );

    expect(result.status).toBe('delivered');
    expect(JSON.parse(String(calls[0].body))).toMatchObject({
      allowed_mentions: { parse: [] },
    });
    expect(String(calls[0].body)).not.toContain('@everyone');
    expect(calls.at(-1)?.body).toBeInstanceOf(FormData);
  });

  it('honors retry-after for a 429 without exposing the webhook', async () => {
    const waits: number[] = [];
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return calls === 1
        ? new Response(null, { status: 429, headers: { 'retry-after': '2' } })
        : new Response(null, { status: 204 });
    };

    await expect(
      postDiscordPayload(
        { subject: 'Brief', body: 'Body' },
        {
          webhook: 'https://discord.example/webhook',
          fetchImpl,
          waitImpl: async (waitMs: number) => waits.push(waitMs),
        },
      ),
    ).resolves.toMatchObject({ status: 'delivered' });
    expect(waits).toEqual([2_000]);
  });

  it('fails after exhausted 5xx retries without exposing the webhook', async () => {
    const webhook = 'https://discord.example/secret-webhook';
    await expect(
      postDiscordPayload(
        { subject: 'Brief', body: 'Body' },
        {
          webhook,
          fetchImpl: async () => new Response(null, { status: 503 }),
          waitImpl: async () => undefined,
        },
      ),
    ).rejects.toThrow('DISCORD_DELIVERY_FAILED HTTP 503');
    await expect(
      postDiscordPayload(
        { subject: 'Brief', body: 'Body' },
        {
          webhook,
          fetchImpl: async () => new Response(null, { status: 503 }),
          waitImpl: async () => undefined,
        },
      ),
    ).rejects.not.toThrow(webhook);
  });

  it('retries transient network failures without exposing the webhook', async () => {
    const webhook = 'https://discord.example/secret-webhook';
    const waits: number[] = [];
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) throw new Error(webhook);
      return new Response(null, { status: 204 });
    };

    await expect(
      postDiscordPayload(
        { subject: 'Brief', body: 'Body' },
        { webhook, fetchImpl, waitImpl: async (waitMs: number) => waits.push(waitMs) },
      ),
    ).resolves.toMatchObject({ status: 'delivered' });
    expect(waits).toEqual([1_000]);
  });

  it.each([401, 404])(
    'marks invalid webhooks distinctly without exposing their URL (%i)',
    async (status) => {
      const webhook = 'https://discord.example/invalid-webhook';
      await expect(
        postDiscordPayload(
          { subject: 'Brief', body: 'Body' },
          {
            webhook,
            fetchImpl: async () => new Response(null, { status }),
          },
        ),
      ).rejects.toThrow(`DISCORD_WEBHOOK_INVALID HTTP ${status}`);
      await expect(
        postDiscordPayload(
          { subject: 'Brief', body: 'Body' },
          {
            webhook,
            fetchImpl: async () => new Response(null, { status }),
          },
        ),
      ).rejects.not.toThrow(webhook);
    },
  );
});
